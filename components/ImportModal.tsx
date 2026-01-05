import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, Loader2, Download, Keyboard, Plus, Layers, FileText, Camera, RefreshCw } from 'lucide-react';
import { parseCSV } from '../utils/importCSV';
import { extractLeadFromImage, extractLeadFromVCard } from '../services/geminiService';
import { downloadSampleCSV } from '../utils/sampleCSV';
import { Lead } from '../types';
import toast from 'react-hot-toast';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (leads: Lead[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [mode, setMode] = useState<'upload' | 'manual'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Manual Entry State
  const [manualEntry, setManualEntry] = useState({
    company: '',
    website: '',
    location: '',
    industry: '',
    contactName: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    // Cleanup stream on unmount or close
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      // Wait for render
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error(err);
      toast.error("Unable to access camera. Please allow permissions.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
          stopCamera();
          handleFiles([file]);
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const handleFiles = async (input: FileList | File[] | null) => {
    if (!input) return;
    
    const files = input instanceof FileList ? Array.from(input) : input;
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: files.length });
    
    const allLeads: Lead[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            if (file.name.toLowerCase().endsWith('.csv')) {
                const leads = await parseCSV(file);
                allLeads.push(...leads);
            } else if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name)) {
                const lead = await extractLeadFromImage(file);
                allLeads.push(lead);
                // Rate limit buffer for AI calls
                if (files.length > 1) await new Promise(r => setTimeout(r, 1000));
            } else if (file.name.toLowerCase().endsWith('.vcf') || file.name.toLowerCase().endsWith('.vcard')) {
                const text = await file.text();
                const lead = await extractLeadFromVCard(text);
                allLeads.push(lead);
                if (files.length > 1) await new Promise(r => setTimeout(r, 500));
            } else {
                failCount++;
            }
            successCount++;
        } catch (err) {
            console.error(`Failed to process ${file.name}`, err);
            failCount++;
        }
        
        // Update progress UI
        setProgress({ current: i + 1, total: files.length });
    }

    setIsProcessing(false);
    
    if (allLeads.length > 0) {
        onImport(allLeads);
        toast.success(`Successfully processed ${successCount} items.`);
        if (failCount > 0) toast(`Skipped ${failCount} unsupported or failed files.`);
        onClose();
    } else {
        toast.error("No valid leads found.");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEntry.company) {
      toast.error("Company name is required");
      return;
    }

    const newLead: Lead = {
      id: Date.now(),
      company: manualEntry.company,
      website: manualEntry.website,
      location: manualEntry.location || 'Unknown',
      industry: manualEntry.industry || 'Manual Entry',
      contact: manualEntry.phone || manualEntry.email || 'N/A',
      description: 'Manually added to database',
      confidence: 100,
      employees: 'Unknown',
      status: 'new',
      management: manualEntry.contactName ? [{
        name: manualEntry.contactName,
        role: 'Contact',
        email: manualEntry.email
      }] : [],
      activity: [{
        id: `manual_${Date.now()}`,
        type: 'creation',
        content: 'Lead manually added',
        author: 'User',
        timestamp: new Date().toISOString()
      }]
    };

    onImport([newLead]);
    toast.success(`${manualEntry.company} added successfully`);
    
    // Reset form
    setManualEntry({
      company: '',
      website: '',
      location: '',
      industry: '',
      contactName: '',
      email: '',
      phone: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Import Leads</h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => { setMode('upload'); stopCamera(); }}
            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${mode === 'upload' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Upload className="w-4 h-4" /> Bulk Upload
          </button>
          <button 
            onClick={() => { setMode('manual'); stopCamera(); }}
            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${mode === 'manual' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Keyboard className="w-4 h-4" /> Manual Entry
          </button>
        </div>

        <div className="p-8 overflow-y-auto">
          {mode === 'upload' ? (
            <>
              {isCameraOpen ? (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 flex items-center gap-4">
                    <button 
                      onClick={stopCamera}
                      className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={capturePhoto}
                      className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-transparent hover:bg-white/20 transition-colors"
                    >
                      <div className="w-12 h-12 bg-white rounded-full"></div>
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer relative ${
                    isDragging 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                      : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                >
                  <input 
                    type="file" 
                    multiple
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".csv,.vcf,.vcard,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  
                  {isProcessing ? (
                    <div className="py-4">
                      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-300 font-medium">Processing files...</p>
                      <p className="text-xs text-slate-400 mt-2">{progress.current} of {progress.total} completed</p>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => fileInputRef.current?.click()}>
                      <div className="flex justify-center gap-2 mb-4">
                          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                            <FileSpreadsheet className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                            <Layers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
                            <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                          </div>
                      </div>
                      <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                        Drop Files or Click to Upload
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Supports CSV, vCard, or Business Card Images
                      </p>
                      <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-slate-400 font-mono">
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">.csv</span>
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">.vcf</span>
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">.png</span>
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">.jpg</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Camera Button Overlay */}
                  {!isProcessing && (
                    <div className="absolute top-2 right-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); startCamera(); }}
                        className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold shadow-sm"
                      >
                        <Camera className="w-4 h-4" /> Camera
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-6 flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-semibold mb-1">AI Smart Processing</p>
                  <p>Upload business card images directly. Our AI will automatically extract and structure the contact details.</p>
                </div>
              </div>

              <button 
                onClick={downloadSampleCSV}
                className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" /> Download CSV Template
              </button>
            </>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company *</label>
                  <input 
                    required
                    type="text" 
                    value={manualEntry.company}
                    onChange={e => setManualEntry({...manualEntry, company: e.target.value})}
                    placeholder="Acme Inc."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Website</label>
                  <input 
                    type="text" 
                    value={manualEntry.website}
                    onChange={e => setManualEntry({...manualEntry, website: e.target.value})}
                    placeholder="acme.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                  <input 
                    type="text" 
                    value={manualEntry.location}
                    onChange={e => setManualEntry({...manualEntry, location: e.target.value})}
                    placeholder="City, Country"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Industry</label>
                  <input 
                    type="text" 
                    value={manualEntry.industry}
                    onChange={e => setManualEntry({...manualEntry, industry: e.target.value})}
                    placeholder="e.g. Technology"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 my-2 pt-2">
                <p className="text-xs font-bold text-slate-400 uppercase mb-3">Primary Contact</p>
                <div className="space-y-3">
                  <div>
                    <input 
                      type="text" 
                      value={manualEntry.contactName}
                      onChange={e => setManualEntry({...manualEntry, contactName: e.target.value})}
                      placeholder="Full Name"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="email" 
                      value={manualEntry.email}
                      onChange={e => setManualEntry({...manualEntry, email: e.target.value})}
                      placeholder="Email Address"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                    <input 
                      type="text" 
                      value={manualEntry.phone}
                      onChange={e => setManualEntry({...manualEntry, phone: e.target.value})}
                      placeholder="Phone Number"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" /> Add Lead
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};