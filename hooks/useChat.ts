
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, UserProfile } from '../types';
import { signalingService } from '../services/signalingService';
import { chatService } from '../services/chatService';
import toast from 'react-hot-toast';

export const useChat = (currentUser: UserProfile | null) => {
  const [activeConversation, setActiveConversation] = useState<string | null>(null); // userId or groupId
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  
  // Refresh trigger for list view (unread counts, last message previews)
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const typingTimeoutRef = useRef<any>(null);

  // 1. Load messages when active conversation changes
  useEffect(() => {
    if (currentUser && activeConversation) {
      const msgs = chatService.getMessages(currentUser.id, activeConversation);
      setMessages(msgs);
      
      // Mark as read
      chatService.markConversationAsRead(currentUser.id, activeConversation);
      setLastRefresh(Date.now());
    }
  }, [activeConversation, currentUser, lastRefresh]);

  // 2. Listen for signals
  useEffect(() => {
    if (!currentUser) return;

    const handleSignal = (msg: any) => {
      if (msg.type === 'chat:message') {
        const newMessage = msg.payload as ChatMessage;
        
        // Persist first
        chatService.saveMessage(newMessage);
        
        // Determine if this message belongs to the currently active view
        // 1:1 match: senderId is current peer
        // Group match: receiverId is current active group
        const isActiveContext = 
            (activeConversation === newMessage.senderId) || 
            (activeConversation === newMessage.receiverId && newMessage.receiverId.startsWith('group_'));

        if (isActiveContext) {
           setMessages(prev => {
               // Prevent duplicates
               if (prev.find(m => m.id === newMessage.id)) return prev;
               return [...prev, newMessage];
           });
           chatService.markConversationAsRead(currentUser.id, newMessage.senderId);
        } else {
           // Notification if not in this chat
           const senderName = newMessage.senderName || 'Someone';
           const from = newMessage.receiverId.startsWith('group_') ? 'Team Chat' : senderName;
           
           toast(`New message in ${from}`, { icon: '💬', duration: 3000 }); 
           setLastRefresh(Date.now()); // Trigger re-render of list for badges
        }
      }
      
      if (msg.type === 'chat:typing') {
         const isTyping = msg.payload.isTyping;
         setTypingUsers(prev => ({ ...prev, [msg.from]: isTyping }));
      }
    };

    signalingService.onMessage(handleSignal);

    return () => {
      signalingService.removeMessageListener(handleSignal);
    };
  }, [currentUser, activeConversation]);

  // 3. Actions
  const sendMessage = (content: string) => {
    if (!currentUser || !activeConversation) return;

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId: chatService.getConversationId(currentUser.id, activeConversation),
      senderId: currentUser.id,
      senderName: currentUser.name,
      receiverId: activeConversation,
      content,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    // 1. Save local
    chatService.saveMessage(newMessage);
    
    // 2. Update UI
    setMessages(prev => [...prev, newMessage]);
    setLastRefresh(Date.now());

    // 3. Send Signal
    signalingService.send({
      type: 'chat:message',
      payload: newMessage,
      from: currentUser.id,
      to: activeConversation
    });
  };

  const sendTyping = (isTyping: boolean) => {
    if (!currentUser || !activeConversation) return;
    
    signalingService.send({
      type: 'chat:typing',
      payload: { isTyping },
      from: currentUser.id,
      to: activeConversation
    });
  };

  // Helper for input handling
  const handleInputChange = (val: string) => {
      if (!typingTimeoutRef.current) {
          sendTyping(true);
      } else {
          clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
          sendTyping(false);
          typingTimeoutRef.current = null;
      }, 2000);
  };

  return {
    messages,
    sendMessage,
    activeConversation,
    setActiveConversation,
    typingUsers,
    handleInputChange,
    refreshChat: () => setLastRefresh(Date.now())
  };
};