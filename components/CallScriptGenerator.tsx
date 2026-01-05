
import React, { useState, useEffect } from 'react';
import { Lead } from '../types';
import { generateCallScript } from '../services/geminiService';
import { FileText, Loader2, RefreshCw } from 'lucide-react';

interface Props {
  lead: Lead;
}

const CallScriptGenerator: React.FC<Props> = ({ lead }) => {
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchScript = async () => {
    setLoading(true);
    try {
      const generatedScript = await generateCallScript(lead);
      setScript(generatedScript);
    } catch (e) {
      setScript("Could not generate a script. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScript();
  }, [lead.id]); // Re-fetch when the lead changes

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4" /> AI Sales Script
        </h4>
        <button onClick={fetchScript} disabled={loading} className="p-1 text-slate-400 hover:text-indigo-500 disabled:opacity-50 transition-colors" title="Regenerate Script">
           <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {loading ? (
          <div className="space-y-4 pt-2">
            <div className="h-4 bg-slate-100 dark:bg-slate-700/50 rounded w-1/3 animate-pulse"></div>
            <div className="space-y-2">
                <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded w-full animate-pulse"></div>
                <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded w-5/6 animate-pulse"></div>
                <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded w-4/6 animate-pulse"></div>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-700/50 rounded w-1/4 animate-pulse mt-6"></div>
            <div className="space-y-2">
                <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded w-full animate-pulse"></div>
                <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded w-full animate-pulse"></div>
            </div>
          </div>
        ) : (
          <div 
            className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed text-sm"
            dangerouslySetInnerHTML={{
               __html: script
                 .replace(/^### (.*?)$/gm, '<h3 class="text-indigo-600 dark:text-indigo-400 text-sm font-bold uppercase tracking-wide mt-6 mb-2">$1</h3>')
                 .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white">$1</strong>')
                 .replace(/\n/g, '<br/>')
             }}
          >
          </div>
        )}
      </div>
    </div>
  );
};

export default CallScriptGenerator;
