
import React, { useState } from 'react';
import { Sequence, SequenceStep } from '../types';
import { Plus, Mail, Phone, Linkedin, CheckSquare, Trash2, Save, Play, Clock, MoreVertical, Layout } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  sequences: Sequence[];
  onSaveSequence: (sequence: Sequence) => void;
}

export default function SequenceBuilder({ sequences, onSaveSequence }: Props) {
  const [activeSeq, setActiveSeq] = useState<Sequence | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleCreateNew = () => {
    const newSeq: Sequence = {
      id: Date.now().toString(),
      name: 'New Campaign',
      activeLeads: 0,
      steps: [
        { id: '1', day: 1, type: 'email', title: 'Intro Email', content: 'Hi {{name}}, ...' },
        { id: '2', day: 3, type: 'linkedin', title: 'Connection Request', content: '' },
      ]
    };
    setActiveSeq(newSeq);
    setIsEditing(true);
  };

  const handleAddStep = (type: SequenceStep['type']) => {
    if (!activeSeq) return;
    const lastDay = activeSeq.steps.length > 0 ? activeSeq.steps[activeSeq.steps.length - 1].day : 0;
    const newStep: SequenceStep = {
      id: Date.now().toString(),
      day: lastDay + 2,
      type,
      title: type === 'email' ? 'Follow Up' : type === 'call' ? 'Quick Call' : type === 'linkedin' ? 'Message' : 'Task',
      content: ''
    };
    setActiveSeq({ ...activeSeq, steps: [...activeSeq.steps, newStep] });
  };

  const handleSave = () => {
    if (activeSeq) {
      onSaveSequence(activeSeq);
      setIsEditing(false);
      toast.success('Sequence saved successfully');
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'email': return <Mail className="w-4 h-4 text-blue-500" />;
      case 'call': return <Phone className="w-4 h-4 text-green-500" />;
      case 'linkedin': return <Linkedin className="w-4 h-4 text-[#0077b5]" />;
      default: return <CheckSquare className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-50 dark:bg-[#020617] overflow-hidden">
      
      {/* Sidebar List */}
      <div className="w-full md:w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layout className="w-5 h-5 text-indigo-600" /> Campaigns
          </h2>
          <button onClick={handleCreateNew} className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sequences.length === 0 && !activeSeq && (
            <div className="text-center py-10 text-slate-400 text-sm">
              No sequences yet.<br/>Create one to start automating.
            </div>
          )}
          
          {sequences.map(seq => (
            <div 
              key={seq.id}
              onClick={() => { setActiveSeq(seq); setIsEditing(false); }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                activeSeq?.id === seq.id 
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900 dark:text-white">{seq.name}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${seq.activeLeads > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {seq.activeLeads} active
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3 h-3" /> {seq.steps.length} Steps
                <span>•</span>
                <span>{(seq.steps[seq.steps.length - 1]?.day || 1) - 1} Days duration</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor / Details */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {activeSeq ? (
          <>
            <div className="h-16 px-8 flex items-center justify-between bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              {isEditing ? (
                <input 
                  value={activeSeq.name}
                  onChange={(e) => setActiveSeq({...activeSeq, name: e.target.value})}
                  className="text-xl font-bold bg-transparent border-b border-indigo-300 focus:outline-none text-slate-900 dark:text-white"
                  autoFocus
                />
              ) : (
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activeSeq.name}</h2>
              )}
              
              <div className="flex gap-2">
                {isEditing ? (
                  <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                    <Save className="w-4 h-4" /> Save Sequence
                  </button>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">
                    Edit
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-[#020617] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
              <div className="max-w-3xl mx-auto space-y-8 pb-20">
                {/* Trigger */}
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 z-10">
                     <Play className="w-6 h-6 text-white ml-1" />
                   </div>
                   <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                     <p className="font-bold text-slate-900 dark:text-white">Enrollment Trigger</p>
                     <p className="text-xs text-slate-500">When lead is added to sequence</p>
                   </div>
                </div>

                {/* Vertical Line */}
                <div className="absolute left-[calc(50%-1px)] top-20 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 -z-0 hidden md:block"></div>

                {activeSeq.steps.map((step, idx) => (
                  <div key={step.id} className="relative group animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="flex items-start gap-4">
                      {/* Timeline Node */}
                      <div className="flex flex-col items-center gap-2 mt-4 min-w-[3rem]">
                         <div className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 z-10">
                           Day {step.day}
                         </div>
                         <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 z-10"></div>
                      </div>

                      {/* Card */}
                      <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group-hover:shadow-md transition-all p-5 relative">
                        {isEditing && (
                          <button 
                            onClick={() => setActiveSeq({ ...activeSeq, steps: activeSeq.steps.filter(s => s.id !== step.id) })}
                            className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            {getIcon(step.type)}
                          </div>
                          <div>
                            {isEditing ? (
                              <input 
                                value={step.title}
                                onChange={(e) => {
                                  const newSteps = [...activeSeq.steps];
                                  newSteps[idx].title = e.target.value;
                                  setActiveSeq({ ...activeSeq, steps: newSteps });
                                }}
                                className="font-bold text-slate-900 dark:text-white bg-transparent outline-none border-b border-transparent focus:border-indigo-500 w-full"
                              />
                            ) : (
                              <h4 className="font-bold text-slate-900 dark:text-white">{step.title}</h4>
                            )}
                            <p className="text-xs text-slate-500 capitalize">{step.type} Task</p>
                          </div>
                        </div>

                        {step.type === 'email' && (
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                            {isEditing ? (
                              <textarea 
                                value={step.content}
                                onChange={(e) => {
                                  const newSteps = [...activeSeq.steps];
                                  newSteps[idx].content = e.target.value;
                                  setActiveSeq({ ...activeSeq, steps: newSteps });
                                }}
                                className="w-full bg-transparent text-sm text-slate-600 dark:text-slate-300 outline-none resize-none h-20"
                                placeholder="Email body template..."
                              />
                            ) : (
                              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                                {step.content || 'No content template set.'}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isEditing && (
                  <div className="flex justify-center gap-3 pt-4 pb-12">
                    <button onClick={() => handleAddStep('email')} className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-500 transition-colors w-24">
                      <Mail className="w-6 h-6" />
                      <span className="text-xs font-bold">Email</span>
                    </button>
                    <button onClick={() => handleAddStep('call')} className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-green-500 hover:text-green-500 transition-colors w-24">
                      <Phone className="w-6 h-6" />
                      <span className="text-xs font-bold">Call</span>
                    </button>
                    <button onClick={() => handleAddStep('linkedin')} className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-[#0077b5] hover:text-[#0077b5] transition-colors w-24">
                      <Linkedin className="w-6 h-6" />
                      <span className="text-xs font-bold">LinkedIn</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6">
              <Layout className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Select a Campaign</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm">
              Design multi-step outreach workflows to automate your follow-ups and increase conversion rates.
            </p>
            <button onClick={handleCreateNew} className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-indigo-500/20 transition-all hover:-translate-y-1">
              Create New Sequence
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
