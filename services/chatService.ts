import { ChatMessage, ChatConversation, UserProfile, ChatGroup } from '../types';

// Simulating Database
const STORAGE_KEY_MESSAGES = 'leadgenius_chat_messages';
const STORAGE_KEY_GROUPS = 'leadgenius_chat_groups';

const getConversationId = (userA: string, userB: string) => {
  // If userB is a group ID (starts with group_), that is the conversation ID.
  if (userB.startsWith('group_')) return userB;
  if (userA.startsWith('group_')) return userA;
  
  return [userA, userB].sort().join('_');
};

const getGroups = (): ChatGroup[] => {
  const saved = localStorage.getItem(STORAGE_KEY_GROUPS);
  if (saved) return JSON.parse(saved);
  
  // Default Groups
  const defaults: ChatGroup[] = [
    { id: 'group_general', name: 'General', type: 'public', members: [], description: 'Team announcements' },
    { id: 'group_leads', name: 'Hot Leads', type: 'public', members: [], description: 'Discussing priority deals' },
  ];
  localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(defaults));
  return defaults;
};

export const chatService = {
  getConversationId,
  getGroups,

  createGroup: (name: string): ChatGroup => {
    const groups = getGroups();
    const newGroup: ChatGroup = {
      id: `group_${Date.now()}`,
      name,
      type: 'public',
      members: [],
      description: 'Custom channel'
    };
    groups.push(newGroup);
    localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
    return newGroup;
  },

  getMessages: (userA: string, userB: string): ChatMessage[] => {
    const cid = getConversationId(userA, userB);
    const allMessagesStr = localStorage.getItem(STORAGE_KEY_MESSAGES);
    const allMessages: ChatMessage[] = allMessagesStr ? JSON.parse(allMessagesStr) : [];
    
    return allMessages
      .filter(m => m.conversationId === cid)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  saveMessage: (message: ChatMessage) => {
    const allMessagesStr = localStorage.getItem(STORAGE_KEY_MESSAGES);
    const allMessages: ChatMessage[] = allMessagesStr ? JSON.parse(allMessagesStr) : [];
    
    // Avoid duplicates
    if (!allMessages.find(m => m.id === message.id)) {
      allMessages.push(message);
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(allMessages));
    }
  },

  markConversationAsRead: (currentUser: string, otherId: string) => {
    const cid = getConversationId(currentUser, otherId);
    const allMessagesStr = localStorage.getItem(STORAGE_KEY_MESSAGES);
    const allMessages: ChatMessage[] = allMessagesStr ? JSON.parse(allMessagesStr) : [];
    
    let changed = false;
    const updated = allMessages.map(m => {
      // Logic for 1:1: receiver is me. Logic for Group: conversation is group, and I haven't read it? 
      // Simplified: We assume if I open the group, all messages in that group are read by me locally.
      // Since this mock backend doesn't store per-user read receipts for groups easily, 
      // we will just rely on unreadCount filtering below.
      
      // For 1:1
      if (m.conversationId === cid && m.receiverId === currentUser && m.status !== 'read') {
        changed = true;
        return { ...m, status: 'read' as const };
      }
      return m;
    });

    if (changed) {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(updated));
    }
  },

  getUnreadCount: (userId: string, otherUserId: string) => {
     const allMessagesStr = localStorage.getItem(STORAGE_KEY_MESSAGES);
     const allMessages: ChatMessage[] = allMessagesStr ? JSON.parse(allMessagesStr) : [];
     
     // 1:1 Logic
     if (!otherUserId.startsWith('group_')) {
       return allMessages.filter(m => 
         m.receiverId === userId && 
         m.status !== 'read' &&
         m.senderId === otherUserId
       ).length;
     } 
     
     // Group Logic (Mock: just check if message is newer than a 'last read' timestamp if we had one)
     // For this simple version, we won't show badges for groups to avoid complexity in this mock.
     return 0;
  },

  // Get recent conversations for the user list
  getRecentConversations: (userId: string): Record<string, ChatMessage> => {
    const allMessagesStr = localStorage.getItem(STORAGE_KEY_MESSAGES);
    const allMessages: ChatMessage[] = allMessagesStr ? JSON.parse(allMessagesStr) : [];
    
    // Messages where I am sender or receiver OR it's a group message
    const userMessages = allMessages.filter(m => 
        m.senderId === userId || 
        m.receiverId === userId || 
        m.receiverId.startsWith('group_')
    );
    
    // Group by other user/group
    const lastMessages: Record<string, ChatMessage> = {};
    
    userMessages.forEach(m => {
        let key = '';
        if (m.receiverId.startsWith('group_')) {
            key = m.receiverId;
        } else {
            key = m.senderId === userId ? m.receiverId : m.senderId;
        }
        
        const currentLast = lastMessages[key];
        // Keep the latest message
        if (!currentLast || new Date(m.timestamp) > new Date(currentLast.timestamp)) {
            lastMessages[key] = m;
        }
    });
    
    return lastMessages;
  }
};