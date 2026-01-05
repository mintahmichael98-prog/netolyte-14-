









export interface Lead {
  id: number;
  company: string;
  description: string;
  location: string;
  confidence: number;
  website: string;
  contact: string;
  industry: string;
  employees: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  googleMapsUrl?: string;
  socials?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
  };
  management?: {
    name: string;
    role: string;
    linkedin?: string;
    email?: string;
  }[];
  status?: LeadStatus;
  score?: number;
  notes?: LeadNote[];
  tasks?: LeadTask[]; // Salesforce feature: Tasks
  activity?: ActivityItem[];
  assignedTo?: string; 
  sequenceId?: string;
  lastContacted?: string;
  ownerId?: string;
  
  // Dialer Specific
  isPhoneInvalid?: boolean;
  callLogs?: CallLog[];
  callCount?: number;
}

export interface LeadTask {
  id: string;
  title: string;
  dueDate: string;
  priority: 'High' | 'Normal' | 'Low';
  status: 'Open' | 'Completed';
  assignedTo: string;
}

export interface CallLog {
  id: string;
  timestamp: string;
  outcome: CallOutcome;
  notes?: string;
  durationSeconds?: number;
  user: string;
  analysis?: CallAnalysis; // AI Feedback
}

export interface CallAnalysis {
  summary: string;
  confidenceScore: number; // 0-100
  sentiment: 'positive' | 'neutral' | 'negative';
  coachingTips: string[];
  missedOpportunities: string[];
}

export interface TranscriptLine {
  speaker: 'agent' | 'prospect';
  text: string;
  timestamp: number;
}

export type CallOutcome = 'answered' | 'voicemail' | 'wrong_number' | 'busy' | 'skipped';

export interface LeadNote {
  id: string;
  text: string;
  author: string;
  date: string;
}

export interface ActivityItem {
  id: string;
  type: 'note' | 'status_change' | 'assignment' | 'creation' | 'sequence_add' | 'call_log' | 'task';
  content: string;
  author: string;
  timestamp: string;
  metadata?: {
    oldValue?: string;
    newValue?: string;
    outcome?: CallOutcome;
  };
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'negotiation' | 'won' | 'lost' | 'attempted' | 'bad_data';

export enum ViewMode {
  DASHBOARD = 'dashboard',
  LIST = 'list',
  MAP = 'map',
  PIPELINE = 'pipeline',
  SAVED = 'saved',
  REPORTS = 'reports',
  ANALYTICS = 'analytics',
  COMPETITORS = 'competitors',
  EMAIL_WARMUP = 'email_warmup',
  LOOKALIKE = 'lookalike',
  ROLEPLAY = 'roleplay',
  SEQUENCES = 'sequences',
  TEAM = 'team',
  DIALER = 'dialer',
  STRATEGY = 'strategy',
  SIGNALS = 'signals',
  BOOKING = 'booking'
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'assignment';
  message: string;
  timestamp: string;
  read: boolean;
  link?: {
    view: ViewMode;
    leadId: number;
  };
}

export interface Signal {
  leadId: number;
  leadCompany: string;
  title: string;
  summary: string;
  source: string;
  timestamp: string;
}


export interface SearchState {
  query: string;
  isSearching: boolean;
  progressStep: number;
  batchesCompleted: number;
  totalLeads: number;
  error: string | null;
}

export interface LeadFilters {
  location: string;
  industry: string;
  employees: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  credits: number;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  role?: 'admin' | 'user';
  avatar?: string; 
  status?: 'online' | 'busy' | 'away' | 'offline' | 'in-call' | 'ringing';
}

export interface Transaction {
  id: string;
  date: string;
  type: 'search' | 'purchase' | 'bonus';
  amount: number;
  description: string;
}

export interface Source {
  title: string;
  url: string;
}

export interface CompetitorAnalysis {
  target: {
    name: string;
    industry: string;
    summary: string;
  };
  competitors: {
    name: string;
    website: string;
    description: string;
    strength: string;
    weakness: string;
    socials?: {
      linkedin?: string;
      twitter?: string;
      facebook?: string;
      instagram?: string;
    };
  }[];
}

export type Language = 'en' | 'es' | 'fr' | 'de';

export interface AppSettings {
  webhookUrl: string;
  brandVoice: string;
  language: Language;
  salesforce?: {
    connected: boolean;
    instanceUrl: string;
    clientId: string;
    autoSync: boolean;
  };
}

export interface Sequence {
  id: string;
  name: string;
  activeLeads: number;
  steps: SequenceStep[];
}

export interface SequenceStep {
  id: string;
  day: number;
  type: 'email' | 'call' | 'linkedin' | 'task';
  title: string;
  content?: string;
}

export interface SalesStrategy {
  icp: {
    industries: string[];
    roles: string[];
    companySize: string[];
    location: string;
  };
  painPoints: {
    title: string;
    description: string;
  }[];
  valueProp: string;
  pitch: string;
  suggestedSearchQuery: string;
}

export interface BookingSettings {
  isConnected: boolean;
  urlSlug: string;
  meetingTitle: string;
  meetingDuration: number;
  availability: {
    [day: string]: {
      enabled: boolean;
      startTime: string;
      endTime: string;
    };
  };
}

export const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Real Estate', 'Retail', 'Manufacturing', 'Education', 'Energy', 'Consulting', 'Marketing', 'Legal', 'Construction', 'Transportation', 'Other'
];

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected';

export interface CallSession {
  callId: string;
  callerId: string;
  callerName: string;
  receiverId: string;
  receiverName: string;
  state: CallState;
  isVideo: boolean;
}

export interface SignalingMessage {
  type: 'invite' | 'accept' | 'reject' | 'offer' | 'answer' | 'candidate' | 'hangup' | 'chat:message' | 'chat:typing';
  payload: any;
  from: string;
  to: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string; // User ID or Group ID
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  senderName?: string; // Optional for group chats
}

export interface ChatGroup {
  id: string;
  name: string;
  type: 'public' | 'private';
  members: string[];
  description?: string;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
}