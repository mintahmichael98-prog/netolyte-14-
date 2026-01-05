import React, { useState } from 'react';
import { SalesStrategy } from '../types';
import { generateSalesStrategy } from '../services/geminiService';
import { Lightbulb, Target, Search, ArrowRight, Loader2, CheckCircle2, Briefcase, MapPin, Users, AlertCircle, Building } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  onApplyStrategy: (query: string) => void;
}

export default function SalesStrategyView({ onApplyStrategy }: Props) {
  const [productInput, setProductInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<SalesStrategy | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productInput.trim()) return;
    
    setLoading(true);
    try {
      const result = await generateSalesStrategy(productInput);
      setStrategy(result);
      toast.success("Strategy generated successfully!");
    } catch (error) {
      toast.error("Failed to generate strategy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full p-8 overflow-y-auto bg-slate-50 dark:bg-[#020617]">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/30 mb-2">
            <Lightbulb className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white">AI Sales Strategist</h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Not sure who to target? Tell us what you sell, and our AI will build your Ideal Customer Profile (ICP), identify pain points, and find the perfect leads for you.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
           
           <form onSubmit={handleAnalyze} className="relative z-10">
              <label className="block text-lg font-bold text-slate-900 dark:text-white mb-4">
                What are you selling?
              </label>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={productInput}
                  onChange={(e) => setProductInput(e.target.value)}
                  placeholder="e.g. AI-powered HR software for remote teams"
                  className="flex-1 px-6 py-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-lg text-slate-900 dark:text-white shadow-inner"
                  autoFocus
                />
                <button 
                  type="submit"
                  disabled={loading || !productInput}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2 min-w-[180px] justify-center"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Analyze <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-3">
                Tip: Be specific about your product's key feature or target audience for better results.
              </p>
           </form>
        </div>

        {strategy && (
          <div className="space-y-8 animate-slide-up">
             
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                      <Target className="w-6 h-6 text-rose-500" /> Ideal Customer Profile (ICP)
                   </h3>
                   
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                         <div className="flex items-start gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg"><Briefcase className="w-4 h-4 text-slate-600 dark:text-slate-300" /></div>
                            <div>
                               <p className="text-xs font-bold text-slate-400 uppercase">Industries</p>
                               <div className="flex flex-wrap gap-1 mt-1">
                                  {strategy.icp.industries.map(i => (
                                    <span key={i} className="text-xs px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded font-medium">{i}</span>
                                  ))}
                               </div>
                            </div>
                         </div>
                         <div className="flex items-start gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg"><MapPin className="w-4 h-4 text-slate-600 dark:text-slate-300" /></div>
                            <div>
                               <p className="text-xs font-bold text-slate-400 uppercase">Location</p>
                               <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{strategy.icp.location}</p>
                            </div>
                         </div>
                      </div>
                      <div className="space-y-3">
                         <div className="flex items-start gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg"><Users className="w-4 h-4 text-slate-600 dark:text-slate-300" /></div>
                            <div>
                               <p className="text-xs font-bold text-slate-400 uppercase">Decision Makers</p>
                               <div className="flex flex-wrap gap-1 mt-1">
                                  {strategy.icp.roles.map(r => (
                                    <span key={r} className="text-xs px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded font-medium">{r}</span>
                                  ))}
                               </div>
                            </div>
                         </div>
                         <div className="flex items-start gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg"><Building className="w-4 h-4 text-slate-600 dark:text-slate-300" /></div>
                            <div>
                               <p className="text-xs font-bold text-slate-400 uppercase">Company Size</p>
                               <div className="flex flex-wrap gap-1 mt-1">
                                  {strategy.icp.companySize.map(s => (
                                    <span key={s} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-medium">{s}</span>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-xl shadow-lg text-white flex flex-col justify-between relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
                   <div>
                      <h4 className="text-lg font-bold mb-2">Ready to hunt?</h4>
                      <p className="text-indigo-100 text-sm opacity-90 mb-6">
                        We've generated a precise search query to find these exact leads right now.
                      </p>
                   </div>
                   <div className="bg-black/20 p-3 rounded-lg mb-4 text-xs font-mono truncate border border-white/10">
                      {strategy.suggestedSearchQuery}
                   </div>
                   <button 
                     onClick={() => onApplyStrategy(strategy.suggestedSearchQuery)}
                     className="w-full py-3 bg-white text-indigo-600 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors shadow-md"
                   >
                     <Search className="w-4 h-4" /> Find These Leads
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Your Value Proposition
                   </h3>
                   <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-100 font-medium text-lg leading-relaxed">
                      "{strategy.valueProp}"
                   </div>
                   <div className="mt-6">
                      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Elevator Pitch</h4>
                      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed italic">
                        "{strategy.pitch}"
                      </p>
                   </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-500" /> Customer Pain Points
                   </h3>
                   <div className="space-y-4">
                      {strategy.painPoints.map((point, idx) => (
                        <div key={idx} className="flex gap-3">
                           <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                              {idx + 1}
                           </div>
                           <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{point.title}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{point.description}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}