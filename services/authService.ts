
import { UserProfile, Transaction } from "../types";

const STORAGE_KEY_PREFIX = 'netolyte_user_';
const STORAGE_KEY_TEAM = 'netolyte_global_team';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getGlobalTeam = (): UserProfile[] => {
  const saved = localStorage.getItem(STORAGE_KEY_TEAM);
  if (saved) return JSON.parse(saved);
  
  const defaults: UserProfile[] = [
    { id: 'admin_1', email: 'support@netolyte.ai', name: 'Netolyte Support', credits: 99999, plan: 'enterprise', role: 'admin', createdAt: new Date().toISOString(), status: 'online' },
  ];
  localStorage.setItem(STORAGE_KEY_TEAM, JSON.stringify(defaults));
  return defaults;
};

export const authService = {
  login: async (email: string): Promise<UserProfile> => {
    await delay(800);
    const normalizedEmail = email.toLowerCase().trim();
    const storageKey = `${STORAGE_KEY_PREFIX}${normalizedEmail}`;
    const existing = localStorage.getItem(storageKey);
    
    if (existing) {
      const user = JSON.parse(existing);
      // Ensure user is in global team list for the current session
      const team = getGlobalTeam();
      if (!team.find(m => m.id === user.id)) {
        team.push(user);
        localStorage.setItem(STORAGE_KEY_TEAM, JSON.stringify(team));
      }
      return user;
    } else {
      const name = normalizedEmail.split('@')[0].split(/[._-]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
      
      const newUser: UserProfile = {
        id: `u_${Math.random().toString(36).substr(2, 9)}`,
        email: normalizedEmail,
        name,
        credits: 100, // Welcome bonus for worldwide users
        plan: 'free',
        createdAt: new Date().toISOString(),
        role: 'user',
        status: 'online',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`
      };
      
      localStorage.setItem(storageKey, JSON.stringify(newUser));
      
      // Add to global team simulation
      const team = getGlobalTeam();
      team.push(newUser);
      localStorage.setItem(STORAGE_KEY_TEAM, JSON.stringify(team));
      
      return newUser;
    }
  },

  getUser: async (email: string): Promise<UserProfile> => {
    const userStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}${email.toLowerCase().trim()}`);
    if (!userStr) throw new Error("User not found");
    return JSON.parse(userStr);
  },

  updateStatus: async (email: string, status: string): Promise<UserProfile> => {
    const emailKey = email.toLowerCase().trim();
    const userStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}${emailKey}`);
    if (!userStr) throw new Error("User not found");
    
    const user = JSON.parse(userStr);
    user.status = status;
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${emailKey}`, JSON.stringify(user));

    // Update in team simulation
    const team = getGlobalTeam();
    const idx = team.findIndex(u => u.email === emailKey);
    if (idx !== -1) {
      team[idx].status = status as any;
      localStorage.setItem(STORAGE_KEY_TEAM, JSON.stringify(team));
    }
    
    return user;
  },

  addCredits: async (email: string, amount: number, plan: 'pro' | 'enterprise'): Promise<UserProfile> => {
    await delay(1000);
    const emailKey = email.toLowerCase().trim();
    const user = await authService.getUser(emailKey);
    user.credits += amount;
    user.plan = plan;
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${emailKey}`, JSON.stringify(user));
    return user;
  },

  getTeamMembers: async (): Promise<UserProfile[]> => {
    await delay(300);
    return getGlobalTeam();
  },

  // Added inviteMember method to fix TeamManagement component error
  inviteMember: async (email: string, role: 'admin' | 'user'): Promise<void> => {
    await delay(500);
    const team = getGlobalTeam();
    const normalizedEmail = email.toLowerCase().trim();
    
    if (team.find(m => m.email === normalizedEmail)) {
      throw new Error("User already in team");
    }

    const name = normalizedEmail.split('@')[0].split(/[._-]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    
    const newUser: UserProfile = {
      id: `u_${Math.random().toString(36).substr(2, 9)}`,
      email: normalizedEmail,
      name,
      credits: 0,
      plan: 'free',
      createdAt: new Date().toISOString(),
      role,
      status: 'offline',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`
    };
    
    team.push(newUser);
    localStorage.setItem(STORAGE_KEY_TEAM, JSON.stringify(team));
  },

  getTransactions: (email: string): Transaction[] => {
    return []; // Simplified for now
  }
};
