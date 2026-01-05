
import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus, UserProfile } from '../types';
import { generateExcelReport } from '../utils/reportGenerator';
import { FileSpreadsheet, Calendar, Filter, PieChart, Download, BarChart3, TrendingUp, Building2, MapPin, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';

interface Props {
  leads: Lead[];
  teamMembers?: UserProfile[];
  currentUser?: UserProfile;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

export default function ReportsView({ leads, teamMembers, currentUser }: Props) {
  // Default to last 30 days
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');

  // Extract unique Industries and Locations for Dropdowns
  const availableIndustries = useMemo(() => {
    const industries = new Set(leads.map(l => l.industry || 'Unknown'));
    return Array.from(industries).sort();
  }, [leads]);

  const availableLocations = useMemo(() => {
    // Simplify locations to Cities if possible, or just unique strings
    const locations = new Set(leads.map(l => l.location ? l.location.split(',')[0].trim() : 'Unknown'));
    return Array.from(locations).sort();
  }, [leads]);

  // Filter Logic for Preview
  const filteredData = useMemo(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return leads.filter(l => {
      // Heuristic: use ID as timestamp if valid, else assume recent
      const leadDate = l.id > 1000000000000 ? l.id : Date.now();
      const matchesDate = leadDate >= start && leadDate <= end + 86400000;
      const matchesStatus = statusFilter === 'all' || (l.status || 'new') === statusFilter;
      const matchesIndustry = industryFilter === 'all' || (l.industry || 'Unknown') === industryFilter;
      const matchesLocation = locationFilter === 'all' || (l.location && l.location.includes(locationFilter));
      
      // User/Owner Filter
      const matchesUser = userFilter === 'all' || l.ownerId === userFilter;
      
      return matchesDate && matchesStatus && matchesIndustry && matchesLocation && matchesUser;
    });
  }, [leads, startDate, endDate, statusFilter, industryFilter, locationFilter, userFilter]);

  // Chart Data Preparation
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(l => {
      const s = (l.status || 'new').toUpperCase();
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const industryData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(l => {
      const i = l.industry || 'Unknown';
      counts[i] = (counts[i] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredData]);

  const handleGenerate = () => {
    generateExcelReport(filteredData, { 
      startDate, 
      endDate, 
      status: statusFilter,
      industry: industryFilter,
      location: locationFilter
    });
  };

  // Calculate Pipeline Value (Estimated GHS)
  const pipelineValue = useMemo(() => {
    const totalValue = filteredData.length * 15000;
    return new Intl.NumberFormat('en-GH', { 
      style: 'currency', 
      currency: 'GHS',
      maximumFractionDigits: 0 
    }).format(totalValue);
  }, [filteredData]);

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="h-full p-8 overflow-y-auto bg-slate-50 dark:bg-[#020617]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-emerald-600" /> Lead Intelligence Reports
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Generate advanced Excel reports with pivot tables, and pipeline breakdowns in GHS.
          </p>
        </div>

        {/* Controls Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-end">
            
            <div className="col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>
            </div>

            {/* Admin Only: Team Filter */}
            {isAdmin && teamMembers && (
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Team Member</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <select 
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="w-full pl-9 pr-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white appearance-none"
                  >
                    <option value="all">All Users</option>
                    <option value={currentUser.id}>My Leads Only</option>
                    {teamMembers.filter(m => m.id !== currentUser.id).map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status</label>
              <div className="relative">
                <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full pl-9 pr-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white appearance-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="won">Closed Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Industry</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <select 
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white appearance-none"
                >
                  <option value="all">All Industries</option>
                  {availableIndustries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <select 
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white appearance-none"
                >
                  <option value="all">All Locations</option>
                  {availableLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              className="col-span-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95 h-[40px] whitespace-nowrap"
            >
              <Download className="w-4 h-4" /> Download
            </button>

          </div>
        </div>

        {/* Live Preview Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Quick Stats */}
          <div className="space-y-6">
             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Selected Leads</p>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{filteredData.length}</h3>
                </div>
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Filter className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
             </div>
             
             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pipeline Value (Est)</p>
                  <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{pipelineValue}</h3>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
             </div>
          </div>

          {/* Status Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
             <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
               <PieChart className="w-4 h-4 text-purple-500" /> Status Breakdown
             </h3>
             <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </RePieChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Industry Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
             <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
               <BarChart3 className="w-4 h-4 text-blue-500" /> Top Industries
             </h3>
             <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={industryData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.1} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 10}} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
