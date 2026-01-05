
import React, { useState, useEffect } from 'react';
import { BookingSettings } from '../types';
import { Calendar, Link as LinkIcon, Clock, Save, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  settings: BookingSettings;
  onSave: (settings: BookingSettings) => void;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function BookingCalendar({ settings, onSave }: Props) {
  const [localSettings, setLocalSettings] = useState<BookingSettings>(settings);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setLocalSettings(prev => ({ ...prev, isConnected: true }));
      setIsConnecting(false);
      toast.success("Calendar connected successfully!");
    }, 1500);
  };
  
  const handleSave = () => {
    onSave(localSettings);
    toast.success("Booking settings saved!");
  };

  const handleAvailabilityChange = (day: string, field: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value,
        },
      },
    }));
  };

  if (!localSettings.isConnected) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-slate-50 dark:bg-[#020617] text-center">
        <div className="max-w-md">
          <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-200 dark:border-slate-700 shadow-xl">
            <Calendar className="w-12 h-12 text-indigo-500" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Connect Your Calendar</h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-8">
            Integrate your Google or Outlook calendar to allow leads to book meetings directly. This enables your personal booking link for use in email campaigns.
          </p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 mx-auto"
          >
            {isConnecting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
            {isConnecting ? 'Connecting...' : 'Connect Calendar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8 bg-slate-50 dark:bg-[#020617]">
      <div className="max-w-4xl mx-auto space-y-10">
        
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Calendar className="w-8 h-8 text-indigo-500" /> Booking Page Settings
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Manage your personal booking link and availability.
            </p>
          </div>
          <button onClick={handleSave} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>

        {/* URL and Meeting Settings */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Event Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Booking URL</label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-r-0 border-slate-200 dark:border-slate-700 rounded-l-lg text-slate-500 text-sm">netolyte.ai/book/</span>
                <input
                  type="text"
                  value={localSettings.urlSlug}
                  onChange={(e) => setLocalSettings(prev => ({...prev, urlSlug: e.target.value.replace(/\s+/g, '-').toLowerCase()}))}
                  placeholder="your-name"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Meeting Title</label>
                <input
                  type="text"
                  value={localSettings.meetingTitle}
                  onChange={(e) => setLocalSettings(prev => ({...prev, meetingTitle: e.target.value}))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Duration</label>
                <select
                  value={localSettings.meetingDuration}
                  onChange={(e) => setLocalSettings(prev => ({...prev, meetingDuration: parseInt(e.target.value)}))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>
          </div>
          <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg flex items-center gap-3 border border-indigo-100 dark:border-indigo-800">
             <LinkIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
             <span className="text-sm text-indigo-800 dark:text-indigo-200 font-medium">
                Your live booking link: <a href="#" className="font-bold underline">https://netolyte.ai/book/{localSettings.urlSlug || '...'}</a>
             </span>
          </div>
        </div>

        {/* Availability Settings */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
           <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Weekly Availability</h3>
           <div className="space-y-4">
              {DAYS.map(day => (
                 <div key={day} className="grid grid-cols-5 items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="col-span-1 flex items-center">
                       <input 
                         type="checkbox" 
                         checked={localSettings.availability[day].enabled}
                         onChange={(e) => handleAvailabilityChange(day, 'enabled', e.target.checked)}
                         className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                       />
                       <label className="ml-3 text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">{day}</label>
                    </div>
                    {localSettings.availability[day].enabled ? (
                      <>
                        <div className="col-span-2 flex items-center gap-2">
                           <input 
                              type="time" 
                              value={localSettings.availability[day].startTime}
                              onChange={(e) => handleAvailabilityChange(day, 'startTime', e.target.value)}
                              className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                           />
                           <span>-</span>
                           <input 
                              type="time" 
                              value={localSettings.availability[day].endTime}
                              onChange={(e) => handleAvailabilityChange(day, 'endTime', e.target.value)}
                              className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                           />
                        </div>
                        <div className="col-span-2"></div>
                      </>
                    ) : (
                      <div className="col-span-4 text-sm text-slate-400">Unavailable</div>
                    )}
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}