


import React, { useState, useEffect, useRef } from 'react';
import { Lead, CallOutcome, LeadStatus, ActivityItem, CallLog, TranscriptLine, CallAnalysis } from '../types';
import { Phone, User, Globe, FileText, CheckCircle2, XCircle, Voicemail, Save, Play, PhoneOff, ArrowLeft, AlertTriangle, Mic, Volume2, LayoutGrid, Activity, Sparkles, BrainCircuit, X } from 'lucide-react';
import CallScriptGenerator from './CallScriptGenerator';
import { generateCallAnalysis } from '../services/geminiService';
import toast from 'react-hot-toast';

interface Props {
  leads: Lead[];
  onUpdateLead: (updatedLead: Lead) => void;
  onExit: () => void;
}

// Simulated conversation snippets for the "Real-Time" effect
const SIMULATED_RESPONSES = [
  "Hello, this is {name}.",
  "Hi there, who is calling?",
  "I'm actually in a meeting right now.",
  "We are currently looking for solutions like that.",
  "Can you send me some information via email?",
  "How does your pricing compare to competitors?",
  "I'm not the right person, you should talk to IT.",
  "Interesting, tell me more about the AI features.",
  "We don't have budget for this quarter.",
  "Okay, let's schedule a follow-up next Tuesday."
];

export default function PowerDialer({ leads, onUpdateLead, onExit }: Props) {
  const callQueue = leads.filter(l => 
    !l.isPhoneInvalid && 
    l.status !== 'bad_data' &&
    l.status !== 'won' && 
    (/[0-9]/.test(l.contact) || l.socials?.whatsapp) 
  );
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [outcomeMode, setOutcomeMode] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [selectedNextStatus, setSelectedNextStatus] = useState<LeadStatus | null>(null);
  const [dialMode, setDialMode] = useState<'voip' | 'phone'>('voip');
  
  // Real-time Intelligence State
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [keypadNumber, setKeypadNumber] = useState('');
  
  // Post-Call Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [callAnalysis, setCallAnalysis] = useState<CallAnalysis | null>(null);

  const currentLead = callQueue[currentIndex];
  const timerRef = useRef<any>(null);
  const transcriptIntervalRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Timer Logic
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      
      // Simulate live transcription if in VoIP mode
      if (dialMode === 'voip') {
         startSimulation();
      }
    } else {
      clearInterval(timerRef.current);
      clearInterval(transcriptIntervalRef.current);
    }
    return () => {
        clearInterval(timerRef.current);
        clearInterval(transcriptIntervalRef.current);
    };
  }, [isCallActive, dialMode]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const startSimulation = () => {
      let step = 0;
      setTranscript([]);
      const name = currentLead.management?.[0]?.name.split(' ')[0] || 'Prospect';
      
      transcriptIntervalRef.current = setInterval(() => {
          if (Math.random() > 0.6) {
              const text = SIMULATED_RESPONSES[Math.floor(Math.random() * SIMULATED_RESPONSES.length)].replace('{name}', name);
              const speaker = Math.random() > 0.5 ? 'prospect' : 'agent'; // Simulate both sides randomly
              
              setTranscript(prev => [...prev, {
                  speaker: speaker as any,
                  text: speaker === 'agent' ? "Yes, exactly. We help with that." : text, // Simple filler for agent
                  timestamp: Date.now()
              }]);
          }
      }, 3500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startCall = (mode: 'voip' | 'phone') => {
    if (!currentLead) return;
    setDialMode(mode);
    setIsCallActive(true);
    setCallDuration(0);
    setTranscript([]);
    setCallAnalysis(null);
    toast.success(`Dialing ${currentLead.company} via ${mode === 'voip' ? 'Cloud Voice' : 'Cellular'}...`);
    
    if (mode === 'phone') {
        const num = currentLead.contact.replace(/[^0-9+]/g, '');
        window.location.href = `tel:${num}`;
    }
  };

  const endCall = async () => {
    setIsCallActive(false);
    setOutcomeMode(true);
    
    // Trigger AI Analysis automatically if we have data
    if (transcript.length > 0 || callNotes.length > 10) {
        setIsAnalyzing(true);
        try {
            const analysis = await generateCallAnalysis(transcript, callNotes);
            setCallAnalysis(analysis);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    }
  };

  const handleOutcome = (outcome: CallOutcome) => {
    if (!currentLead) return;

    const timestamp = new Date().toISOString();
    
    const newLog: CallLog = {
      id: Date.now().toString(),
      timestamp,
      outcome,
      notes: callNotes,
      durationSeconds: callDuration,
      user: 'You',
      analysis: callAnalysis || undefined
    };

    const activityItem: ActivityItem = {
        id: `call_${Date.now()}`,
        type: 'call_log',
        content: `Call logged: ${outcome.toUpperCase().replace('_', ' ')} (${formatTime(callDuration)})`,
        author: 'You',
        timestamp,
        metadata: { outcome }
    };

    let updates: Partial<Lead> = {
      callLogs: [...(currentLead.callLogs || []), newLog],
      activity: [activityItem, ...(currentLead.activity || [])],
      lastContacted: timestamp,
      callCount: (currentLead.callCount || 0) + 1
    };

    if (outcome === 'answered') {
      if (selectedNextStatus) updates.status = selectedNextStatus;
      else updates.status = 'contacted'; 
      toast.success("Call logged: Answered");
    } 
    else if (outcome === 'voicemail') {
      updates.status = 'attempted';
      toast("Logged: Voicemail. Rescheduled.");
    } 
    else if (outcome === 'wrong_number') {
      updates.isPhoneInvalid = true;
      updates.status = 'bad_data';
      toast.error("Marked as Invalid Number");
    }
    else if (outcome === 'skipped') {
        toast("Skipped lead");
        updates.callCount = (currentLead.callCount || 0); 
    }

    onUpdateLead({ ...currentLead, ...updates });
    advanceQueue();
  };

  const advanceQueue = () => {
    setOutcomeMode(false);
    setCallNotes('');
    setSelectedNextStatus(null);
    setCallDuration(0);
    setTranscript([]);
    setCallAnalysis(null);
    
    if (currentIndex < callQueue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsSessionActive(false); 
      toast.success("All leads in queue processed!");
    }
  };

  const handleKeypadPress = (digit: string) => {
      setKeypadNumber(prev => prev + digit);
      // Play DTMF tone sound effect here if needed
  };

  if (!isSessionActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020617] p-8 animate-fade-in">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border border-slate-200 dark:border-slate-700">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
             <Phone className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Power Dialer</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            You have <span className="font-bold text-indigo-600">{callQueue.length}</span> leads queued for calling.
            The system will guide you through each call sequentially with real-time AI assistance.
          </p>
          
          {callQueue.length > 0 ? (
            <div className="space-y-4">
               <button 
                 onClick={() => setIsSessionActive(true)}
                 className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
               >
                 <Play className="w-5 h-5 fill-current" /> Start Session
               </button>
               <button onClick={onExit} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-medium">
                 Cancel and go back
               </button>
            </div>
          ) : (
            <div>
               <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl mb-6 flex items-center gap-2 text-left text-sm">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  No valid, un-called leads found in your current list. Try generating new leads or resetting statuses.
               </div>
               <button onClick={onExit} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg font-medium text-slate-700 dark:text-white">Go Back</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentIndex >= callQueue.length) {
     return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020617] p-8 animate-fade-in">
        <div className="text-center">
          <CheckCircle2 className="w-24 h-24 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Session Complete!</h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-8">You have processed all leads in the queue.</p>
          <button onClick={onExit} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold">Return to Dashboard</button>
        </div>
      </div>
     );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#020617]">
      <div className="h-16 px-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
         <div className="flex items-center gap-4">
           <button onClick={onExit} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full" title="Exit Dialer">
             <ArrowLeft className="w-5 h-5 text-slate-500" />
           </button>
           <div>
             <h3 className="font-bold text-slate-900 dark:text-white">Session in Progress</h3>
             <p className="text-xs text-slate-500">Lead {currentIndex + 1} of {callQueue.length}</p>
           </div>
         </div>
         <div className={`px-4 py-1 rounded-full font-mono font-bold flex items-center gap-2 transition-colors ${isCallActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
            {isCallActive && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
            {formatTime(callDuration)}
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Script & Lead Info */}
        <div className="w-1/2 p-6 overflow-y-auto border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
           <div className="max-w-xl mx-auto space-y-6">
              <div className="flex items-start gap-4">
                 <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                    {currentLead.company.charAt(0)}
                 </div>
                 <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">{currentLead.company}</h1>
                    <div className="flex gap-2 mt-2">
                       <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-medium text-slate-600 dark:text-slate-300">{currentLead.industry}</span>
                       <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-medium text-slate-600 dark:text-slate-300">{currentLead.location}</span>
                    </div>
                 </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
                 <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-slate-400" />
                    <div>
                       <p className="text-sm text-slate-500 dark:text-slate-400">Decision Maker</p>
                       <p className="font-semibold text-slate-900 dark:text-white">{currentLead.management?.[0]?.name || 'Unknown'}</p>
                       <p className="text-xs text-indigo-600 dark:text-indigo-400">{currentLead.management?.[0]?.role}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <div>
                       <p className="text-sm text-slate-500 dark:text-slate-400">Phone</p>
                       <p className="font-mono text-lg font-bold text-slate-900 dark:text-white tracking-wide">
                         {currentLead.contact.replace(/[^0-9+]/g, '') || 'No direct number'}
                       </p>
                    </div>
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                 <CallScriptGenerator lead={currentLead} />
              </div>
           </div>
        </div>

        {/* Right Panel: Active Call Interface OR Outcomes */}
        <div className="w-1/2 p-6 flex flex-col bg-slate-50 dark:bg-[#020617] overflow-y-auto">
           <div className="flex-1 max-w-xl mx-auto w-full flex flex-col h-full">
              {!outcomeMode ? (
                  <>
                    {/* Live Intelligence Panel */}
                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 flex flex-col overflow-hidden relative">
                       <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                             <Activity className="w-4 h-4 text-emerald-500" /> Live Intelligence
                          </h3>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                             {isCallActive ? 'Listening...' : 'Ready'}
                          </span>
                       </div>
                       
                       <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {transcript.length === 0 && (
                             <div className="text-center text-slate-400 text-sm mt-10">
                                {isCallActive ? 'Waiting for speech...' : 'Start call to activate live transcription'}
                             </div>
                          )}
                          {transcript.map((line, idx) => (
                             <div key={idx} className={`flex ${line.speaker === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                                   line.speaker === 'agent' 
                                     ? 'bg-indigo-50 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200 rounded-br-sm' 
                                     : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 rounded-bl-sm'
                                }`}>
                                   <p className="text-[10px] opacity-70 mb-1 capitalize font-bold">{line.speaker}</p>
                                   {line.text}
                                </div>
                             </div>
                          ))}
                          <div ref={transcriptEndRef} />
                       </div>

                       {/* Quick Note Input */}
                       <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                          <input 
                             value={callNotes}
                             onChange={(e) => setCallNotes(e.target.value)}
                             placeholder="Type quick notes here..."
                             className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                          />
                       </div>
                    </div>

                    {/* Keypad Overlay */}
                    {showKeypad && (
                        <div className="absolute bottom-24 right-8 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-20 animate-slide-up">
                            <div className="mb-4 bg-slate-100 dark:bg-slate-900 p-3 rounded-lg text-center text-xl font-mono font-bold dark:text-white min-w-[200px] min-h-[50px] flex items-center justify-center">
                                {keypadNumber}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {['1','2','3','4','5','6','7','8','9','*','0','#'].map(key => (
                                    <button 
                                      key={key} 
                                      onClick={() => handleKeypadPress(key)}
                                      className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-lg flex items-center justify-center transition-colors"
                                    >
                                        {key}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setShowKeypad(false)} className="mt-4 w-full text-xs text-slate-500 hover:text-slate-700">Hide Keypad</button>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="mt-auto shrink-0">
                       {!isCallActive ? (
                          <div className="grid grid-cols-2 gap-3">
                            <button 
                               onClick={() => startCall('voip')}
                               className="py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-indigo-500/20 transition-all flex flex-col items-center justify-center gap-1"
                            >
                               <Phone className="w-6 h-6 fill-current" /> 
                               <span className="text-xs font-normal opacity-80">Browser Call</span>
                            </button>
                            <button 
                               onClick={() => startCall('phone')}
                               className="py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-lg shadow-sm transition-all flex flex-col items-center justify-center gap-1"
                            >
                               <Phone className="w-6 h-6" />
                               <span className="text-xs font-normal opacity-80 text-slate-500">Cellular / App</span>
                            </button>
                            <button 
                               onClick={() => handleOutcome('skipped')}
                               className="col-span-2 py-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                            >
                               Skip this lead
                            </button>
                          </div>
                       ) : (
                          <div className="flex items-center gap-4">
                             <button 
                               onClick={() => setIsMuted(!isMuted)}
                               className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-white text-slate-900' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                             >
                                {isMuted ? <Volume2 className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                             </button>
                             <button 
                               onClick={() => endCall()}
                               className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-xl shadow-xl hover:shadow-red-500/20 transition-all flex items-center justify-center gap-3 animate-pulse"
                             >
                                <PhoneOff className="w-6 h-6 fill-current" /> End Call
                             </button>
                             <button 
                               onClick={() => setShowKeypad(!showKeypad)}
                               className={`p-4 rounded-full transition-colors ${showKeypad ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                             >
                                <LayoutGrid className="w-6 h-6" />
                             </button>
                          </div>
                       )}
                    </div>
                  </>
              ) : (
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg flex-1 flex flex-col animate-scale-in">
                      
                      <div className="flex justify-between items-start mb-6">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Call Report</h3>
                          {isAnalyzing ? (
                              <span className="flex items-center gap-2 text-indigo-600 text-sm font-medium animate-pulse">
                                  <Sparkles className="w-4 h-4" /> AI Analyzing...
                              </span>
                          ) : callAnalysis && (
                              <div className="flex items-center gap-2">
                                  <span className="text-sm text-slate-500">Confidence Score:</span>
                                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                                      callAnalysis.confidenceScore > 70 ? 'bg-green-100 text-green-700' : 
                                      callAnalysis.confidenceScore > 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                      {callAnalysis.confidenceScore}/100
                                  </div>
                              </div>
                          )}
                      </div>

                      {callAnalysis ? (
                          <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50 space-y-4">
                              <div>
                                  <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase mb-1">AI Summary</h4>
                                  <p className="text-sm text-slate-700 dark:text-slate-200">{callAnalysis.summary}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase mb-1">Coaching Tips</h4>
                                      <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1">
                                          {callAnalysis.coachingTips.slice(0, 2).map((tip, i) => <li key={i}>{tip}</li>)}
                                      </ul>
                                  </div>
                                  <div>
                                      <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase mb-1">Missed Opportunities</h4>
                                      <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1">
                                          {callAnalysis.missedOpportunities.slice(0, 2).map((tip, i) => <li key={i}>{tip}</li>)}
                                      </ul>
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="mb-6 text-center text-slate-400 text-sm italic">
                              {isAnalyzing ? "Processing audio transcript..." : "No significant dialogue detected for analysis."}
                          </div>
                      )}
                      
                      <div className="grid grid-cols-3 gap-3 mb-6">
                         <button onClick={() => handleOutcome('answered')} className="p-3 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 text-center transition-colors">
                            <CheckCircle2 className="w-5 h-5 mx-auto mb-1" />
                            <span className="text-xs font-bold">Answered</span>
                         </button>
                         <button onClick={() => handleOutcome('voicemail')} className="p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-center transition-colors">
                            <Voicemail className="w-5 h-5 mx-auto mb-1" />
                            <span className="text-xs font-bold">Voicemail</span>
                         </button>
                         <button onClick={() => handleOutcome('wrong_number')} className="p-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-center transition-colors">
                            <XCircle className="w-5 h-5 mx-auto mb-1" />
                            <span className="text-xs font-bold">Bad #</span>
                         </button>
                      </div>

                      <div className="space-y-4 flex-1 overflow-y-auto">
                        <div>
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Final Notes</label>
                           <textarea 
                              value={callNotes}
                              onChange={(e) => setCallNotes(e.target.value)}
                              placeholder="Key takeaways, objections, next steps..."
                              className="w-full h-24 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Next Stage</label>
                           <div className="flex flex-wrap gap-2">
                              {['qualified', 'negotiation', 'won', 'lost', 'contacted'].map((status) => (
                                 <button
                                   key={status}
                                   onClick={() => setSelectedNextStatus(status as LeadStatus)}
                                   className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                     selectedNextStatus === status 
                                       ? 'bg-indigo-600 text-white border-indigo-600' 
                                       : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                                   }`}
                                 >
                                   {status.charAt(0).toUpperCase() + status.slice(1)}
                                 </button>
                              ))}
                           </div>
                        </div>
                      </div>
                      
                      <button 
                         onClick={() => handleOutcome('answered')}
                         disabled={!selectedNextStatus}
                         className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-md shadow-lg flex items-center justify-center gap-2"
                      >
                         <Save className="w-4 h-4" /> Save & Next Lead
                      </button>
                  </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
