import AuthPortal from '@/components/auth/AuthPortal';
import { Activity, Clock, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-[100dvh] w-full grid grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-center items-start p-8 md:p-16 lg:p-24">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-none mb-8">
          Commitment<br />
          <span className="text-gradient">Tracking</span><br />
          Without Slop
        </h1>
        <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-md leading-relaxed">
          Precision accountability for modern teams. Coordinate deadlines, verify completions, and eliminate uncertainty.
        </p>
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-slate-300">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-medium">Real-time status monitoring</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-300">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <span className="font-medium">Automatic expiry detection</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-300">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-medium">Role-based access control</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center p-8 md:p-16 lg:p-24 bg-gradient-to-br from-transparent to-gray-900/10">
        <AuthPortal />
      </div>
    </div>
  );
}