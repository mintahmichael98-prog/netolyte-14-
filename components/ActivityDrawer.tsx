
import React, { useState, useEffect, useRef } from 'react';
import { Lead, ActivityItem } from '../types';
import { X, Send, User, Clock, Building, MapPin, Hash, UserPlus, StickyNote, Activity, RefreshCw, GitBranch } from 'lucide-react';

interface Props {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onAddNote: (leadId: number, note: string) => void;
  onAssignLead: (leadId: number, assignee: string) => void;
  teamMembers: string[];
}

export default function ActivityDrawer({ lead, isOpen, onClose, onAddNote, onAssignLead, teamMembers }: Props) {
  const [noteText, setNoteText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lead.activity, isOpen]);

  if (!isOpen) return null;

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onAddNote(lead.id, noteText);
    setNoteText('');
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch(type) {
      case 'note': return <StickyNote className="w-4 h-4 text-amber-500" />;
      case 'status_change': return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'assignment': return <UserPlus className="w-4 h-4 text-purple-500" />;
      case 'creation': return <Activity className="w-4 h-4 text-emerald-500" />;
      case 'sequence_add': return <GitBranch className="w-4 h-4 text-indigo-500" />;
      default: return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[90]" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white dark:bg-slate-800 shadow-2xl z-[100] border-l border-slate-200 dark:border-slate-700 flex flex-col animate-slide-left">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                {lead.company}
              </h3>
              <p className="text-sm text-slate-500">{lead.industry} • {lead.location}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between bg-white dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <UserPlus className="w-4 h-4" />
              <span>Owner:</span>
            </div>
            <select 
              value={lead.assignedTo || ''} 
              onChange={(e) => onAssignLead(lead.id, e.target.value)}
              className="bg-transparent font-medium text-indigo-600 dark:text-indigo-400 outline-none text-sm text-right cursor-pointer"
            >
              <option value="">Unassigned</option>
              {teamMembers.map(member => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Activity Feed (Timeline) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#020617]">
          <div className="space-y-6 relative">
             {/* Timeline Line */}
             {lead.activity && lead.activity.length > 1 && (
               <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800 -z-10" />
             )}

             {lead.activity?.map((item) => (
                <div key={item.id} className="flex gap-4 group">
                   <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm flex-shrink-0 z-10">
                      {getActivityIcon(item.type)}
                   </div>
                   <div className="flex-1">
                      <div className="flex items-baseline justify-between mb-1">
                         <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {item.author}
                            <span className="font-normal text-slate-500 ml-1">
                              {item.type === 'note' ? 'added a note' : 
                               item.type === 'status_change' ? 'changed status' :
                               item.type === 'assignment' ? 'updated assignment' : 
                               item.type === 'sequence_add' ? 'triggered sequence' : 'created lead'}
                            </span>
                         </span>
                         <span className="text-[10px] text-slate-400">
                            {new Date(item.timestamp).toLocaleTimeString([], {month: 'short', day:'numeric', hour: '2-digit', minute:'2-digit'})}
                         </span>
                      </div>
                      
                      <div className={`p-3 rounded-lg border text-sm ${
                        item.type === 'note' 
                          ? 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30 text-slate-700 dark:text-slate-200' 
                          : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                         {item.content}
                         {item.metadata && (
                            <div className="mt-1 text-xs opacity-75">
                               {item.metadata.oldValue && <span>{item.metadata.oldValue} &rarr; </span>}
                               <span className="font-semibold">{item.metadata.newValue}</span>
                            </div>
                         )}
                      </div>
                   </div>
                </div>
             ))}

             {(!lead.activity || lead.activity.length === 0) && (
                 <div className="text-center text-slate-400 text-sm py-10">
                    No activity recorded yet.
                 </div>
             )}
             <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <form onSubmit={handleSubmitNote} className="relative">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add an internal note..."
              className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-800 border focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
            <button 
              type="submit"
              disabled={!noteText.trim()}
              className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-400 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </>
  );
}
