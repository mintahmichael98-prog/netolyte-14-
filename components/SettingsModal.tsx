







import React, { useState, useEffect } from 'react';
import { X, Plug, User, Save, Bell, Globe, SlidersHorizontal, Chrome, Languages, Cloud } from 'lucide-react';
import { AppSettings, Lead, Language } from '../types';
import toast from 'react-hot-toast';
import ExtensionBridge from './ExtensionBridge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onAddLeads: (leads: Lead[]) => void;
}

export default function SettingsModal({ isOpen, onClose, settings, onSave, onAddLeads }: Props) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'general' | 'integrations' | 'salesforce'>('general');

  useEffect(() => {
    setLocalSettings(settings);
    setActiveTab('general'); // Reset to general tab on open
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
    toast.success("Settings saved successfully");
  };
  
  const handleSalesforceConnect = () => {
    // Simulate OAuth flow
    toast.loading("Connecting to Salesforce...");
    setTimeout(() => {
        toast.dismiss();
        setLocalSettings(prev => ({
            ...prev,
            salesforce: {
                ...prev.salesforce!,
                connected: true,
                instanceUrl: 'https://na1.salesforce.com'
            }
        }));
        toast.success("Salesforce Connected!");
    }, 2000);
  };

  const handleSalesforceDisconnect = () => {
      setLocalSettings(prev => ({
          ...prev,
          salesforce: { ...prev.salesforce!, connected: false }
      }));
      toast.success("Salesforce Disconnected");
  };
  
  const TabButton = ({ isActive, onClick, icon: Icon, label }: { isActive: boolean, onClick: () => void, icon: any, label: string }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
        isActive
          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
          : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Settings & Configuration
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 px-4">
          <TabButton isActive={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={SlidersHorizontal} label="General" />
          <TabButton isActive={activeTab === 'salesforce'} onClick={() => setActiveTab('salesforce')} icon={Cloud} label="Salesforce" />
          <TabButton isActive={activeTab === 'integrations'} onClick={() => setActiveTab('integrations')} icon={Chrome} label="Extensions" />
        </div>

        <div className="p-6 overflow-y-auto space-y-8 bg-slate-50 dark:bg-slate-900/30 flex-1">
          {activeTab === 'general' && (
            <>
              <section>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <Languages className="w-5 h-5 text-indigo-600" /> Language
                </h3>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Interface Language
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <select
                      value={localSettings.language}
                      onChange={(e) => setLocalSettings(s => ({ ...s, language: e.target.value as Language }))}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white appearance-none cursor-pointer"
                    >
                      <option value="en">English (US)</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Adjust the dashboard interface language. Content generated by AI will still primarily match your search queries.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <Plug className="w-5 h-5 text-indigo-600" /> Webhooks
                </h3>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Webhook URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={localSettings.webhookUrl}
                      onChange={(e) => setLocalSettings(s => ({ ...s, webhookUrl: e.target.value }))}
                      placeholder="https://hooks.zapier.com/hooks/catch/..."
                      className="flex-1 px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    We will send a JSON POST request to this URL whenever a lead's status is updated in the pipeline.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-indigo-600" /> Brand Persona
                </h3>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Global Tone & Voice
                  </label>
                  <textarea
                    value={localSettings.brandVoice}
                    onChange={(e) => setLocalSettings(s => ({ ...s, brandVoice: e.target.value }))}
                    placeholder="e.g. Professional, authoritative, and concise. Use industry jargon but keep it friendly."
                    className="w-full h-24 px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none dark:text-white"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    This persona will be instructed to the AI when generating Emails, SMS, and WhatsApp drafts.
                  </p>
                </div>
              </section>
            </>
          )}

          {activeTab === 'salesforce' && (
             <section className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900 flex items-start gap-3">
                   <Cloud className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
                   <div>
                      <h4 className="font-bold text-blue-900 dark:text-blue-200">Salesforce Integration</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                         Sync generated leads directly to your Salesforce CRM as Leads or Contacts.
                      </p>
                   </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                   {localSettings.salesforce?.connected ? (
                      <div className="text-center py-6">
                         <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plug className="w-8 h-8 text-green-600 dark:text-green-400" />
                         </div>
                         <h3 className="text-lg font-bold text-slate-900 dark:text-white">Connected to Salesforce</h3>
                         <p className="text-slate-500 text-sm mb-6">Org: {localSettings.salesforce.instanceUrl}</p>
                         
                         <div className="flex flex-col gap-3 max-w-xs mx-auto">
                            <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer">
                               <input 
                                 type="checkbox" 
                                 checked={localSettings.salesforce.autoSync}
                                 onChange={e => setLocalSettings(prev => ({...prev, salesforce: {...prev.salesforce!, autoSync: e.target.checked}}))}
                                 className="w-5 h-5 rounded text-blue-600"
                               />
                               <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Auto-sync new leads</span>
                            </label>
                            <button 
                              onClick={handleSalesforceDisconnect}
                              className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
                            >
                               Disconnect
                            </button>
                         </div>
                      </div>
                   ) : (
                      <div className="space-y-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Consumer Key (Client ID)</label>
                            <input 
                              type="text"
                              value={localSettings.salesforce?.clientId || ''}
                              onChange={e => setLocalSettings(prev => ({...prev, salesforce: {...prev.salesforce!, clientId: e.target.value}}))}
                              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                              placeholder="3MVG9..."
                            />
                         </div>
                         <button 
                           onClick={handleSalesforceConnect}
                           disabled={!localSettings.salesforce?.clientId}
                           className="w-full py-3 bg-[#00A1E0] hover:bg-[#0081B3] disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                         >
                            Connect via OAuth
                         </button>
                         <p className="text-xs text-center text-slate-400">
                            You will be redirected to login.salesforce.com to authorize.
                         </p>
                      </div>
                   )}
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                   <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">Field Mapping</h4>
                   <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
                         <span className="text-slate-500">Netolyte Field</span>
                         <span className="text-slate-500">Salesforce Object</span>
                      </div>
                      <div className="flex justify-between items-center p-2 border-b border-slate-100 dark:border-slate-700">
                         <span className="font-mono text-slate-700 dark:text-slate-300">Company</span>
                         <span className="font-mono text-blue-600">Lead.Company</span>
                      </div>
                      <div className="flex justify-between items-center p-2 border-b border-slate-100 dark:border-slate-700">
                         <span className="font-mono text-slate-700 dark:text-slate-300">Contact Name</span>
                         <span className="font-mono text-blue-600">Lead.Name</span>
                      </div>
                      <div className="flex justify-between items-center p-2 border-b border-slate-100 dark:border-slate-700">
                         <span className="font-mono text-slate-700 dark:text-slate-300">Email</span>
                         <span className="font-mono text-blue-600">Lead.Email</span>
                      </div>
                      <div className="flex justify-between items-center p-2">
                         <span className="font-mono text-slate-700 dark:text-slate-300">Description</span>
                         <span className="font-mono text-blue-600">Lead.Description</span>
                      </div>
                   </div>
                </div>
             </section>
          )}

          {activeTab === 'integrations' && (
            <ExtensionBridge onAddLeads={onAddLeads} />
          )}
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-white dark:bg-slate-800 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}