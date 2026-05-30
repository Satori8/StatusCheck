import AuthPortal from '@/components/auth/AuthPortal';
import { Pulse, Clock, ShieldCheck } from '@phosphor-icons/react/dist/ssr';

export default function Home() {
  return (
    <div className="min-h-[100dvh] w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 px-6 py-16 items-center">
      {/* Left Column Description */}
      <div className="lg:col-span-7 flex flex-col justify-center items-start space-y-8 pr-0 lg:pr-12">
        <div className="inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full border border-[#143c90]/20 text-[#60a5fa] bg-[#143c90]/5">
          Release 1.0.0
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-white font-sans">
          Commitment <br />
          <span className="text-gradient">tracking</span> without <br />
          unnecessary slop
        </h1>
        
        <p className="text-base text-[#64748b] max-w-md leading-relaxed">
          Precision accountability designed strictly for modern high-performance teams. Coordinate calendar deadlines, verify task completions, and eliminate project uncertainty.
        </p>
        
        {/* Features list */}
        <div className="space-y-4 w-full pt-4">
          <div className="flex items-center space-x-4 text-[#f1f5f9]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-inner">
              <Pulse size={18} weight="bold" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-[#64748b]">Monitoring</p>
              <p className="text-sm font-semibold text-[#f1f5f9]">Real-time status updates</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-[#f1f5f9]">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-inner">
              <Clock size={18} weight="bold" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-[#64748b]">Automation</p>
              <p className="text-sm font-semibold text-[#f1f5f9]">Automatic expiry & deadline warnings</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-[#f1f5f9]">
            <div className="w-10 h-10 rounded-xl bg-[#143c90]/10 border border-[#143c90]/20 flex items-center justify-center text-[#60a5fa] flex-shrink-0 shadow-inner">
              <ShieldCheck size={18} weight="bold" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-[#64748b]">Security</p>
              <p className="text-sm font-semibold text-[#f1f5f9]">Role-based team authorization</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column AuthPortal */}
      <div className="lg:col-span-5 flex flex-col justify-center items-center w-full">
        {/* Doppelrand Double-Bezel Nested Shell */}
        <div className="w-full p-2 bg-[#161726]/40 border border-[#24263b] rounded-[2rem] shadow-2xl">
          <div className="bg-[#11121d] border border-[#24263b]/50 p-6 md:p-8 rounded-[calc(2rem-8px)]">
            <div className="text-center mb-6">
              <h2 className="text-base font-bold text-white uppercase tracking-widest mb-1.5">Get Started</h2>
              <p className="text-xs text-[#64748b]">Access your secure team workspace portal</p>
            </div>
            <AuthPortal />
          </div>
        </div>
      </div>
    </div>
  );
}
