import time
import json
import re
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from sqlalchemy.orm import Session
from app.models.schema import AgentLog, ChatMessage
from app.ai.tools.tool_log_interaction import execute_log_interaction
from app.ai.tools.tool_edit_interaction import execute_edit_interaction
from app.ai.tools.tool_retrieve_profile import execute_retrieve_profile
from app.ai.tools.tool_generate_followup import execute_generate_followup
from app.ai.tools.tool_meeting_insights import execute_meeting_insights

class AgentState(TypedDict):
    session_id: str
    user_id: int
    hcp_id: Optional[int]
    input_message: str
    intent: str
    intent_confidence: float
    entities: Dict[str, Any]
    selected_tool: str
    tool_output: Dict[str, Any]
    final_reply: str
    confidence_score: float
    trace_steps: List[Dict[str, Any]]
    db_session: Any  # SQLAlchemy Session


# Node 1: Intent Detection
def node_intent_detection(state: AgentState) -> AgentState:
    t0 = time.time()
    msg = state["input_message"].lower()
    
    intent = "log_interaction"
    conf = 0.96
    
    # Heuristic / intent rules (or Groq classification)
    if any(w in msg for w in ["change", "update", "edit", "reschedule", "modify"]):
        if "follow-up date" in msg or "sentiment" in msg or "add product" in msg or "priority" in msg or "edit" in msg:
            intent = "edit_interaction"
    elif any(w in msg for w in ["profile", "history", "past visits", "preferences", "prescription trend", "retrieve"]):
        intent = "retrieve_profile"
    elif any(w in msg for w in ["follow-up plan", "generate follow up", "followup strategy", "talking points"]):
        intent = "generate_followup"
    elif any(w in msg for w in ["meeting insights", "relationship score", "risk score", "opportunity score", "insights"]):
        intent = "meeting_insights"
    elif any(w in msg for w in ["hello", "hi ", "how does this", "help", "what can you do"]):
        intent = "general_chat"
    else:
        # Default to log_interaction for typical field notes
        intent = "log_interaction"

    latency = round((time.time() - t0) * 1000, 2)
    step_record = {
        "node": "IntentDetection",
        "tool_used": None,
        "input_summary": f"User Input: '{state['input_message'][:60]}...'",
        "output_summary": f"Detected Intent: {intent} (Confidence: {conf})",
        "latency_ms": latency
    }
    
    _log_step_to_db(state, "IntentDetection", None, {"message": state["input_message"]}, {"intent": intent, "confidence": conf}, latency)
    
    state["intent"] = intent
    state["intent_confidence"] = conf
    state["trace_steps"].append(step_record)
    return state


# Node 2: Entity Extraction
def node_entity_extraction(state: AgentState) -> AgentState:
    t0 = time.time()
    msg = state["input_message"]
    
    # Extract baseline doctor or fields if mentioned
    doctor_match = re.search(r"(Dr\.\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?|Doctor\s+[A-Z][a-z]+)", msg, re.IGNORECASE)
    doctor_name = doctor_match.group(0) if doctor_match else None
    
    hospital_match = re.search(r"([A-Z][a-zA-Z\s]+(Hospital|Clinic|Medical Center|Institute))", msg)
    hospital = hospital_match.group(1) if hospital_match else None

    entities = {
        "doctor_name": doctor_name,
        "hospital": hospital,
        "raw_text": msg
    }
    
    latency = round((time.time() - t0) * 1000, 2)
    step_record = {
        "node": "EntityExtraction",
        "tool_used": None,
        "input_summary": f"Intent: {state['intent']}",
        "output_summary": f"Extracted NER: Doctor={doctor_name or 'Auto'}, Hospital={hospital or 'Auto'}",
        "latency_ms": latency
    }
    
    _log_step_to_db(state, "EntityExtraction", None, {"intent": state["intent"]}, entities, latency)
    
    state["entities"] = entities
    state["trace_steps"].append(step_record)
    return state


# Node 3: Select Tool
def node_tool_selector(state: AgentState) -> AgentState:
    t0 = time.time()
    intent = state["intent"]
    
    tool_map = {
        "log_interaction": "tool_log_interaction",
        "edit_interaction": "tool_edit_interaction",
        "retrieve_profile": "tool_retrieve_profile",
        "generate_followup": "tool_generate_followup",
        "meeting_insights": "tool_meeting_insights",
        "general_chat": "none"
    }
    selected = tool_map.get(intent, "tool_log_interaction")
    
    latency = round((time.time() - t0) * 1000, 2)
    step_record = {
        "node": "ToolSelector",
        "tool_used": selected,
        "input_summary": f"Intent: {intent}",
        "output_summary": f"Routed to Tool: {selected}",
        "latency_ms": latency
    }
    
    _log_step_to_db(state, "ToolSelector", selected, {"intent": intent}, {"selected_tool": selected}, latency)
    
    state["selected_tool"] = selected
    state["trace_steps"].append(step_record)
    return state


# Node 4: Execute Tool
def node_execute_tool(state: AgentState) -> AgentState:
    t0 = time.time()
    tool = state["selected_tool"]
    db: Session = state["db_session"]
    msg = state["input_message"]
    hcp_id = state["hcp_id"]
    user_id = state["user_id"]
    
    output = {}
    if tool == "tool_log_interaction":
        output = execute_log_interaction(msg, db, user_id)
    elif tool == "tool_edit_interaction":
        output = execute_edit_interaction(msg, db, None, user_id)
    elif tool == "tool_retrieve_profile":
        output = execute_retrieve_profile(msg, db, hcp_id)
    elif tool == "tool_generate_followup":
        output = execute_generate_followup(msg, db, hcp_id, None, user_id)
    elif tool == "tool_meeting_insights":
        output = execute_meeting_insights(msg, db, hcp_id)
    else:
        output = {
            "status": "success",
            "tool_used": "none",
            "summary": "I am your AI-First CRM Assistant. I can help you log interactions, edit past visits, retrieve doctor profiles, generate strategic follow-up plans, or analyze relationship risk scores!"
        }

    latency = round((time.time() - t0) * 1000, 2)
    step_record = {
        "node": "ExecuteTool",
        "tool_used": tool,
        "input_summary": f"Executing {tool} with input message",
        "output_summary": f"Result Status: {output.get('status', 'success')} - {output.get('summary', '')[:60]}...",
        "latency_ms": latency
    }
    
    _log_step_to_db(state, "ExecuteTool", tool, {"message": msg, "hcp_id": hcp_id}, output, latency)
    
    state["tool_output"] = output
    state["trace_steps"].append(step_record)
    return state


# Node 5: LLM Response Generator
def node_response_generator(state: AgentState) -> AgentState:
    t0 = time.time()
    tool_out = state.get("tool_output", {})
    summary = tool_out.get("summary", "Done.")
    
    # Format natural response
    reply = summary
    conf = 0.96
    
    if state["selected_tool"] == "tool_log_interaction":
        preview = tool_out.get("extracted_preview", {})
        doc = preview.get("hcp_name", "the Doctor")
        prods = ", ".join(preview.get("products_discussed", []))
        reply = f"✅ **Interaction Logged Successfully for {doc}**\n\n**Products Discussed:** {prods}\n**AI Summary:** {preview.get('ai_summary')}\n**Next Action:** {preview.get('next_action')}\n\n*The structured record is available in your preview window on the right for immediate editing and verification.*"
        conf = preview.get("confidence_score", 0.96)
    elif state["selected_tool"] == "tool_edit_interaction":
        changes = ", ".join(tool_out.get("changes_made", ["Fields updated"]))
        reply = f"📝 **Interaction Updated (Version {tool_out.get('version')})**\n\n**Modifications:** {changes}\n*Your previous version snapshot has been securely archived in the audit log.*"
    elif state["selected_tool"] == "tool_retrieve_profile":
        prof = tool_out.get("profile", {})
        reply = f"🏥 **Profile Overview: {prof.get('name')}**\n\n- **Hospital:** {prof.get('hospital')}\n- **Specialization:** {prof.get('specialization')} ({prof.get('tier')})\n- **Relationship Score:** {prof.get('relationship_score')}/100\n- **Prescription Trend:** {prof.get('prescription_trend')}\n- **Preferred Products:** {', '.join(prof.get('preferred_products', []))}"
    elif state["selected_tool"] == "tool_generate_followup":
        fp = tool_out.get("followup_plan", {})
        tp = "\n".join([f"  • {item}" for item in fp.get("talking_points", [])])
        reply = f"📅 **Strategic Follow-up Plan Generated**\n\n- **Suggested Date:** {fp.get('suggested_date')}\n- **Priority:** {fp.get('priority')}\n- **Strategy:** {fp.get('strategy')}\n- **Key Talking Points:**\n{tp}"
    elif state["selected_tool"] == "tool_meeting_insights":
        recs = "\n".join([f"  • {r}" for r in tool_out.get("recommendations", [])])
        reply = f"📊 **Meeting Insights & AI Scoring**\n\n- **Relationship Score:** {tool_out.get('relationship_score')}/100\n- **Risk Score:** {tool_out.get('risk_score')}/100\n- **Opportunity Score:** {tool_out.get('opportunity_score')}/100\n\n**Actionable Recommendations:**\n{recs}"

    latency = round((time.time() - t0) * 1000, 2)
    step_record = {
        "node": "LLMResponseGenerator",
        "tool_used": state["selected_tool"],
        "input_summary": "Synthesizing tool output into natural response",
        "output_summary": f"Generated formatted reply (Confidence: {conf})",
        "latency_ms": latency
    }
    
    _log_step_to_db(state, "LLMResponseGenerator", state["selected_tool"], {"summary": summary}, {"reply": reply, "confidence": conf}, latency)
    
    state["final_reply"] = reply
    state["confidence_score"] = conf
    state["trace_steps"].append(step_record)
    return state


# Node 6: Database Updater
def node_db_updater(state: AgentState) -> AgentState:
    t0 = time.time()
    db: Session = state["db_session"]
    
    # Log user message & assistant reply into ChatMessage table
    user_msg = ChatMessage(
        session_id=state["session_id"],
        user_id=state["user_id"],
        hcp_id=state.get("hcp_id"),
        role="user",
        content=state["input_message"]
    )
    db.add(user_msg)
    
    preview = state.get("tool_output", {}).get("extracted_preview")
    assistant_msg = ChatMessage(
        session_id=state["session_id"],
        user_id=state["user_id"],
        hcp_id=state.get("hcp_id"),
        role="assistant",
        content=state["final_reply"],
        metadata_json={
            "intent": state["intent"],
            "confidence_score": state["confidence_score"],
            "extracted_preview": preview,
            "trace_steps": state["trace_steps"]
        }
    )
    db.add(assistant_msg)
    db.commit()

    latency = round((time.time() - t0) * 1000, 2)
    step_record = {
        "node": "DatabaseUpdater",
        "tool_used": None,
        "input_summary": "Persisting session messages & agent metadata to PostgreSQL",
        "output_summary": "Chat messages and execution logs committed successfully",
        "latency_ms": latency
    }
    
    state["trace_steps"].append(step_record)
    return state


def _log_step_to_db(state: AgentState, step_name: str, tool_name: Optional[str], input_data: Any, output_data: Any, latency: float):
    try:
        db: Session = state["db_session"]
        log = AgentLog(
            session_id=state["session_id"],
            step_name=step_name,
            tool_name=tool_name,
            input_data=input_data if isinstance(input_data, dict) else {"data": str(input_data)},
            output_data=output_data if isinstance(output_data, dict) else {"data": str(output_data)},
            execution_time_ms=latency
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"[AgentLog] Error saving log: {e}")


def build_crm_agent_graph() -> Any:
    """
    Constructs the complete stateful LangGraph workflow definition.
    Workflow: Input ➔ IntentDetection ➔ EntityExtraction ➔ ToolSelector ➔ ExecuteTool ➔ LLMResponse ➔ DBUpdate ➔ END
    """
    workflow = StateGraph(AgentState)

    workflow.add_node("intent_detection", node_intent_detection)
    workflow.add_node("entity_extraction", node_entity_extraction)
    workflow.add_node("tool_selector", node_tool_selector)
    workflow.add_node("execute_tool", node_execute_tool)
    workflow.add_node("response_generator", node_response_generator)
    workflow.add_node("db_updater", node_db_updater)

    workflow.set_entry_point("intent_detection")
    workflow.add_edge("intent_detection", "entity_extraction")
    workflow.add_edge("entity_extraction", "tool_selector")
    workflow.add_edge("tool_selector", "execute_tool")
    workflow.add_edge("execute_tool", "response_generator")
    workflow.add_edge("response_generator", "db_updater")
    workflow.add_edge("db_updater", END)

    return workflow.compile()

# Global compiled agent instance
crm_agent = build_crm_agent_graph()
