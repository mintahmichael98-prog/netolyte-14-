import React, { useState } from 'react';
import { Clock, Users, Trash2, ArrowRight, FolderOpen, Calendar, Edit2, Check, X } from 'lucide-react';

interface Props {
  savedLists: any[];
  onRestore: (list: any) => void;
  onDelete: (id: number) => void;
  onRename: (id: number, newName: string) => void;
}

export default function SavedLists({ savedLists, onRestore, onDelete, onRename }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempName, setTempName] = useState('');

  const startEditing = (list: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(list.id);
    setTempName(list.query);
  };

  const saveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingId !== null && tempName.trim()) {
      onRename(editingId, tempName);
      setEditingId(null);
    }
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  if (savedLists.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <FolderOpen className="w-10 h-10 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Saved Lists</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
          Generate leads or import a CSV, then click "Save List" to access them here later.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8 bg-slate-50 dark:bg-[#020617]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="animate-slide-up">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-indigo-600" /> Saved Lists
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage your saved searches, imported lists, and generated lead snapshots.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedLists.map((list, index) => (
            <div 
              key={list.id} 
              className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col animate-slide-up"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Thumbnail Area */}
              <div className="h-32 bg-slate-100 dark:bg-slate-900/50 relative overflow-hidden border-b border-slate-100 dark:border-slate-700/50 cursor-pointer" onClick={() => onRestore(list)}>
                {list.thumbnail ? (
                  <img src={list.thumbnail} alt="" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                    <FolderOpen className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-white text-xs font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(list.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2 h-8">
                  {editingId === list.id ? (
                    <div className="flex items-center gap-2 w-full animate-fade-in" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="flex-1 min-w-0 bg-slate-100 dark:bg-slate-700 border-none rounded px-2 py-1 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(e as any);
                          if (e.key === 'Escape') cancelEdit(e as any);
                        }}
                      />
                      <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors" title="Save Name">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEdit} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Cancel">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1 flex-1 cursor-text" title={list.query} onClick={(e) => startEditing(list, e)}>
                        {list.query}
                      </h3>
                      <button 
                        onClick={(e) => startEditing(list, e)}
                        className="p-1 text-slate-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Rename List"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6">
                  <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    {list.leadsCount} Leads
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(list.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <div className="mt-auto flex gap-3">
                  <button 
                    onClick={() => onRestore(list)}
                    className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40"
                  >
                    Open List <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(list.id); }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete List"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}