
import React, { useState, useEffect } from 'react';
import { Zap, Loader2, ArrowRight, Shield, Facebook, Linkedin, Mail, Users, BarChart3, Workflow } from 'lucide-react';

// Social Icon SVGs
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const LinkedinIcon = () => (
  <svg className="w-5 h-5" fill="#0077B5" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"></path>
  </svg>
);

const FEATURES = [
    {
        icon: Users,
        title: "Discover Your Next Customer",
        description: "Access millions of verified B2B contacts and companies with our real-time, AI-powered search engine."
    },
    {
        icon: Workflow,
        title: "Automate Your Outreach",
        description: "Build multi-step sequences with email, calls, and social touches to engage prospects at scale."
    },
    {
        icon: BarChart3,
        title: "Gain Actionable Insights",
        description: "Analyze market trends, track competitor movements, and identify buying signals before anyone else."
    }
];

interface AuthModalProps {
  onLogin: (email: string) => Promise<void>;
  onShowTerms: () => void;
  onShowPrivacy: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLogin, onShowTerms, onShowPrivacy }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
        setCurrentFeatureIndex(prev => (prev + 1) % FEATURES.length);
    }, 5000); // Change every 5 seconds
    return () => clearInterval(timer);
  }, []);

  const currentFeature = FEATURES[currentFeatureIndex];

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(provider);
    
    // Simulate Backend Oauth Delay
    await new Promise(r => setTimeout(r, 1200));
    
    // Generate mock credential
    const timestamp = Date.now().toString().slice(-4);
    const mockEmail = `user.${provider.toLowerCase()}.${timestamp}@example.com`;
    
    // Pass to parent handler
    await onLogin(mockEmail);
    setIsLoading(null);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading('email');
    await onLogin(email);
    setIsLoading(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop)' }}
      >
        <div className="absolute inset-0 bg-slate-900/80"></div>
      </div>

      <div className="relative z-10 flex w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 h-[650px] max-h-[90vh]">
        
        {/* Left Side: Marketing / Features */}
        <div className="hidden md:flex flex-col w-1/2 p-12 bg-gradient-to-br from-indigo-700 to-purple-900 text-white relative overflow-hidden">
           {/* Abstract shapes */}
           <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
           <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
           
           <div className="relative z-10">
             <div className="flex items-center gap-3 mb-8">
               <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/20">
                 <Zap className="w-6 h-6 text-white" />
               </div>
               <span className="text-xl font-bold tracking-tight text-white">Netolyte</span>
             </div>
             
             <h1 className="text-4xl font-bold leading-tight mb-6">
               Turn Public Data <span className="text-indigo-200">into Revenue</span>
             </h1>
           </div>

           {/* Rotating Feature */}
           <div className="relative z-10 mt-auto" key={currentFeatureIndex}>
              <div className="p-3 bg-white/10 rounded-lg inline-block mb-4 animate-in fade-in zoom-in-50 duration-500 border border-white/10">
                  <currentFeature.icon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">{currentFeature.title}</h2>
              <p className="text-indigo-200 opacity-80 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">{currentFeature.description}</p>
           </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl flex flex-col justify-center relative">
          
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              Sign in to access your dashboard.
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleSocialLogin('Google')}
                disabled={!!isLoading}
                className="w-full py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl text-slate-700 dark:text-white font-medium transition-all flex items-center justify-center gap-3 relative shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-wait"
              >
                {isLoading === 'Google' ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
                <span>Continue with Google</span>
              </button>
              
              <button
                  onClick={() => handleSocialLogin('LinkedIn')}
                  disabled={!!isLoading}
                  className="w-full py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl text-slate-700 dark:text-white font-medium transition-all flex items-center justify-center gap-3 relative shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-wait"
                >
                  {isLoading === 'LinkedIn' ? <Loader2 className="w-5 h-5 animate-spin" /> : <LinkedinIcon />}
                  <span>Continue with LinkedIn</span>
                </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase font-medium tracking-wide">
                <span className="bg-white/0 backdrop-blur-sm px-3 text-slate-400">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:text-slate-400"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={!!isLoading}
                className="w-full py-3 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
              >
                {isLoading === 'email' ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
            
            <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
                By continuing, you agree to our <br />
                <a href="#" onClick={(e) => { e.preventDefault(); onShowTerms(); }} className="underline hover:text-indigo-500 font-medium">Terms of Service</a> & <a href="#" onClick={(e) => { e.preventDefault(); onShowPrivacy(); }} className="underline hover:text-indigo-500 font-medium">Privacy Policy</a>.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
