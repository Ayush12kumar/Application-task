export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export interface HCP {
  id: number;
  name: string;
  hospital: string;
  specialization: string;
  email?: string;
  phone?: string;
  address?: string;
  tier: 'Priority A' | 'Priority B' | 'Priority C' | string;
  relationship_score: number;
  risk_score: number;
  opportunity_score: number;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  description?: string;
  indications?: string;
  dosage?: string;
  sample_available: boolean;
}

export interface SampleGiven {
  product: string;
  quantity: number;
}

export interface InteractionHistoryRecord {
  id: number;
  interaction_id: number;
  version: number;
  changed_by_user_id: number;
  previous_data: Record<string, any>;
  changed_at: string;
}

export interface Interaction {
  id: number;
  hcp_id: number;
  user_id: number;
  interaction_date: string;
  interaction_type: 'Visit' | 'Phone' | 'Email' | 'Conference' | string;
  duration_minutes: number;
  discussion_topics?: string;
  products_discussed: string[];
  samples_given: SampleGiven[];
  follow_up_required: boolean;
  follow_up_date?: string;
  notes?: string;
  ai_summary?: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative' | string;
  priority: 'High' | 'Medium' | 'Low' | string;
  next_action?: string;
  confidence_score: number;
  status: 'draft' | 'saved' | string;
  version: number;
  created_at?: string;
  updated_at?: string;
  hcp?: HCP;
  history?: InteractionHistoryRecord[];
}

export interface Followup {
  id: number;
  hcp_id: number;
  interaction_id?: number;
  user_id: number;
  suggested_date: string;
  strategy: string;
  talking_points: string[];
  status: 'pending' | 'completed' | 'cancelled' | string;
  priority: 'High' | 'Medium' | 'Low' | string;
  hcp?: HCP;
}

export interface ExtractedPreview {
  hcp_id?: number;
  hcp_name?: string;
  hospital?: string;
  specialization?: string;
  interaction_date?: string;
  interaction_type?: string;
  duration_minutes?: number;
  products_discussed?: string[];
  samples_given?: SampleGiven[];
  follow_up_required?: boolean;
  follow_up_date?: string;
  notes?: string;
  ai_summary?: string;
  sentiment?: string;
  priority?: string;
  next_action?: string;
  confidence_score?: number;
  duplicate_warning?: string;
}

export interface LangGraphStep {
  node: string;
  tool_used?: string;
  input_summary: string;
  output_summary: string;
  latency_ms: number;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: string;
  intent?: string;
  extracted_preview?: ExtractedPreview;
  trace?: LangGraphStep[];
  confidence_score?: number;
}

export interface SentimentBreakdown {
  Positive: number;
  Neutral: number;
  Negative: number;
}

export interface ProductDiscussionMetric {
  product_name: string;
  count: number;
  percentage: number;
}

export interface InteractionTimelineMetric {
  date: string;
  visits: number;
  calls: number;
  emails: number;
}

export interface AnalyticsSummary {
  total_hcps: number;
  total_interactions: number;
  pending_followups: number;
  average_sentiment_score: number;
  high_priority_actions: number;
  opportunity_index: number;
  sentiment_breakdown: SentimentBreakdown;
  top_products_discussed: ProductDiscussionMetric[];
  interactions_timeline: InteractionTimelineMetric[];
  recent_agent_logs: Record<string, any>[];
}
