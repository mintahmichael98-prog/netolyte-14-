
import React, { useState, useEffect } from 'react';
import { UserProfile, Lead } from '../types';
import { authService } from '../services/authService';
import { Users, UserPlus, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  currentUser: UserProfile;
  onViewAs: (userId: string | null) => void; // null means view all/own
  viewingAsId: string | null;
  leads: Lead[]; // To show stats
  onUpdateStatus?: (status: any) => void;
}

export default function TeamManagement({ currentUser, onViewAs, viewingAsId, leads }: Props) {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'user'>('user');
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const team = await authService.getTeamMembers();
      setMembers(team);
    } catch (e) {
      toast.error("Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    const toastId = toast.loading("Sending invitation...");
    try {
      // Cast role to 'admin' | 'member' if needed by service, but usually we sync types.
      // Here assuming authService accepts the string or we adjust.
      // For mock service, we'll just pass it.
      await authService.inviteMember(inviteEmail, inviteRole as any);
      toast.success(`Invited ${inviteEmail}`, { id: toastId });
      setInviteEmail('');
      setShowInviteForm(false);
      loadTeam();
    } catch (err) {
      toast.error("Failed to invite", { id: toastId });
    }
  };

  // Calculate stats per member from the global leads list
  const getMemberStats = (userId: string) => {
    const userLeads = leads.filter(l => l.ownerId === userId);
    return {
      total: userLeads.length,
      value: userLeads.length * 15000 // Estimated GHS value
    };
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Team...</div>;

  return (
    <div className="h-full p-8 overflow-y-auto bg-slate-50 dark:bg-[#020617]">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-indigo-600" /> Team Management
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Manage your team members, assign roles, and view their performance.
            </p>
          </div>
          <button 
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg animate-slide-down">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Invite New User</h3>
            <form onSubmit={handleInvite} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  required
                />
              </div>
              <div className="w-48">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Role</label>
                <select 
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as 'admin' | 'user')}
                  className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white cursor-pointer"
                >
                  <option value="user">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold">
                Send Invite
              </button>
            </form>
          </div>
        )}

        {/* Team Grid */}
        <div className="grid grid-cols-1 gap-4">
          {members.map(member => {
            const stats = getMemberStats(member.id);
            const isMe = member.email === currentUser.email;
            
            return (
              <div key={member.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xl font-bold text-indigo-700 dark:text-indigo-300">
                    {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white">{member.name} {isMe && '(You)'}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${member.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                        {member.role}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-400 font-bold uppercase">Leads Generated</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.total}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-400 font-bold uppercase">Pipeline Value</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 }).format(stats.value)}
                    </p>
                  </div>
                  
                  {/* Admin Actions */}
                  {currentUser.role === 'admin' && (
                    <div className="flex gap-2 pl-4 border-l border-slate-200 dark:border-slate-700">
                      <button 
                        onClick={() => onViewAs(member.id === viewingAsId ? null : member.id)}
                        className={`p-2 rounded-lg transition-colors border ${
                          viewingAsId === member.id 
                            ? 'bg-indigo-600 text-white border-indigo-600' 
                            : 'bg-white dark:bg-slate-700 text-slate-500 hover:text-indigo-600 border-slate-200 dark:border-slate-600'
                        }`}
                        title={viewingAsId === member.id ? "Stop viewing" : "View Dashboard as this user"}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!isMe && (
                        <button className="p-2 bg-white dark:bg-slate-700 text-slate-400 hover:text-red-500 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
