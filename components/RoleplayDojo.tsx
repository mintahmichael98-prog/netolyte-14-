
import React, { useState, useEffect, useRef } from 'react';
import { Lead } from '../types';
import { chatWithPersona, getCoachingFeedback, ChatMessage } from '../services/geminiService';
import { User, Bot, Send, RotateCcw, Award, CheckCircle2, XCircle, Lightbulb, Play, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  leads: Lead[];
}

export default function RoleplayDojo({ leads }: Props) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStart = (lead: Lead) => {
    setSelectedLead(lead);
    setMessages([]);
    setFeedback(null);
    // Add initial system greeting from persona
    const greeting = `Hi, this is ${lead.management?.[0]?.name || 'the Director'}. I have about 2 minutes. What's this about?`;
    setMessages([{ role: 'model', text: greeting }]);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !selectedLead || loading) return;

    const userMsg = { role: 'user' as const, text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await chatWithPersona(selectedLead, messages, userMsg.text);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (err) {
      toast.error("Connection lost");
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (messages.length < 3) {
      toast.error("Chat a bit longer to get feedback!");
      return;
    }
    setLoading(true);
    try {
      const result = await getCoachingFeedback(messages);
      setFeedback(result);
    } catch (err) {
      toast.error("Failed to generate feedback");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedLead) {
    return (
      <div className="h-full p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-4 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/30 mb-2">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white">AI Sales Dojo</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Master your pitch before you dial. Select a real lead from your list to enter a simulation. 
              The AI will become that person—objections, personality, and all.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leads.slice(0, 9).map(lead => (
              <button 
                key={lead.id}
                onClick={() => handleStart(lead)}
                className="group relative bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-500 transition-all text-left"
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-8 h-8 text-indigo-600 fill-indigo-100 dark:fill-indigo-900" />
                </div>
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4 text-xl">
                  {lead.company.charAt(0)}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white truncate">{lead.company}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{lead.management?.[0]?.name || 'Decision Maker'}</p>
                <div className="mt-4 flex gap-2">
                  <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                    {lead.industry}
                  </span>
                </div>
              </button>
            ))}
            {leads.length === 0 && (
              <div className="col-span-full text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-slate-500">No leads found. Generate some leads first to start training!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-slate-50 dark:bg-[#020617]">
      
      {/* Sidebar Info */}
      <div className="w-full md:w-80 bg-white dark:bg-slate-800 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 p-6 flex flex-col z-10 shadow-sm">
        <button onClick={() => setSelectedLead(null)} className="mb-6 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-2">
          ← Back to Dojo
        </button>
        
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl font-bold text-white mb-4 shadow-lg shadow-indigo-500/20">
            {selectedLead.company.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{selectedLead.management?.[0]?.name || 'Prospect'}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{selectedLead.management?.[0]?.role || 'Decision Maker'}</p>
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">{selectedLead.company}</p>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Context</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300">{selectedLead.description}</p>
          </div>
          
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Key Data</h4>
            <ul className="text-sm space-y-2 text-slate-600 dark:text-slate-300">
              <li>📍 {selectedLead.location}</li>
              <li>🏢 {selectedLead.industry}</li>
              <li>👥 {selectedLead.employees} Employees</li>
            </ul>
          </div>
        </div>

        {!feedback && (
          <button 
            onClick={handleEndSession}
            className="mt-4 w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 transition-all"
          >
            End & Get Feedback
          </button>
        )}
      </div>

      {/* Main Chat / Feedback Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {feedback ? (
          <div className="flex-1 overflow-y-auto p-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Performance Report</h2>
                <button onClick={() => { setFeedback(null); setMessages([]); handleStart(selectedLead); }} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium">
                  <RotateCcw className="w-4 h-4" /> Restart
                </button>
              </div>

              {/* Score Card */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Overall Score</p>
                  <h3 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                    {feedback.score}
                  </h3>
                </div>
                <div className="h-24 w-px bg-slate-200 dark:bg-slate-700 mx-8 hidden sm:block"></div>
                <div className="flex-1">
                  <p className="text-lg font-medium text-slate-800 dark:text-slate-200 italic">"{feedback.summary}"</p>
                </div>
                <div className="hidden md:block">
                   <Award className={`w-20 h-20 ${feedback.score >= 80 ? 'text-yellow-400' : 'text-slate-300'}`} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-xl border border-green-100 dark:border-green-900/30">
                  <h3 className="font-bold text-green-800 dark:text-green-400 flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5" /> Strengths
                  </h3>
                  <ul className="space-y-2">
                    {feedback.strengths?.map((s: string, i: number) => (
                      <li key={i} className="text-green-700 dark:text-green-300 text-sm">• {s}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/10 p-6 rounded-xl border border-rose-100 dark:border-rose-900/30">
                  <h3 className="font-bold text-rose-800 dark:text-rose-400 flex items-center gap-2 mb-4">
                    <XCircle className="w-5 h-5" /> Missed Opportunities
                  </h3>
                  <ul className="space-y-2">
                    {feedback.weaknesses?.map((w: string, i: number) => (
                      <li key={i} className="text-rose-700 dark:text-rose-300 text-sm">• {w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5" /> Better Approach
                </h3>
                <p className="text-indigo-800 dark:text-indigo-200 text-sm italic">
                  "{feedback.improved_pitch}"
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6" ref={scrollRef}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`
                    max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm
                    ${msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-600'}
                  `}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-700 p-4 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-600 flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <form onSubmit={handleSend} className="max-w-4xl mx-auto relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your pitch..."
                  className="w-full pl-6 pr-14 py-4 rounded-full bg-slate-100 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner text-slate-900 dark:text-white"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="absolute right-2 top-2 bottom-2 w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-md"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
              <p className="text-center text-xs text-slate-400 mt-2">
                AI is roleplaying as {selectedLead.management?.[0]?.name}. Be persuasive.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
