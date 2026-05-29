import AuthPortal from '@/components/auth/AuthPortal';

export default function Home() {
  return (
    <div className="min-h-[100dvh] w-full grid grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-center items-start p-8 md:p-16 lg:p-24">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-none mb-8">
          Commitment<br />
          <span className="text-gradient">Tracking</span><br />
          Without Slop
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-md">
          Precision accountability for modern managers. Track deadlines, enforce commitments, eliminate excuses.
        </p>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            <span className="text-gray-300">Real-time status monitoring</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-amber-500 rounded-full" />
            <span className="text-gray-300">Automatic expiry detection</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-gray-300">Role-based access control</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center p-8 md:p-16 lg:p-24 bg-gradient-to-br from-transparent to-gray-900/20">
        <AuthPortal />
      </div>
    </div>
  );
}