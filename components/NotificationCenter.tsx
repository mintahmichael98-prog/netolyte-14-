import React from 'react';
import { Notification, ViewMode } from '../types';
import { Bell, Zap, UserPlus, RefreshCw, X } from 'lucide-react';

interface Props {
  notifications: Notification[];
  onSetNotifications: (notifs: Notification[]) => void;
  onNavigate: (view: ViewMode, leadId?: number) => void;
}

const NotificationCenter: React.FC<Props> = ({ notifications, onSetNotifications, onNavigate }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleOpen = () => {
    if (!isOpen) {
      // Mark all as read when opening
      onSetNotifications(notifications.map(n => ({ ...n, read: true })));
    }
    setIsOpen(!isOpen);
  };

  const getIcon = (type: Notification['type']) => {
    switch(type) {
      case 'assignment': return <UserPlus className="w-4 h-4 text-purple-500" />;
      case 'success': return <Zap className="w-4 h-4 text-green-500" />;
      default: return <RefreshCw className="w-4 h-4 text-blue-500" />;
    }
  };

  const timeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  };

  return (
    <div className="relative">
      <button onClick={toggleOpen} className="relative p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-40 overflow-hidden animate-scale-in">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                No new notifications.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (notif.link) onNavigate(notif.link.view, notif.link.leadId);
                      setIsOpen(false);
                    }}
                    className="flex items-start gap-3 p-4 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {getIcon(notif.type)}
                    </div>
                    <div>
                      <p className="text-sm text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: notif.message }}></p>
                      <span className="text-xs text-slate-400">{timeAgo(notif.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
