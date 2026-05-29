import AuthPortal from '@/components/auth/AuthPortal';
import { Activity, Clock, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-[100dvh] w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 px-6 py-12 items-center">
      <div className="lg:col-span-7 flex flex-col justify-center items-start space-y-8 pr-0 lg:pr-12">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-none">
          Commitment<br />
          <span className="text-gradient">Tracking</span><br />
          Without Slop
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-md leading-relaxed">
          Precision accountability for modern teams. Coordinate deadlines, verify completions, and eliminate uncertainty.
        </p>
        <div className="space-y-4 w-full">
          <div className="flex items-center space-x-4 text-slate-300">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-medium">Real-time status monitoring</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-300">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <span className="font-medium">Automatic expiry detection</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-300">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-medium">Role-based access control</span>
          </div>
        </div>
      </div>
      <div className="lg:col-span-5 flex flex-col justify-center items-center w-full">
        <AuthPortal />
      </div>
    </div>
  );
}