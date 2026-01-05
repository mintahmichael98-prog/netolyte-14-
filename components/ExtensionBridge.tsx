



import React, { useState } from 'react';
import { Chrome, Download, CheckCircle2, Link as LinkIcon, Loader2, Globe, Sparkles } from 'lucide-react';
import { Lead } from '../types';
import { generateLeadsBatch } from '../services/geminiService';
import toast from 'react-hot-toast';

interface Props {
  onAddLeads: (leads: Lead[]) => void;
}

export default function ExtensionBridge({ onAddLeads }: Props) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [manualLink, setManualLink] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      toast.success("Netolyte Extension Connected!");
    }, 1500);
  };

  const handleManualEnrich = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLink) return;
    
    setIsEnriching(true);
    try {
      const leads = await generateLeadsBatch(`Analyze this profile: ${manualLink}`, 1, 0);
      
      if (leads && leads.length > 0) {
        const lead = leads[0];
        lead.description = `Imported from Browser Extension via ${new URL(manualLink).hostname}`;
        
        onAddLeads([lead]);
        toast.success(`Successfully enriched ${lead.company}`);
        setManualLink('');
      } else {
        toast.error("Could not extract data from this link.");
      }
    } catch (err) {
      toast.error("Enrichment failed. Check the URL.");
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Chrome className="w-5 h-5 text-blue-500" /> Chrome Extension
        </h3>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 space-y-3">
               <div className="flex items-center gap-3">
                 <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                   {isConnected ? "Extension Active" : "Connect your Browser"}
                 </h4>
                 {isConnected && (
                   <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full flex items-center gap-1">
                     <CheckCircle2 className="w-3 h-3" /> Live
                   </span>
                 )}
               </div>
               <p className="text-slate-600 dark:text-slate-300 text-sm">
                 {isConnected 
                   ? "Navigate to any LinkedIn profile or company site and click the Netolyte icon to capture data." 
                   : "Download our extension to enable 1-click lead capture from any website."}
               </p>
               
               {!isConnected && (
                 <div className="pt-2">
                    <button 
                      onClick={handleConnect}
                      className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
                    >
                      {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {isConnecting ? "Connecting..." : "Install Extension"}
                    </button>
                 </div>
               )}
            </div>
            
            <div className="w-full md:w-1/3 h-24 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 relative flex items-center justify-center p-4">
               <div className="space-y-2 opacity-40 w-full">
                  <div className="h-2 bg-slate-300 dark:bg-slate-700 rounded w-3/4"></div>
                  <div className="h-2 bg-slate-300 dark:bg-slate-700 rounded w-1/2"></div>
               </div>
               {isConnected && (
                 <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] rounded-lg">
                    <div className="bg-blue-600 text-white p-2.5 rounded-full shadow-lg">
                      <LinkIcon className="w-5 h-5" />
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-500" /> Manual Enrichment
        </h3>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
            Paste a LinkedIn URL or company website to simulate the data payload the extension would send.
          </p>
          
          <form onSubmit={handleManualEnrich} className="flex gap-3">
             <div className="flex-1 relative">
                <Globe className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={manualLink}
                  onChange={(e) => setManualLink(e.target.value)}
                  placeholder="https://www.linkedin.com/in/..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                />
             </div>
             <button 
               type="submit"
               disabled={isEnriching || !manualLink}
               className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
             >
               {isEnriching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enrich"}
             </button>
          </form>
        </div>
      </section>
    </div>
  );
}