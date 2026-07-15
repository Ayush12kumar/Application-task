from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(100), default="Medical Representative")
    created_at = Column(DateTime, default=datetime.utcnow)

    interactions = relationship("Interaction", back_populates="user")
    followups = relationship("Followup", back_populates="user")


class HCP(Base):
    __tablename__ = "hcps"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    hospital = Column(String(255), nullable=False, index=True)
    specialization = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    tier = Column(String(50), default="Priority A")  # Priority A, B, C
    
    # Meeting Insights AI Scores
    relationship_score = Column(Float, default=75.0)  # 0 to 100
    risk_score = Column(Float, default=15.0)          # 0 to 100 (churn/disengagement risk)
    opportunity_score = Column(Float, default=85.0)   # 0 to 100 (prescription adoption potential)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    interactions = relationship("Interaction", back_populates="hcp", cascade="all, delete-orphan")
    followups = relationship("Followup", back_populates="hcp", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    category = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    indications = Column(String(255), nullable=True)
    dosage = Column(String(150), nullable=True)
    sample_available = Column(Boolean, default=True)


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    hcp_id = Column(Integer, ForeignKey("hcps.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    interaction_date = Column(String(100), nullable=False)
    interaction_type = Column(String(100), default="Visit")  # Visit, Phone, Email, Conference
    duration_minutes = Column(Integer, default=30)
    
    discussion_topics = Column(Text, nullable=True)
    products_discussed = Column(JSON, default=list)  # List of product strings/dict
    samples_given = Column(JSON, default=list)       # List of {product: str, quantity: int}
    
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(String(100), nullable=True)
    
    notes = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    sentiment = Column(String(50), default="Positive")  # Positive, Neutral, Negative
    priority = Column(String(50), default="Medium")     # High, Medium, Low
    next_action = Column(Text, nullable=True)
    confidence_score = Column(Float, default=0.95)      # AI extraction confidence score
    
    status = Column(String(50), default="saved")        # draft, saved
    version = Column(Integer, default=1)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hcp = relationship("HCP", back_populates="interactions")
    user = relationship("User", back_populates="interactions")
    history = relationship("InteractionHistory", back_populates="interaction", cascade="all, delete-orphan")
    followups = relationship("Followup", back_populates="interaction", cascade="all, delete-orphan")


class InteractionHistory(Base):
    __tablename__ = "interaction_history"

    id = Column(Integer, primary_key=True, index=True)
    interaction_id = Column(Integer, ForeignKey("interactions.id"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    changed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    previous_data = Column(JSON, nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)

    interaction = relationship("Interaction", back_populates="history")


class Followup(Base):
    __tablename__ = "followups"

    id = Column(Integer, primary_key=True, index=True)
    hcp_id = Column(Integer, ForeignKey("hcps.id"), nullable=False, index=True)
    interaction_id = Column(Integer, ForeignKey("interactions.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    suggested_date = Column(String(100), nullable=False)
    strategy = Column(Text, nullable=False)
    talking_points = Column(JSON, default=list)  # List of strings
    status = Column(String(50), default="pending")  # pending, completed, cancelled
    priority = Column(String(50), default="High")
    
    created_at = Column(DateTime, default=datetime.utcnow)

    hcp = relationship("HCP", back_populates="followups")
    interaction = relationship("Interaction", back_populates="followups")
    user = relationship("User", back_populates="followups")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(150), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    hcp_id = Column(Integer, ForeignKey("hcps.id"), nullable=True)
    
    role = Column(String(50), nullable=False)  # user, assistant, tool
    content = Column(Text, nullable=False)
    metadata_json = Column(JSON, default=dict)  # extracted preview, tool calls, confidence
    
    created_at = Column(DateTime, default=datetime.utcnow)


class AgentLog(Base):
    __tablename__ = "agent_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(150), nullable=False, index=True)
    step_name = Column(String(150), nullable=False)  # IntentDetection, EntityExtraction, ToolExecution
    tool_name = Column(String(150), nullable=True)
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    execution_time_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
