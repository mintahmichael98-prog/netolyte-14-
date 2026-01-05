
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ViewMode, Lead, SearchState, UserProfile, Transaction, LeadStatus, AppSettings, LeadFilters, INDUSTRIES, Sequence, LeadNote, ActivityItem, Notification, BookingSettings } from './types';
import { generateLeadsBatch } from './services/geminiService';
import { authService } from './services/authService';
import { useWebRTC } from './hooks/useWebRTC'; 
import { useUserPresence } from './hooks/useUserPresence';
import Dashboard from './components/Dashboard';
import LeadTable from './components/LeadTable';
import MapView from './components/MapView';
import PipelineBoard from './components/PipelineBoard';
import CompetitorScanner from './components/CompetitorScanner';
import EmailWarmup from './components/EmailWarmup';
import LookalikeFinder from './components/LookalikeFinder';
import RoleplayDojo from './components/RoleplayDojo';
import SequenceBuilder from './components/SequenceBuilder';
import PowerDialer from './components/PowerDialer'; 
import SalesStrategyView from './components/SalesStrategy';
import EmailSequenceModal from './components/EmailSequenceModal';
import WhatsAppCampaignModal from './components/WhatsAppCampaignModal';
import SMSCampaignModal from './components/SMSCampaignModal';
import ActivityDrawer from './components/ActivityDrawer';
import SavedLists from './components/SavedLists';
import ReportsView from './components/ReportsView';
import TeamManagement from './components/TeamManagement';
import CallWidget from './components/CallWidget'; 
import ChatWidget from './components/ChatWidget'; 
import LeadSignals from './components/LeadSignals';
import NotificationCenter from './components/NotificationCenter';
import BookingCalendar from './components/BookingCalendar';
import LeadDetailsModal from './components/LeadDetailsModal';
import { ImportModal } from './components/ImportModal';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';
import { TermsModal, PrivacyModal } from './components/LegalModals';
import { ExportModal } from './components/ExportModal';
import SettingsModal from './components/SettingsModal';
import { exportDashboardToPDF } from './utils/exportPDF';
import { exportToHubSpot, exportToSalesforce } from './utils/exportCRM';
import { exportToCSV } from './utils/exportCSV';
import { calculateLeadScore } from './utils/leadScore';
import { t } from './utils/i18n';
import toast, { Toaster } from 'react-hot-toast';
import html2canvas from 'html2canvas';
import {
  Download, Moon, Sun, Search, LayoutDashboard, List, Database, Zap,
  CreditCard, LogOut, Star, Upload, Loader2, Filter, FileSpreadsheet, Ban, Map, MessageCircle, Kanban, Target, ShieldCheck, MessageSquare, Users, Settings as SettingsIcon, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, MapPin, Building, Menu, X, BarChart3, History, Bot, Workflow, ArrowRight, FolderOpen, RotateCcw, Eye, Chrome, Phone, Lightbulb, Sparkles, UserPlus, Bell, Calendar
} from 'lucide-react';

const BATCH_SIZE = 10;
const MAX_BATCHES = 50;

interface NavItemProps {
  item: { id: ViewMode; label: string; icon: any };
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ item, isActive, isCollapsed, onClick }) => (
  <button 
    onClick={onClick} 
    title={isCollapsed ? item.label : undefined}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 text-sm font-medium group ${
      isActive 
        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
    } ${isCollapsed ? 'justify-center' : ''}`}
  >
    <item.icon className={`w-4 h-4 transition-colors shrink-0 ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-400 group-hover:text-indigo-500'}`} />
    
    {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
  </button>
);

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('leadgenius_dark_mode');
    return saved ? JSON.parse(saved) : true;
  });

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    isSearching: false,
    progressStep: 0,
    batchesCompleted: 0,
    totalLeads: 0,
    error: null
  });

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<LeadFilters>({
    location: '',
    industry: '',
    employees: ''
  });

  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [favoriteSearches, setFavoriteSearches] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState<any[]>([]); 
  const [showHistory, setShowHistory] = useState(false); 

  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('leadgenius_settings');
    return saved ? JSON.parse(saved) : { webhookUrl: '', brandVoice: 'Professional, concise, and value-driven.', language: 'en' };
  });

  const [bookingSettings, setBookingSettings] = useState<BookingSettings>(() => {
    const saved = localStorage.getItem('leadgenius_booking_settings');
    return saved ? JSON.parse(saved) : {
      isConnected: false,
      urlSlug: '',
      meetingTitle: '15 Minute Meeting',
      meetingDuration: 15,
      availability: {
        monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        saturday: { enabled: false, startTime: '09:00', endTime: '17:00' },
        sunday: { enabled: false, startTime: '09:00', endTime: '17:00' },
      }
    };
  });

  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<number>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('leadgenius_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [showPricing, setShowPricing] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false); 
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeActivityLead, setActiveActivityLead] = useState<Lead | null>(null);
  const [selectedLeadDetails, setSelectedLeadDetails] = useState<Lead | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [collapsedNavGroups, setCollapsedNavGroups] = useState<Record<string, boolean>>({});
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Dynamic Navigation Groups based on language
  const navGroups = useMemo(() => [
    {
      id: 'discover',
      label: t('nav.discover', settings.language),
      items: [
        { id: ViewMode.DASHBOARD, label: t('nav.search', settings.language), icon: Search },
        { id: ViewMode.SAVED, label: t('nav.saved', settings.language), icon: FolderOpen },
        { id: ViewMode.COMPETITORS, label: t('nav.competitors', settings.language), icon: Target },
        { id: ViewMode.LOOKALIKE, label: t('nav.lookalike', settings.language), icon: Users },
      ]
    },
    {
      id: 'engage',
      label: t('nav.engage', settings.language),
      items: [
        { id: ViewMode.PIPELINE, label: t('nav.pipeline', settings.language), icon: Kanban },
        { id: ViewMode.MAP, label: t('nav.map', settings.language), icon: Map },
        { id: ViewMode.DIALER, label: t('nav.dialer', settings.language), icon: Phone },
        { id: ViewMode.SEQUENCES, label: t('nav.sequences', settings.language), icon: Workflow },
        { id: ViewMode.BOOKING, label: t('nav.booking', settings.language), icon: Calendar },
        { id: ViewMode.ROLEPLAY, label: t('nav.roleplay', settings.language), icon: Bot },
        { id: ViewMode.STRATEGY, label: t('nav.strategy', settings.language), icon: Lightbulb },
      ]
    },
    {
      id: 'intelligence',
      label: t('nav.intelligence', settings.language),
      items: [
         { id: ViewMode.SIGNALS, label: t('nav.signals', settings.language), icon: Zap },
         { id: ViewMode.REPORTS, label: t('nav.reports', settings.language), icon: FileSpreadsheet },
      ]
    },
    {
      id: 'tools',
      label: t('nav.tools', settings.language),
      items: [
         { id: ViewMode.TEAM, label: t('nav.team', settings.language), icon: Users },
         { id: ViewMode.EMAIL_WARMUP, label: t('nav.email_warmup', settings.language), icon: ShieldCheck },
      ]
    }
  ], [settings.language]);

  const toggleNavGroup = (groupId: string) => {
    setCollapsedNavGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };
  
  // TEAM STATE
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [viewingAsId, setViewingAsId] = useState<string | null>(null); 
  
  const [sequences, setSequences] = useState<Sequence[]>(() => {
    const saved = localStorage.getItem('leadgenius_sequences');
    return saved ? JSON.parse(saved) : [];
  });

  const userRef = useRef<UserProfile | null>(null);
  userRef.current = user;

  // Hooks
  useUserPresence(user, setUser);
  const { 
    callState, 
    activeCall, 
    startCall, 
    acceptCall, 
    rejectCall, 
    endCall, 
    toggleMute, 
    toggleVideo,
    isMuted, 
    isVideoEnabled,
    remoteAudioRef,
    localStream,
    remoteStream 
  } = useWebRTC(user);

  // Initialize Team and Mock Data Ownership
  useEffect(() => {
    const initTeam = async () => {
      const members = await authService.getTeamMembers();
      setTeamMembers(members);
      
      setLeads(prev => prev.map(l => {
        const changes: Partial<Lead> = {};
        if (!l.ownerId) {
          const randomOwner = members[Math.floor(Math.random() * members.length)];
          changes.ownerId = randomOwner.id;
        }
        if (!l.activity) {
          changes.activity = [{
            id: `init_${Date.now()}_${l.id}`,
            type: 'creation',
            content: 'Lead imported/created',
            author: 'System',
            timestamp: new Date().toISOString()
          }];
        }
        return { ...l, ...changes };
      }));
    };
    initTeam();
  }, []);

  // Filter Leads based on "Viewing As"
  const visibleLeads = useMemo(() => {
    if (!viewingAsId) return leads; 
    return leads.filter(l => l.ownerId === viewingAsId);
  }, [leads, viewingAsId]);

  const viewingAsUser = teamMembers.find(m => m.id === viewingAsId);

  useEffect(() => {
    localStorage.setItem('leadgenius_dark_mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const saved = localStorage.getItem('savedLeadSearches');
    if (saved) setSavedSearches(JSON.parse(saved));

    const favs = localStorage.getItem('favorite_searches');
    if (favs) setFavoriteSearches(JSON.parse(favs));
    
    const history = localStorage.getItem('search_history');
    if (history) setSearchHistory(JSON.parse(history));

    const lastUser = localStorage.getItem('leadgenius_last_user');
    if (lastUser) handleLogin(lastUser);

    const savedLeads = localStorage.getItem('current_leads');
    const savedQuery = localStorage.getItem('current_query');
    if (savedLeads && savedQuery) {
      setLeads(JSON.parse(savedLeads));
      setSearchState(s => ({ ...s, query: savedQuery }));
      toast.success('Session restored');
    }
  }, []);

  useEffect(() => {
    if (leads.length > 0) {
      localStorage.setItem('current_leads', JSON.stringify(leads));
      localStorage.setItem('current_query', searchState.query);
    }
  }, [leads, searchState.query]);

  useEffect(() => {
    localStorage.setItem('leadgenius_settings', JSON.stringify(settings));
  }, [settings]);
  
  useEffect(() => {
    localStorage.setItem('leadgenius_booking_settings', JSON.stringify(bookingSettings));
  }, [bookingSettings]);

  useEffect(() => {
    localStorage.setItem('leadgenius_sequences', JSON.stringify(sequences));
  }, [sequences]);

  useEffect(() => {
    localStorage.setItem('leadgenius_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (searchState.query && !searchState.isSearching && leads.length > 0) {
      try {
        const historyJSON = localStorage.getItem('search_history');
        const history = historyJSON ? JSON.parse(historyJSON) : [];
        const newEntry = { 
          query: searchState.query, 
          count: leads.length, 
          date: new Date().toISOString() 
        };
        const filtered = history.filter((h: any) => h.query !== newEntry.query);
        const updated = [newEntry, ...filtered].slice(0, 50);
        localStorage.setItem('search_history', JSON.stringify(updated));
        setSearchHistory(updated); 
      } catch (e) {
        console.error("Failed to save history", e);
      }
    }
  }, [searchState.isSearching, leads.length, searchState.query]);

  useEffect(() => {
    if (!user?.email) return;
    const email = user.email;
    const interval = setInterval(async () => {
      try {
        const updated = await authService.getUser(email);
        setUser(prev => prev?.email === updated.email ? updated : prev);
      } catch (err) { }
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.email]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const addNotification = (type: Notification['type'], message: string, link?: Notification['link']) => {
    const newNotif: Notification = {
      id: `notif_${Date.now()}`,
      type,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      link
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 49)]);
  };

  const handleLogin = async (email: string) => {
    const profile = await authService.login(email);
    setUser(profile);
    // Explicitly set online on login
    await authService.updateStatus(profile.email, 'online');
    setTransactions(authService.getTransactions(email));
    localStorage.setItem('leadgenius_last_user', email);
    toast.success(`Welcome back, ${profile.name?.split(' ')[0] || 'User'}!`);
  };

  const handleLogout = async () => {
    if (user) {
      try {
        await authService.updateStatus(user.email, 'offline');
      } catch (e) {
        // Ignore if user not found during logout
      }
    }
    setUser(null); 
    setLeads([]);
    localStorage.clear();
    toast('Logged out');
  };

  const handlePurchase = async (amount: number, plan: string) => {
    if (!user) return;
    const updatedUser = await authService.addCredits(user.email, amount, plan as any);
    setUser(updatedUser);
    setTransactions(authService.getTransactions(user.email));
    toast.success(`+${amount.toLocaleString()} credits added!`);
  };

  const handleToggleSelect = (id: number) => {
    const newSet = new Set(selectedLeadIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedLeadIds(newSet);
  };

  const handleSelectAll = (ids: number[]) => {
    const newSet = new Set(selectedLeadIds);
    ids.forEach(id => newSet.add(id));
    setSelectedLeadIds(newSet);
  };

  const handleStatusChange = (id: number, newStatus: LeadStatus) => {
    let updatedLead: Lead | undefined;
    setLeads(prev => prev.map(l => {
      if (l.id === id) {
        const activityItem: ActivityItem = {
           id: Date.now().toString(),
           type: 'status_change',
           content: `Status changed to ${newStatus.toUpperCase()}`,
           author: user?.name || 'User',
           timestamp: new Date().toISOString(),
           metadata: { oldValue: l.status, newValue: newStatus }
        };
        updatedLead = { 
          ...l, 
          status: newStatus,
          lastContacted: new Date().toISOString(),
          activity: [activityItem, ...(l.activity || [])]
        };
        if (activeActivityLead?.id === id) setActiveActivityLead(updatedLead);
        return updatedLead;
      }
      return l;
    }));
    const formattedStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
    toast.success(`Lead moved to ${formattedStatus}`, { 
      icon: '✅',
      style: { background: '#1e293b', color: '#fff' } 
    });

    if(updatedLead) {
      addNotification('info', `<strong>${updatedLead.company}</strong> moved to <strong>${formattedStatus}</strong>`, { view: ViewMode.PIPELINE, leadId: id });
    }

    if (updatedLead && settings.webhookUrl) {
      fetch(settings.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'lead_status_change',
          lead: updatedLead,
          timestamp: new Date().toISOString()
        })
      })
      .then(() => toast.success("Webhook Triggered", { icon: '🔌' }))
      .catch((e) => console.error("Webhook failed", e));
    }
  };

  const handleUpdateLead = (updatedLead: Lead) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    if (selectedLeadDetails?.id === updatedLead.id) {
      setSelectedLeadDetails(updatedLead);
    }
    
    // Also update if in favorite searches ( Saved Lists )
    const updatedFavs = favoriteSearches.map(list => {
       if (list.leads) {
          const foundIndex = list.leads.findIndex((l: Lead) => l.id === updatedLead.id);
          if (foundIndex !== -1) {
             const newLeads = [...list.leads];
             newLeads[foundIndex] = updatedLead;
             return { ...list, leads: newLeads };
          }
       }
       return list;
    });
    
    if (JSON.stringify(updatedFavs) !== JSON.stringify(favoriteSearches)) {
        setFavoriteSearches(updatedFavs);
        localStorage.setItem('favorite_searches', JSON.stringify(updatedFavs));
    }

    toast.success("Lead details updated");
  };

  const handleAddToSequence = (leadIds: number[], sequenceId: string) => {
    setLeads(prev => prev.map(l => {
      if (leadIds.includes(l.id)) {
        const seq = sequences.find(s => s.id === sequenceId);
        const activityItem: ActivityItem = {
           id: Date.now().toString(),
           type: 'sequence_add',
           content: `Enrolled in sequence: ${seq?.name || 'Unknown'}`,
           author: user?.name || 'User',
           timestamp: new Date().toISOString()
        };
        return { 
          ...l, 
          sequenceId, 
          status: 'contacted',
          lastContacted: new Date().toISOString(),
          activity: [activityItem, ...(l.activity || [])]
        }; 
      }
      return l;
    }));
    
    setSequences(prev => prev.map(s => {
      if (s.id === sequenceId) {
        return { ...s, activeLeads: s.activeLeads + leadIds.length };
      }
      return s;
    }));

    toast.success(`Added ${leadIds.length} leads to sequence`, { icon: '🚀' });
    setSelectedLeadIds(new Set());
  };
  
  const handleBulkAssign = (assigneeId: string) => {
    const assigneeName = teamMembers.find(m => m.id === assigneeId)?.name || 'Unknown';
    setLeads(prev => prev.map(l => {
      if (selectedLeadIds.has(l.id)) {
        const activityItem: ActivityItem = {
            id: Date.now().toString() + Math.random(),
            type: 'assignment',
            content: `Bulk assigned to ${assigneeName}`,
            author: user?.name || 'Admin',
            timestamp: new Date().toISOString(),
            metadata: { oldValue: l.assignedTo, newValue: assigneeName }
        };
        
        return {
          ...l,
          assignedTo: assigneeName,
          ownerId: assigneeId,
          activity: [activityItem, ...(l.activity || [])]
        };
      }
      return l;
    }));
    toast.success(`Assigned ${selectedLeadIds.size} leads to ${assigneeName}`);
    addNotification('assignment', `You assigned <strong>${selectedLeadIds.size} leads</strong> to <strong>${assigneeName}</strong>`);
    setSelectedLeadIds(new Set());
  };

  const handleAddNote = (leadId: number, text: string) => {
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        const newNote: LeadNote = {
          id: Date.now().toString(),
          text,
          author: user?.name || 'You',
          date: new Date().toISOString()
        };
        
        const activityItem: ActivityItem = {
           id: Date.now().toString(),
           type: 'note',
           content: text,
           author: user?.name || 'You',
           timestamp: new Date().toISOString()
        };

        const updated = { 
            ...l, 
            notes: [...(l.notes || []), newNote],
            activity: [activityItem, ...(l.activity || [])]
        };
        if (activeActivityLead?.id === leadId) setActiveActivityLead(updated);
        return updated;
      }
      return l;
    }));
  };

  const handleAssignLead = (leadId: number, assignee: string) => {
    let leadName = '';
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        leadName = l.company;
        const activityItem: ActivityItem = {
           id: Date.now().toString(),
           type: 'assignment',
           content: `Assigned to ${assignee}`,
           author: user?.name || 'User',
           timestamp: new Date().toISOString(),
           metadata: { oldValue: l.assignedTo, newValue: assignee }
        };

        const updated = { 
            ...l, 
            assignedTo: assignee,
            activity: [activityItem, ...(l.activity || [])]
        };
        if (activeActivityLead?.id === leadId) setActiveActivityLead(updated);
        return updated;
      }
      return l;
    }));
    addNotification('assignment', `<strong>${leadName}</strong> assigned to <strong>${assignee}</strong>`, { view: ViewMode.LIST, leadId });
    toast.success(`Assigned to ${assignee}`);
  };

  const saveAsFavorite = async () => {
    if (leads.length === 0) {
      toast.error("No leads to save");
      return;
    }
    const toastId = toast.loading('Saving list...');
    
    try {
      const dashboardElement = document.getElementById('dashboard-content');
      let thumbnail = 'https://via.placeholder.com/300x200?text=No+Preview';
      if (dashboardElement) {
        try {
          const canvas = await html2canvas(dashboardElement, {
            scale: 0.5,
            useCORS: true,
            logging: false,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#f8fafc',
            height: 600, 
            windowWidth: 1200
          });
          thumbnail = canvas.toDataURL('image/jpeg', 0.5);
        } catch (e) {
          console.error("Thumbnail generation failed:", e);
        }
      }

      const listName = searchState.query || `List ${new Date().toLocaleDateString()}`;

      const newFav = {
        id: Date.now(),
        query: listName,
        leadsCount: leads.length,
        timestamp: Date.now(),
        thumbnail,
        leads: leads 
      };

      try {
        const updated = [newFav, ...favoriteSearches]; 
        setFavoriteSearches(updated);
        localStorage.setItem('favorite_searches', JSON.stringify(updated));
        toast.success('List saved successfully!', { id: toastId });
      } catch (storageError) {
        const lightweightFav = { ...newFav, leads: undefined };
        const updated = [lightweightFav, ...favoriteSearches];
        setFavoriteSearches(updated);
        localStorage.setItem('favorite_searches', JSON.stringify(updated));
        toast.success('Saved (Without offline data due to size)', { id: toastId });
      }

    } catch (err) {
      toast.error('Failed to save list', { id: toastId });
    }
  };

  const deleteFavorite = (id: number) => {
    const updated = favoriteSearches.filter(f => f.id !== id);
    setFavoriteSearches(updated);
    localStorage.setItem('favorite_searches', JSON.stringify(updated));
    toast.success("List deleted");
  };

  const handleRenameFavorite = (id: number, newName: string) => {
    const updated = favoriteSearches.map(list => 
      list.id === id ? { ...list, query: newName } : list
    );
    setFavoriteSearches(updated);
    localStorage.setItem('favorite_searches', JSON.stringify(updated));
    toast.success("List renamed");
  };

  const handleSelectHistory = (query: string) => {
    setSearchState(s => ({ ...s, query }));
    setShowHistory(false);
  };

  const clearHistory = () => {
    localStorage.removeItem('search_history');
    setSearchHistory([]);
    toast.success("Search history cleared");
    setShowHistory(false);
  };

  const handleImport = (importedLeads: Lead[]) => {
    const leadsWithOwner = importedLeads.map(l => ({ ...l, ownerId: user?.id }));
    setLeads(prev => [...prev, ...leadsWithOwner]);
    
    // Auto-save to Saved Lists
    const listName = `Imported Batch ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    
    const newFav = {
        id: Date.now(),
        query: listName,
        leadsCount: leadsWithOwner.length,
        timestamp: Date.now(),
        thumbnail: '', 
        leads: leadsWithOwner
    };

    setFavoriteSearches(prev => {
        const updated = [newFav, ...prev];
        localStorage.setItem('favorite_searches', JSON.stringify(updated));
        return updated;
    });

    setViewMode(ViewMode.LIST);
    if (!searchState.query) {
      setSearchState(s => ({ ...s, query: listName }));
    }
    toast.success("Imported leads saved to 'Saved Lists'");
  };

  const handleRestoreFavorite = (fav: any) => {
    if (fav.leads && fav.leads.length > 0) {
      setLeads(fav.leads);
      setSearchState(s => ({ ...s, query: fav.query }));
      toast.success(`Restored list: ${fav.query}`);
      setViewMode(ViewMode.LIST);
    } else {
      setSearchState(s => ({ ...s, query: fav.query }));
      toast('Restored search query');
    }
    setShowMobileMenu(false);
  };

  const handleReset = () => {
    setLeads([]);
    setSearchState({
      query: '',
      isSearching: false,
      progressStep: 0,
      batchesCompleted: 0,
      totalLeads: 0,
      error: null
    });
    setFilters({
      location: '',
      industry: '',
      employees: ''
    });
    setSelectedLeadIds(new Set());
    setSelectedLead(null);
    setActiveActivityLead(null);
    
    localStorage.removeItem('current_leads');
    localStorage.removeItem('current_query');
    
    setViewMode(ViewMode.DASHBOARD);
    toast.success("Dashboard cleared");
  };

  const handleApplyStrategy = (query: string) => {
      setSearchState(s => ({ ...s, query }));
      setViewMode(ViewMode.DASHBOARD);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowHistory(false);
    
    // Guard clause: Do not allow search if already running
    if (searchState.isSearching) return;
    if (!searchState.query.trim() || !userRef.current) return;

    const controller = new AbortController();
    setAbortController(controller);
    setSearchState(s => ({ ...s, isSearching: true, progressStep: 1, error: null, batchesCompleted: 0, totalLeads: 0 }));
    setLeads([]); // Clear existing leads when starting a new search
    setSelectedLeadIds(new Set()); 

    let fullQuery = searchState.query;
    const constraints: string[] = [];
    if (filters.location.trim()) constraints.push(`Location: ${filters.location.trim()}`);
    if (filters.industry && filters.industry !== 'Other') constraints.push(`Industry: ${filters.industry}`);
    if (filters.employees) constraints.push(`Size: ${filters.employees}`);
    if (constraints.length > 0) fullQuery += ` (${constraints.join(', ')})`;

    // Accumulate leads locally to ensure correct ignore list and autosave
    let accumulatedLeads: Lead[] = [];

    try {
      // Stream batches
      for (let i = 0; i < MAX_BATCHES; i++) {
        if (controller.signal.aborted) break;
        
        const batch = await generateLeadsBatch(fullQuery, BATCH_SIZE, i, accumulatedLeads.map(l => l.company));
        
        // Critical Fix: If aborted during await, we still want to keep the batch we just got!
        // But we stop the loop immediately after processing this batch.
        
        if (batch.length === 0 && i === 0) {
             setSearchState(s => ({ ...s, error: "No leads found. Try a broader search." }));
             break;
        }
        
        if (batch.length === 0) break; // Stop if no more results
        
        // Filter duplicates against accumulated
        const uniqueBatch = batch.filter(b => !accumulatedLeads.some(al => al.company === b.company));
        
        if (uniqueBatch.length > 0) {
            setLeads(prev => {
                const newLeads = [...prev, ...uniqueBatch];
                // Filter unique by company name to be safe
                return newLeads.filter((v,i,a)=>a.findIndex(t=>(t.company === v.company))===i);
            });
            
            accumulatedLeads = [...accumulatedLeads, ...uniqueBatch];
            
            setSearchState(s => ({ 
               ...s, 
               batchesCompleted: i + 1, 
               totalLeads: s.totalLeads + uniqueBatch.length,
               progressStep: Math.min(100, Math.round(((i + 1) / MAX_BATCHES) * 100))
            }));
        }

        // Check abort AFTER processing the batch so we don't lose data
        if (controller.signal.aborted) break;

        await new Promise(r => setTimeout(r, 1500));
      }

      // Auto-save generated leads
      if (accumulatedLeads.length > 0) {
          const listName = `${searchState.query} (Auto-Saved) - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
          
          const newFav = {
            id: Date.now(),
            query: listName,
            leadsCount: accumulatedLeads.length,
            timestamp: Date.now(),
            thumbnail: '', 
            leads: accumulatedLeads
          };

          setFavoriteSearches(prev => {
            const updated = [newFav, ...prev];
            localStorage.setItem('favorite_searches', JSON.stringify(updated));
            return updated;
          });
          
          toast.success("Results auto-saved to 'Saved Lists'");
      }

    } catch (err: any) {
        if (err.name !== 'AbortError') {
           setSearchState(s => ({ ...s, error: "Search failed. Please try again." }));
           toast.error("Search interrupted");
        }
    } finally {
        setSearchState(s => ({ ...s, isSearching: false, progressStep: 100 }));
        setAbortController(null);
    }
  };

  const stopSearch = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    // Only abort the controller. The handleSearch loop will catch the signal, break,
    // and its finally block will update the state.
    // This prevents race conditions where we might clear data or re-trigger renders prematurely.
    if (abortController) {
      abortController.abort();
      setAbortController(null); // Clean up immediately
      toast('Search stopping...', { icon: '🛑' });
    }
  };
  
  const handleNav = (view: ViewMode, leadId?: number) => {
    setViewMode(view);
    if(leadId) {
      // Small timeout to allow view to change before opening drawer
      setTimeout(() => {
        const lead = leads.find(l => l.id === leadId);
        if(lead) setActiveActivityLead(lead);
      }, 100);
    }
  };

  if (!user) {
    return <AuthModal onLogin={handleLogin} onShowTerms={() => setShowTerms(true)} onShowPrivacy={() => setShowPrivacy(true)} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#020617] overflow-hidden transition-colors duration-500 font-sans">
      <Toaster position="top-right" toastOptions={{
        style: { background: darkMode ? '#1e293b' : '#fff', color: darkMode ? '#fff' : '#0f172a', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0' },
      }}/>
      
      {/* Sidebar - Desktop */}
      <div className={`hidden md:flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 z-20 shadow-sm relative ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className={`h-16 p-4 border-b border-slate-100 dark:border-slate-700 flex items-center transition-all duration-300 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-2 rounded-lg shadow-md shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5">
                 <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                 </span>
                 <p className="text-xs text-slate-400 font-semibold tracking-wide whitespace-nowrap">{t('app.online', settings.language)}</p>
              </div>
          </div>
          
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
          >
             {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Grouped Navigation */}
        <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
          {navGroups.map(group => {
            const isGroupCollapsed = collapsedNavGroups[group.id];
            return (
              <div key={group.id} className="space-y-1">
                {!isSidebarCollapsed ? (
                  <button 
                    onClick={() => toggleNavGroup(group.id)}
                    className="w-full flex justify-between items-center px-3 pt-4 pb-2 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-500 dark:hover:text-slate-300 transition-colors rounded-md"
                  >
                    <span>{group.label}</span>
                    {isGroupCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  </button>
                ) : (
                  <div className="w-10 h-px bg-slate-200 dark:bg-slate-700 my-3 mx-auto"></div>
                )}
                
                {(!isSidebarCollapsed && isGroupCollapsed) ? null : (
                  <div className="space-y-0.5 animate-fade-in">
                    {group.items.map(item => (
                       <NavItem 
                         key={item.id}
                         item={item} 
                         isActive={viewMode === item.id}
                         isCollapsed={isSidebarCollapsed}
                         onClick={() => setViewMode(item.id)}
                       />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative" ref={userMenuRef}>
            {/* User Profile Button */}
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`w-full flex items-center gap-3 text-left p-2 rounded-lg transition-colors duration-200 ${
                showUserMenu
                  ? 'bg-slate-100 dark:bg-slate-700/50'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white dark:ring-slate-800 shrink-0">
                {user.name?.charAt(0) || 'U'}
              </div>
              {!isSidebarCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{user.name || 'User'}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{user.plan === 'free' ? 'Free Plan' : 'Team Plan'}</p>
                  </div>
                  <ChevronUp className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {/* User Menu Popup */}
            {showUserMenu && (
              <div className="absolute bottom-full left-2 right-2 mb-2 animate-slide-up">
                <div className="bg-white dark:bg-slate-850 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {/* Credits Section */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/70">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Available Credits</p>
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                      {user.credits.toLocaleString()}
                    </div>
                    <button
                      onClick={() => { setShowPricing(true); setShowUserMenu(false); }}
                      className="text-xs font-bold text-indigo-600 hover:underline mt-1"
                    >
                      + Add Credits
                    </button>
                  </div>
                  {/* Logout Button */}
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setShowPricing(true)}
            className={`w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm ${isSidebarCollapsed ? 'px-0' : ''}`}
            title="Upgrade Plan"
          >
            <Zap className="w-3 h-3" /> {!isSidebarCollapsed && t('app.upgrade', settings.language)}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm md:hidden flex flex-col p-4 animate-in slide-in-from-left-10 duration-200">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2 text-white font-bold text-xl">
               <Zap className="w-6 h-6 text-indigo-400" /> Netolyte
            </div>
            <button onClick={() => setShowMobileMenu(false)} className="p-2 bg-white/10 rounded-full text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
             {navGroups.map(group => (
                <div key={group.id} className="mb-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">{group.label}</div>
                  {group.items.map(item => (
                    <NavItem 
                      key={item.id}
                      item={item} 
                      isActive={viewMode === item.id}
                      isCollapsed={false}
                      onClick={() => { setViewMode(item.id); setShowMobileMenu(false); }}
                    />
                  ))}
                </div>
             ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Top Navbar */}
        <div className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowMobileMenu(true)} className="md:hidden p-2 text-slate-500">
              <Menu className="w-6 h-6" />
            </button>
            {/* View As Indicator */}
            {viewingAsId && viewingAsUser && (
               <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold animate-pulse">
                  <Eye className="w-3 h-3" /> {t('app.viewing_as', settings.language)} {viewingAsUser.name}
                  <button onClick={() => setViewingAsId(null)} className="ml-1 hover:text-amber-900"><X className="w-3 h-3"/></button>
               </div>
            )}
          </div>

          <div className="flex items-center gap-2">
             <NotificationCenter notifications={notifications} onSetNotifications={setNotifications} onNavigate={handleNav} />
             <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
             <button onClick={() => setShowSettingsModal(true)} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Settings">
               <SettingsIcon className="w-5 h-5" />
             </button>
             <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Toggle Theme">
               {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden relative" id="dashboard-content">
          {viewMode === ViewMode.DASHBOARD && (
            <div className="h-full flex flex-col p-4 md:p-8 overflow-y-auto relative">
              
              {/* Background decoration for premium feel */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                  <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px]"></div>
                  <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[100px]"></div>
              </div>

              {/* Search Hero */}
              <div className="max-w-4xl mx-auto w-full mb-8 text-center space-y-6 relative z-10">
                 <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                    Find your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Opportunity</span>
                 </h2>
                 <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                    AI-powered intelligence. Access millions of verified contacts and enrich your pipeline instantly.
                 </p>

                 <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto w-full group z-20">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-xl shadow-xl">
                       <Search className="absolute left-4 w-6 h-6 text-slate-400" />
                       <input 
                         type="text"
                         value={searchState.query}
                         onChange={(e) => {
                           setSearchState(s => ({...s, query: e.target.value}));
                           if (e.target.value.trim()) setShowHistory(true);
                           else setShowHistory(false);
                         }}
                         onFocus={() => { if(searchHistory.length > 0) setShowHistory(true); }}
                         placeholder="e.g. Software companies in London"
                         className="w-full py-4 pl-14 pr-48 md:pr-[220px] bg-transparent text-lg border-none focus:ring-0 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400"
                       />
                       <div className="absolute right-2 flex items-center gap-2">
                          {searchState.isSearching ? (
                            <button 
                              type="button" 
                              onClick={stopSearch}
                              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-red-500/30 flex items-center gap-2"
                            >
                               <X className="w-5 h-5" /> Stop
                            </button>
                          ) : (
                            <button 
                              type="submit" 
                              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-indigo-500/30"
                            >
                               Generate
                            </button>
                          )}

                          {!searchState.isSearching && (
                            <button
                              type="button"
                              onClick={() => setShowImportModal(true)}
                              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 font-bold rounded-lg transition-all flex items-center gap-2"
                              title="Import List"
                            >
                              <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Import</span>
                            </button>
                          )}
                       </div>
                       
                       {/* Search History Dropdown */}
                       {showHistory && searchHistory.length > 0 && !searchState.isSearching && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-slide-down">
                             <div className="flex justify-between items-center px-4 py-2 bg-slate-50 dark:bg-slate-900/50 text-xs font-bold text-slate-500 uppercase">
                                <span>Recent Searches</span>
                                <button onClick={clearHistory} className="hover:text-red-500">Clear</button>
                             </div>
                             {searchHistory.map((item: any, idx: number) => (
                                <button 
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSelectHistory(item.query)}
                                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between group/item transition-colors"
                                >
                                   <div className="flex items-center gap-3">
                                      <History className="w-4 h-4 text-slate-400 group-hover/item:text-indigo-500" />
                                      <span className="text-slate-700 dark:text-slate-200 font-medium">{item.query}</span>
                                   </div>
                                   <span className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString()}</span>
                                </button>
                             ))}
                          </div>
                       )}
                    </div>
                 </form>

                 <div className="flex flex-wrap justify-center gap-3 text-sm">
                    <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300'}`}>
                       <Filter className="w-4 h-4" /> Advanced Filters
                    </button>
                    {/* Quick Filters */}
                    {['SaaS', 'Real Estate', 'Marketing Agencies', 'Startups'].map(q => (
                       <button key={q} onClick={() => setSearchState(s => ({...s, query: q}))} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:border-indigo-300 transition-colors">
                          {q}
                       </button>
                    ))}
                 </div>
                 
                 {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg animate-slide-down text-left">
                       <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                          <input 
                            type="text" 
                            placeholder="City, Country" 
                            className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                            value={filters.location}
                            onChange={e => setFilters(f => ({...f, location: e.target.value}))}
                          />
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1">Industry</label>
                          <select 
                             className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                             value={filters.industry}
                             onChange={e => setFilters(f => ({...f, industry: e.target.value}))}
                          >
                             <option value="">Any</option>
                             {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1">Company Size</label>
                          <select 
                             className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                             value={filters.employees}
                             onChange={e => setFilters(f => ({...f, employees: e.target.value}))}
                          >
                             <option value="">Any</option>
                             <option value="1-10">1-10</option>
                             <option value="11-50">11-50</option>
                             <option value="51-200">51-200</option>
                             <option value="201-500">201-500</option>
                             <option value="500+">500+</option>
                          </select>
                       </div>
                    </div>
                 )}
              </div>

              {/* Loading State */}
              {searchState.isSearching && (
                 <div className="max-w-2xl mx-auto w-full mb-8 relative z-10">
                    <div className="flex justify-between text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                       <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> AI Agent Working...</span>
                       <span>{Math.round(searchState.progressStep)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out" 
                         style={{ width: `${searchState.progressStep}%` }}
                       ></div>
                    </div>
                    <div className="text-center mt-2 text-xs text-slate-400">
                       Scanning {searchState.batchesCompleted + 1} / {MAX_BATCHES} batches • Found {searchState.totalLeads} leads
                    </div>
                 </div>
              )}

              {/* Stats & Dashboard */}
              {visibleLeads.length > 0 && (
                 <div className="relative z-10">
                    <Dashboard leads={visibleLeads} />
                    
                    <div className="flex justify-between items-center mt-8 mb-4">
                       <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <List className="w-5 h-5 text-indigo-600" /> {searchState.isSearching ? 'Generating Results...' : 'Recent Results'}
                       </h3>
                       <div className="flex gap-2">
                          <button 
                            onClick={handleReset}
                            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-red-600 dark:hover:text-red-400 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
                          >
                            <RotateCcw className="w-4 h-4" /> Start Fresh
                          </button>
                          <button 
                            onClick={() => setViewMode(ViewMode.LIST)}
                            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2"
                          >
                            View All <ArrowRight className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                    <div className="h-[400px]">
                       <LeadTable 
                          leads={[...visibleLeads].slice().reverse().slice(0, 5)} 
                          selectedIds={selectedLeadIds} 
                          onToggleSelect={handleToggleSelect} 
                          onSelectAll={handleSelectAll}
                          onStatusChange={handleStatusChange}
                          onOpenEmail={(l) => { setSelectedLead(l); }}
                          onViewDetails={(l) => setSelectedLeadDetails(l)}
                       />
                    </div>
                 </div>
              )}

              {/* Empty State - Ready to Prospect */}
              {visibleLeads.length === 0 && !searchState.isSearching && (
                 <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-fade-in relative z-10">
                    <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-indigo-500/10 flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700 transform rotate-3 transition-transform hover:rotate-6 duration-500">
                        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <Sparkles className="w-8 h-8" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                      Ready to Grow?
                    </h2>
                    <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-8">
                      Enter your target criteria above to generate high-quality contacts and enrich your pipeline using AI.
                    </p>
                 </div>
              )}
            </div>
          )}

          {viewMode === ViewMode.LIST && (
            <div className="h-full flex flex-col">
               <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <h2 className="text-xl font-bold text-slate-900 dark:text-white">Contacts Database</h2>
                     <div className="h-6 w-px bg-slate-300 dark:bg-slate-600"></div>
                     <span className="text-sm text-slate-500">{visibleLeads.length} contacts found</span>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => setShowImportModal(true)} className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Import
                     </button>
                     <button onClick={saveAsFavorite} className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                        <Star className="w-4 h-4" /> Save List
                     </button>
                     <button onClick={() => setShowExportModal(true)} className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                     </button>
                  </div>
               </div>
               <div className="flex-1 overflow-hidden p-4 bg-slate-50 dark:bg-[#020617]">
                  <LeadTable 
                    leads={visibleLeads} 
                    selectedIds={selectedLeadIds} 
                    onToggleSelect={handleToggleSelect} 
                    onSelectAll={handleSelectAll}
                    onStatusChange={handleStatusChange}
                    onOpenEmail={(l) => { setSelectedLead(l); }}
                    onOpenActivity={(l) => { setActiveActivityLead(l); }}
                    onViewDetails={(l) => setSelectedLeadDetails(l)}
                    sequences={sequences}
                    onAddToSequence={handleAddToSequence}
                  />
               </div>
               
               {/* Bulk Actions Bar */}
               {selectedLeadIds.size > 0 && (
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-30 animate-slide-up">
                     <span className="font-bold">{selectedLeadIds.size} selected</span>
                     
                     <div className="h-4 w-px bg-slate-700"></div>
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-400 flex items-center gap-1"><UserPlus className="w-3 h-3"/> Assign:</span>
                        <select
                           onChange={(e) => { if(e.target.value) handleBulkAssign(e.target.value); }}
                           className="bg-slate-800 text-white text-sm border border-slate-700 rounded px-2 py-1 outline-none focus:border-indigo-500 cursor-pointer"
                           value=""
                        >
                           <option value="">Select User...</option>
                           <option value={user.id}>Me</option>
                           {teamMembers.filter(m => m.id !== user.id).map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                           ))}
                        </select>
                     </div>

                     <div className="h-4 w-px bg-slate-700"></div>
                     <button onClick={() => setShowWhatsAppModal(true)} className="hover:text-green-400 transition-colors flex items-center gap-2 text-sm font-medium">
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                     </button>
                     <button onClick={() => setShowSMSModal(true)} className="hover:text-orange-400 transition-colors flex items-center gap-2 text-sm font-medium">
                        <MessageSquare className="w-4 h-4" /> SMS
                     </button>
                     <button onClick={() => {
                        const ids = Array.from(selectedLeadIds);
                        const selected = leads.filter(l => ids.includes(l.id));
                        exportToCSV(selected, "Selected_Leads");
                     }} className="hover:text-indigo-400 transition-colors flex items-center gap-2 text-sm font-medium">
                        <Download className="w-4 h-4" /> Export
                     </button>

                     <div className="h-4 w-px bg-slate-700"></div>
                     <button 
                       onClick={() => {
                         const updatedLeads = leads.filter(l => !selectedLeadIds.has(l.id));
                         setLeads(updatedLeads);
                         setSelectedLeadIds(new Set());
                         toast.error(`Removed ${selectedLeadIds.size} leads`);
                       }}
                       className="text-red-500 hover:text-red-400 transition-colors"
                       title="Delete Selected"
                     >
                       <Ban className="w-4 h-4" />
                     </button>
                  </div>
               )}
            </div>
          )}
          
          {viewMode === ViewMode.MAP && <div className="p-4 h-full"><MapView leads={visibleLeads} /></div>}
          
          {viewMode === ViewMode.PIPELINE && <PipelineBoard leads={visibleLeads} onStatusChange={handleStatusChange} />}

          {viewMode === ViewMode.COMPETITORS && <CompetitorScanner onAddLeads={handleImport} defaultLocation={filters.location} />}
          
          {viewMode === ViewMode.EMAIL_WARMUP && <EmailWarmup />}

          {viewMode === ViewMode.LOOKALIKE && <LookalikeFinder onAddLeads={handleImport} />}

          {viewMode === ViewMode.ROLEPLAY && <RoleplayDojo leads={visibleLeads} />}

          {viewMode === ViewMode.SEQUENCES && <SequenceBuilder sequences={sequences} onSaveSequence={(seq) => {
            const exists = sequences.some(s => s.id === seq.id);
            if (exists) setSequences(sequences.map(s => s.id === seq.id ? seq : s));
            else setSequences([...sequences, seq]);
          }} />}

          {viewMode === ViewMode.DIALER && <PowerDialer leads={visibleLeads} onExit={() => setViewMode(ViewMode.LIST)} onUpdateLead={(updated) => {
             setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
          }}/>}

          {viewMode === ViewMode.STRATEGY && <SalesStrategyView onApplyStrategy={handleApplyStrategy} />}

          {viewMode === ViewMode.SAVED && <SavedLists savedLists={favoriteSearches} onRestore={handleRestoreFavorite} onDelete={deleteFavorite} onRename={handleRenameFavorite} />}
          
          {viewMode === ViewMode.REPORTS && <ReportsView leads={leads} teamMembers={teamMembers} currentUser={user} />}

          {viewMode === ViewMode.TEAM && <TeamManagement currentUser={user} onViewAs={setViewingAsId} viewingAsId={viewingAsId} leads={leads} />}

          {viewMode === ViewMode.SIGNALS && <LeadSignals leads={leads} />}

          {viewMode === ViewMode.BOOKING && <BookingCalendar settings={bookingSettings} onSave={setBookingSettings} />}
        </div>

        {selectedLead && (
          <EmailSequenceModal 
            lead={selectedLead} 
            isOpen={!!selectedLead} 
            onClose={() => setSelectedLead(null)} 
            brandVoice={settings.brandVoice}
            bookingSettings={bookingSettings}
          />
        )}
        
        {activeActivityLead && (
           <ActivityDrawer 
             lead={activeActivityLead} 
             isOpen={!!activeActivityLead}
             onClose={() => setActiveActivityLead(null)}
             onAddNote={handleAddNote}
             onAssignLead={handleAssignLead}
             teamMembers={teamMembers.map(m => m.name || 'Unknown')}
           />
        )}

        <LeadDetailsModal 
          lead={selectedLeadDetails} 
          onClose={() => setSelectedLeadDetails(null)} 
          onUpdate={handleUpdateLead}
        />

        {showWhatsAppModal && (
          <WhatsAppCampaignModal 
            leads={leads.filter(l => selectedLeadIds.has(l.id))}
            isOpen={showWhatsAppModal}
            onClose={() => setShowWhatsAppModal(false)}
            brandVoice={settings.brandVoice}
          />
        )}

        {showSMSModal && (
           <SMSCampaignModal 
             leads={leads.filter(l => selectedLeadIds.has(l.id))}
             isOpen={showSMSModal}
             onClose={() => setShowSMSModal(false)}
             brandVoice={settings.brandVoice}
           />
        )}

        <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} onPurchase={handlePurchase} />
        <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
        <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
        <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} leads={visibleLeads} query={searchState.query} />
        <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} settings={settings} onSave={setSettings} onAddLeads={handleImport} />
        <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={handleImport} />

        <CallWidget
          callState={callState}
          activeCall={activeCall}
          onAccept={acceptCall}
          onReject={rejectCall}
          onEnd={endCall}
          onMute={toggleMute}
          onToggleVideo={toggleVideo}
          isMuted={isMuted}
          isVideoEnabled={isVideoEnabled}
          remoteAudioRef={remoteAudioRef}
          localStream={localStream}
          remoteStream={remoteStream}
        />
        
        {user && <ChatWidget currentUser={user} onStartCall={startCall} />}
      </div>
    </div>
  );
}
