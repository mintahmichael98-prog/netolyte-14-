




import React, { useState, useEffect } from 'react';
import { Lead, LeadTask } from '../types';
import { X, Building, MapPin, Globe, Users, Mail, Phone, Linkedin, Edit2, Save, Trash2, Plus, Calendar, CheckSquare, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  lead: Lead | null;
  onClose: () => void;
  onUpdate: (lead: Lead) => void;
}

export default function LeadDetailsModal({ lead, onClose, onUpdate }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'tasks'>('details');
  
  // Task State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Normal' | 'Low'>('Normal');

  useEffect(() => {
    setFormData(lead);
    setIsEditing(false);
    setActiveTab('details');
  }, [lead]);

  if (!lead || !formData) return null;

  const handleSave = () => {
    if (formData) {
      onUpdate(formData);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData(lead);
    setIsEditing(false);
  };

  const handleChange = (field: keyof Lead, value: any) => {
    setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  // Management/Key People Handlers
  const handleMemberChange = (index: number, field: string, value: string) => {
    if (!formData) return;
    const newManagement = [...(formData.management || [])];
    newManagement[index] = { ...newManagement[index], [field]: value };
    setFormData({ ...formData, management: newManagement });
  };

  const addMember = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      management: [...(formData.management || []), { name: '', role: '', email: '' }]
    });
  };

  const removeMember = (index: number) => {
    if (!formData) return;
    const newManagement = [...(formData.management || [])];
    newManagement.splice(index, 1);
    setFormData({ ...formData, management: newManagement });
  };

  // Task Handlers
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !formData) return;

    const task: LeadTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      dueDate: newTaskDate || new Date().toISOString().split('T')[0],
      priority: newTaskPriority,
      status: 'Open',
      assignedTo: 'Me'
    };

    const updatedTasks = [task, ...(formData.tasks || [])];
    const updatedLead = { ...formData, tasks: updatedTasks };
    
    setFormData(updatedLead);
    onUpdate(updatedLead); // Auto-save tasks
    
    setNewTaskTitle('');
    setNewTaskDate('');
    toast.success("Task created");
  };

  const toggleTaskStatus = (taskId: string) => {
    if (!formData) return;
    const updatedTasks = (formData.tasks || []).map(t => 
      t.id === taskId ? { ...t, status: t.status === 'Open' ? 'Completed' : 'Open' as 'Open' | 'Completed' } : t
    );
    const updatedLead = { ...formData, tasks: updatedTasks };
    setFormData(updatedLead);
    onUpdate(updatedLead);
  };

  const deleteTask = (taskId: string) => {
    if (!formData) return;
    const updatedTasks = (formData.tasks || []).filter(t => t.id !== taskId);
    const updatedLead = { ...formData, tasks: updatedTasks };
    setFormData(updatedLead);
    onUpdate(updatedLead);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-purple-600 shrink-0">
           <div className="absolute top-4 right-4 flex gap-2">
             {!isEditing && activeTab === 'details' && (
               <button 
                 onClick={() => setIsEditing(true)}
                 className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                 title="Edit Lead"
               >
                 <Edit2 className="w-5 h-5" />
               </button>
             )}
             <button 
               onClick={onClose}
               className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
             >
               <X className="w-5 h-5" />
             </button>
           </div>
           <div className="absolute -bottom-10 left-8">
              <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center border-4 border-white dark:border-slate-800 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                 {lead.company.charAt(0)}
              </div>
           </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-12 px-8 flex border-b border-slate-200 dark:border-slate-700">
           <button 
             onClick={() => setActiveTab('details')}
             className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
           >
             Details
           </button>
           <button 
             onClick={() => setActiveTab('tasks')}
             className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'tasks' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
           >
             Tasks & Activities 
             {formData.tasks && formData.tasks.filter(t => t.status === 'Open').length > 0 && (
               <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                 {formData.tasks.filter(t => t.status === 'Open').length}
               </span>
             )}
           </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50 dark:bg-slate-900/50">
           
           {activeTab === 'details' && (
             isEditing ? (
               <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Name</label>
                        <input 
                          className="w-full p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                          value={formData.company}
                          onChange={(e) => handleChange('company', e.target.value)}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Industry</label>
                        <input 
                          className="w-full p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                          value={formData.industry}
                          onChange={(e) => handleChange('industry', e.target.value)}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                        <input 
                          className="w-full p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                          value={formData.location}
                          onChange={(e) => handleChange('location', e.target.value)}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Employees</label>
                        <input 
                          className="w-full p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                          value={formData.employees}
                          onChange={(e) => handleChange('employees', e.target.value)}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Website</label>
                        <input 
                          className="w-full p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                          value={formData.website}
                          onChange={(e) => handleChange('website', e.target.value)}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone / Contact</label>
                        <input 
                          className="w-full p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                          value={formData.contact}
                          onChange={(e) => handleChange('contact', e.target.value)}
                        />
                     </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                     <textarea 
                        className="w-full p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none h-24"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                     />
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase">Key People</h3>
                        <button 
                          onClick={addMember}
                          className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold px-2 py-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Add Person
                        </button>
                     </div>
                     
                     <div className="space-y-3">
                        {formData.management?.map((person, idx) => (
                           <div key={idx} className="flex gap-2 items-start bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                 <input 
                                   placeholder="Name"
                                   className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded outline-none focus:border-indigo-500 dark:text-white"
                                   value={person.name}
                                   onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                                 />
                                 <input 
                                   placeholder="Role"
                                   className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded outline-none focus:border-indigo-500 dark:text-white"
                                   value={person.role}
                                   onChange={(e) => handleMemberChange(idx, 'role', e.target.value)}
                                 />
                                 <input 
                                   placeholder="Email"
                                   className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded outline-none focus:border-indigo-500 dark:text-white"
                                   value={person.email || ''}
                                   onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                                 />
                              </div>
                              <button 
                                onClick={() => removeMember(idx)}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Remove"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        ))}
                        {(!formData.management || formData.management.length === 0) && (
                          <div className="text-center py-4 text-sm text-slate-400 italic bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                             No key people listed. Add one above.
                          </div>
                        )}
                     </div>
                  </div>
                  
                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
                     <button 
                       onClick={handleCancel}
                       className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                     >
                       Cancel
                     </button>
                     <button 
                       onClick={handleSave}
                       className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md transition-colors flex items-center gap-2"
                     >
                       <Save className="w-4 h-4" /> Save Changes
                     </button>
                  </div>
               </div>
             ) : (
               <>
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                          {lead.company}
                          <a href={lead.googleMapsUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-500 transition-colors">
                             <MapPin className="w-5 h-5" />
                          </a>
                       </h2>
                       <div className="flex items-center gap-2 mt-2 text-slate-500 dark:text-slate-400 text-sm">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {lead.location}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {lead.industry}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {lead.employees} Employees</span>
                       </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          lead.status === 'new' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          lead.status === 'qualified' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                       }`}>
                          {lead.status || 'New'}
                       </span>
                       <div className="text-xs font-medium text-slate-400">
                          Confidence: <span className="text-emerald-500">{lead.confidence}%</span>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                       <section>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">About</h3>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                             {lead.description || "No description available for this company."}
                          </p>
                       </section>

                       <section>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                             Key People <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px]">{lead.management?.length || 0}</span>
                          </h3>
                          <div className="space-y-3">
                             {lead.management && lead.management.length > 0 ? (
                                lead.management.map((person, idx) => (
                                   <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors group">
                                      <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                            {person.name.charAt(0)}
                                         </div>
                                         <div>
                                            <div className="font-semibold text-slate-900 dark:text-white text-sm">{person.name}</div>
                                            <div className="text-xs text-slate-500">{person.role}</div>
                                         </div>
                                      </div>
                                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                         {person.email && (
                                            <a href={`mailto:${person.email}`} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title={person.email}>
                                               <Mail className="w-4 h-4" />
                                            </a>
                                         )}
                                         {person.linkedin && (
                                            <a href={person.linkedin} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-[#0077b5] hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                               <Linkedin className="w-4 h-4" />
                                            </a>
                                         )}
                                      </div>
                                   </div>
                                ))
                             ) : (
                                <div className="text-sm text-slate-400 italic">No management info available.</div>
                             )}
                          </div>
                       </section>
                    </div>

                    <div className="space-y-6">
                       <section className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Contact Info</h3>
                          <ul className="space-y-4">
                             {lead.website && (
                                <li className="flex items-start gap-3">
                                   <Globe className="w-4 h-4 text-slate-400 mt-0.5" />
                                   <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline break-all">
                                      {lead.website}
                                   </a>
                                </li>
                             )}
                             {lead.contact && lead.contact !== 'N/A' && (
                                <li className="flex items-start gap-3">
                                   <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                                   <span className="text-sm text-slate-700 dark:text-slate-300 break-all">{lead.contact}</span>
                                </li>
                             )}
                             <li className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">{lead.location}</span>
                             </li>
                          </ul>
                       </section>

                       <section>
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Social Profiles</h3>
                          <div className="flex gap-2 flex-wrap">
                             {lead.socials?.linkedin && (
                                <a href={lead.socials.linkedin} target="_blank" rel="noreferrer" className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-[#0077b5] hover:border-[#0077b5]/30 transition-colors">
                                   <Linkedin className="w-5 h-5" />
                                </a>
                             )}
                             {/* ... other socials ... */}
                             {(!lead.socials || Object.values(lead.socials).every(v => !v)) && (
                                <span className="text-xs text-slate-400 italic">No profiles found</span>
                             )}
                          </div>
                       </section>
                    </div>
                 </div>
               </>
             )
           )}

           {activeTab === 'tasks' && (
             <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                   <h3 className="font-bold text-slate-900 dark:text-white mb-4">Create New Task</h3>
                   <form onSubmit={addTask} className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1 w-full">
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                         <input 
                           value={newTaskTitle}
                           onChange={(e) => setNewTaskTitle(e.target.value)}
                           placeholder="e.g. Follow up on proposal"
                           className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                         />
                      </div>
                      <div className="w-full md:w-40">
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date</label>
                         <div className="relative">
                            <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                              type="date"
                              value={newTaskDate}
                              onChange={(e) => setNewTaskDate(e.target.value)}
                              className="w-full pl-9 pr-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
                            />
                         </div>
                      </div>
                      <div className="w-full md:w-32">
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority</label>
                         <select
                           value={newTaskPriority}
                           onChange={(e) => setNewTaskPriority(e.target.value as any)}
                           className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
                         >
                           <option value="High">High</option>
                           <option value="Normal">Normal</option>
                           <option value="Low">Low</option>
                         </select>
                      </div>
                      <button 
                        type="submit"
                        disabled={!newTaskTitle.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-md transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add
                      </button>
                   </form>
                </div>

                <div>
                   <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Upcoming Tasks</h3>
                   <div className="space-y-2">
                      {formData.tasks?.filter(t => t.status === 'Open').length === 0 && (
                         <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-sm">
                            No open tasks. You're all caught up!
                         </div>
                      )}
                      
                      {formData.tasks?.filter(t => t.status === 'Open').map(task => (
                         <div key={task.id} className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group">
                            <button 
                              onClick={() => toggleTaskStatus(task.id)}
                              className="w-6 h-6 rounded border-2 border-slate-300 dark:border-slate-600 hover:border-green-500 flex items-center justify-center transition-colors"
                            >
                               {/* Empty check */}
                            </button>
                            <div className="flex-1">
                               <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{task.title}</span>
                                  {task.priority === 'High' && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">HIGH</span>}
                               </div>
                               <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due {task.dueDate}</span>
                                  <span>Assigned to: {task.assignedTo}</span>
                               </div>
                            </div>
                            <button onClick={() => deleteTask(task.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      ))}
                   </div>
                </div>

                {formData.tasks && formData.tasks.filter(t => t.status === 'Completed').length > 0 && (
                   <div className="pt-6 border-t border-slate-200 dark:border-slate-700 opacity-60">
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Completed</h3>
                      <div className="space-y-2">
                         {formData.tasks.filter(t => t.status === 'Completed').map(task => (
                            <div key={task.id} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                               <button 
                                 onClick={() => toggleTaskStatus(task.id)}
                                 className="w-6 h-6 rounded bg-green-500 border-2 border-green-500 flex items-center justify-center text-white"
                               >
                                  <CheckSquare className="w-4 h-4" />
                               </button>
                               <span className="flex-1 text-slate-500 line-through text-sm">{task.title}</span>
                               <span className="text-xs text-slate-400">{task.dueDate}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}