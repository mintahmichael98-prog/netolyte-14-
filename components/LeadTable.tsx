
import React, { useState } from 'react';
import { Lead, LeadStatus, Sequence } from '../types';
import { ExternalLink, Mail, Building, MapPin, Linkedin, Twitter, Facebook, Globe, User, Map, Instagram, Phone, MessageCircle, ChevronDown, PhoneCall, Copy, X, Plus, MoreHorizontal, MessageSquare, Filter, Clock, Eye, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface LeadTableProps {
  leads: Lead[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onSelectAll: (ids: number[]) => void;
  onStatusChange: (id: number, newStatus: LeadStatus) => void;
  onOpenEmail: (lead: Lead) => void;
  onOpenActivity?: (lead: Lead) => void;
  onViewDetails?: (lead: Lead) => void;
  sequences?: Sequence[];
  onAddToSequence?: (leadIds: number[], sequenceId: string) => void;
}

const LeadTable: React.FC<LeadTableProps> = ({ leads, selectedIds, onToggleSelect, onSelectAll, onStatusChange, onOpenEmail, onOpenActivity, onViewDetails, sequences, onAddToSequence }) => {
  const [page, setPage] = useState(1);
  const [callPreviewLead, setCallPreviewLead] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const itemsPerPage = 20;

  // Filter leads based on status and search query
  const filteredLeads = leads.filter(lead => {
    const matchesStatus = statusFilter === 'all' || (lead.status || 'new') === statusFilter;
    if (!matchesStatus) return false;

    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      lead.company.toLowerCase().includes(query) ||
      lead.contact.toLowerCase().includes(query) ||
      lead.location.toLowerCase().includes(query) ||
      lead.industry.toLowerCase().includes(query) ||
      lead.management?.some(m => m.name.toLowerCase().includes(query)) ||
      lead.description.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  
  const isAllSelected = paginatedLeads.length > 0 && paginatedLeads.every(l => selectedIds.has(l.id));

  const handleSelectAllPage = () => {
    if (isAllSelected) {
      const idsToRemove = paginatedLeads.map(l => l.id);
      const newSet = new Set(selectedIds);
      idsToRemove.forEach(id => newSet.delete(id));
      // Re-map for callback
      paginatedLeads.forEach(l => { if (selectedIds.has(l.id)) onToggleSelect(l.id); });
    } else {
      const idsToAdd = paginatedLeads.map(l => l.id);
      onSelectAll(idsToAdd);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 95) return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 ring-1 ring-indigo-500/20';
    if (score >= 90) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (score >= 80) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

  const getStatusStyle = (status: LeadStatus) => {
    switch (status) {
      case 'won': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'lost': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'qualified': return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800';
      case 'contacted': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'negotiation': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
      default: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
    }
  };

  const getPhoneNumber = (lead: Lead) => {
    if (lead.socials?.whatsapp) return `+${lead.socials.whatsapp}`;
    const parts = lead.contact.split(/[|•,]/);
    for (const part of parts) {
        const clean = part.trim();
        if (clean.replace(/[^0-9]/g, '').length >= 7 && !clean.includes('@')) {
            return clean;
        }
    }
    return 'No number found';
  };

  const getWhatsappLink = (lead: Lead): string | null => {
    if (lead.socials?.whatsapp) return `https://wa.me/${lead.socials.whatsapp}`;
    const parts = lead.contact.split(/[|•,]/);
    for (const part of parts) {
        if (!part.includes('@')) {
             const digits = part.replace(/[^0-9]/g, '');
             if (digits.length >= 7) { 
                 return `https://wa.me/${digits}`;
             }
        }
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col h-full relative">
      
      {/* Call Preview Modal */}
      {callPreviewLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-scale-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm overflow-hidden transform scale-100 transition-all">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
               <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                 <PhoneCall className="w-5 h-5 text-indigo-600" /> Call Preview
               </h3>
               <button onClick={() => setCallPreviewLead(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="p-6 text-center">
               <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
               </div>
               <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{callPreviewLead.company}</h4>
               <p className="text-sm text-slate-500 mb-6">{callPreviewLead.location}</p>
               
               <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4 mb-6 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Phone Number</p>
                  <p className="text-2xl font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {getPhoneNumber(callPreviewLead)}
                  </p>
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <button 
                    onClick={() => {
                      navigator.clipboard.writeText(getPhoneNumber(callPreviewLead));
                      toast.success("Number copied!");
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-200"
                 >
                    <Copy className="w-4 h-4" /> Copy
                 </button>
                 <a 
                    href={`tel:${getPhoneNumber(callPreviewLead)}`}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
                 >
                    <PhoneCall className="w-4 h-4" /> Call Now
                 </a>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400">
                  <Filter className="w-4 h-4" />
              </div>
              <div className="relative">
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
                    className="bg-transparent font-medium text-sm text-slate-700 dark:text-slate-200 outline-none cursor-pointer border-none focus:ring-0 pr-8 pl-1"
                >
                    <option value="all">All Statuses</option>
                    <option value="new">New Leads</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Closed Won</option>
                    <option value="lost">Lost</option>
                </select>
              </div>
              <span className="text-xs text-slate-400 px-2 border-l border-slate-200 dark:border-slate-600">
                  {filteredLeads.length} leads
              </span>
          </div>

          <div className="flex items-center gap-2">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search table..." 
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="pl-9 pr-4 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-slate-200 w-40 sm:w-56 transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => { setSearchQuery(''); setPage(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
             </div>
          </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 w-10">
                <input 
                    type="checkbox" 
                    checked={isAllSelected}
                    onChange={handleSelectAllPage}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Industry & Location</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Key People</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact & Actions</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {paginatedLeads.map((lead, index) => (
              <tr 
                key={lead.id} 
                className={`group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200 ${selectedIds.has(lead.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''} animate-fade-in-up`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-6 py-4">
                    <input 
                        type="checkbox" 
                        checked={selectedIds.has(lead.id)}
                        onChange={() => onToggleSelect(lead.id)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    />
                </td>
                <td className="px-6 py-4 max-w-[250px]">
                  <button 
                    onClick={() => onViewDetails && onViewDetails(lead)}
                    className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                  >
                    <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    {lead.company}
                  </button>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate cursor-help" title={lead.description}>
                    {lead.description}
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight ${getConfidenceColor(lead.confidence)}`}>
                      {lead.confidence}% Verified
                    </span>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="relative">
                    <select
                      value={lead.status || 'new'}
                      onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
                      className={`appearance-none pl-3 pr-8 py-1.5 rounded-full text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-800 transition-all border ${getStatusStyle(lead.status || 'new')}`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-60">
                      <ChevronDown className="w-3 h-3" />
                    </div>
                  </div>
                  
                  {lead.lastContacted && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                      <Clock className="w-3 h-3" />
                      {new Date(lead.lastContacted).toLocaleDateString()}
                    </div>
                  )}
                  
                  {sequences && sequences.length > 0 && onAddToSequence && (
                    <div className="mt-2 relative group/seq">
                      <button className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline">
                        <Plus className="w-3 h-3" /> Add to Sequence
                      </button>
                      <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg p-1 min-w-[150px] z-20 hidden group-hover/seq:block">
                        {sequences.map(seq => (
                          <button
                            key={seq.id}
                            onClick={() => onAddToSequence([lead.id], seq.id)}
                            className="w-full text-left px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded"
                          >
                            {seq.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 w-fit">
                      {lead.industry}
                    </span>
                    <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 group/loc">
                      <MapPin className="w-3 h-3 group-hover/loc:text-indigo-500 transition-colors" />
                      {lead.location}
                      {lead.googleMapsUrl && (
                        <a href={lead.googleMapsUrl} target="_blank" rel="noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                          <Map className="w-3 h-3 text-indigo-600" />
                        </a>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                    {lead.management && lead.management.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {lead.management.slice(0, 2).map((person, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                    <div className="bg-indigo-100 dark:bg-indigo-900/50 p-1 rounded-full flex-shrink-0">
                                        <User className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div className="flex flex-col leading-none">
                                        <span className="text-slate-700 dark:text-slate-200 font-medium">{person.name}</span>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400">{person.role}</span>
                                            {person.linkedin && (
                                                <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 transition-colors">
                                                    <Linkedin className="w-3 h-3" />
                                                </a>
                                            )}
                                            {person.email && (
                                                <a href={`mailto:${person.email}`} className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 transition-colors" title={person.email}>
                                                    <Mail className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <span className="text-xs text-slate-400 italic">Not found</span>
                    )}
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-col gap-2">
                    <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2 mb-1">
                      {/[0-9]/.test(lead.contact) ? <Phone className="w-3 h-3 text-slate-400" /> : <Mail className="w-3 h-3 text-slate-400" />}
                      <span className="truncate max-w-[150px]" title={lead.contact}>{lead.contact}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      {/* Call Button */}
                      {(/[0-9]/.test(lead.contact) || lead.socials?.whatsapp) && (
                         <button 
                            onClick={() => setCallPreviewLead(lead)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800 shadow-sm"
                            title="Call Number"
                          >
                            <PhoneCall className="w-4 h-4" />
                         </button>
                      )}

                      {/* Email Button */}
                      <button
                          onClick={() => onOpenEmail(lead)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 rounded-lg transition-colors border border-blue-200 dark:border-blue-800 shadow-sm"
                          title="Compose Email"
                       >
                          <Mail className="w-4 h-4" />
                       </button>

                      {/* WhatsApp Button */}
                      {getWhatsappLink(lead) && (
                         <a 
                            href={getWhatsappLink(lead)!} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400 rounded-lg transition-colors border border-green-200 dark:border-green-800 shadow-sm"
                            title="WhatsApp Chat"
                          >
                            <MessageCircle className="w-4 h-4" />
                         </a>
                      )}

                      {/* Website Button */}
                      {lead.website && (
                         <a 
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-400 rounded-lg transition-colors border border-purple-200 dark:border-purple-800 shadow-sm"
                            title="Visit Website"
                          >
                            <Globe className="w-4 h-4" />
                         </a>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button 
                        onClick={() => onOpenActivity && onOpenActivity(lead)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors"
                    >
                        <MessageSquare className="w-3 h-3" />
                        {lead.notes?.length || 0 > 0 ? (
                            <span className="bg-indigo-600 text-white px-1.5 rounded-full text-[9px] min-w-[16px] text-center">
                                {lead.notes?.length}
                            </span>
                        ) : 'Activity'}
                    </button>
                    {lead.assignedTo && (
                        <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-[10px] font-bold text-orange-600 dark:text-orange-400" title={`Assigned to ${lead.assignedTo}`}>
                            {lead.assignedTo.charAt(0)}
                        </div>
                    )}
                    <button
                        onClick={() => onViewDetails && onViewDetails(lead)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                        title="View Full Details"
                    >
                        <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {leads.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Showing <span className="font-medium">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(page * itemsPerPage, filteredLeads.length)}</span> of <span className="font-medium">{filteredLeads.length}</span> results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadTable;
