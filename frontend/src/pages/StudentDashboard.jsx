import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Camera, 
  Database, 
  CalendarCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

const StudentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await api.get('/students/dashboard-stats');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load student dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-28 bg-slate-200/70 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-40 bg-slate-200/70 rounded-2xl"></div>
            <div className="h-40 bg-slate-200/70 rounded-2xl"></div>
            <div className="h-40 bg-slate-200/70 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const isFaceRegistered = stats?.face_registration_status === 'COMPLETED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner / Welcome card */}
      <div className="bg-gradient-to-r from-nitte-950 via-nitte-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-nitte-950/10">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-nitte-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-nitte-200 mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>NMIT Student Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {stats?.full_name}!
            </h1>
            <p className="text-sm text-nitte-200 mt-1">
              USN: <span className="font-mono text-white font-semibold">{stats?.usn}</span> • {stats?.branch} • Semester {stats?.semester} ({stats?.academic_year})
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {!isFaceRegistered ? (
              <Link
                to="/face-registration"
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all hover:scale-105"
              >
                <Camera className="w-4 h-4" />
                <span>Complete Face Registration</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            ) : (
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Face Dataset Verified (30 Img)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Face Registration Status */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Face Dataset Status</span>
              <div className={`p-2 rounded-xl ${isFaceRegistered ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {isFaceRegistered ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-3">
              {isFaceRegistered ? 'Dataset Registered' : 'Registration Pending'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isFaceRegistered 
                ? '5 original orientations + 25 OpenCV augmentations verified in SQL database.' 
                : 'Please complete your 5-orientation face capture with RetinaFace.'}
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Total Images</span>
            <span className="text-sm font-extrabold text-nitte-700">
              {stats?.total_dataset_images} / 30
            </span>
          </div>
        </div>

        {/* Card 2: Attendance Percentage */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Classroom Attendance</span>
              <div className="p-2 rounded-xl bg-nitte-50 text-nitte-600">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2 mt-3">
              <h3 className="text-3xl font-extrabold text-slate-900">
                {stats?.attendance_percentage}%
              </h3>
              <span className="text-xs font-medium text-slate-500">
                ({stats?.present_classes} of {stats?.total_classes} sessions)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full mt-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  (stats?.attendance_percentage || 0) >= 75 
                    ? 'bg-emerald-500' 
                    : (stats?.attendance_percentage || 0) >= 60 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, stats?.attendance_percentage || 0)}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Eligibility Threshold</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              (stats?.attendance_percentage || 0) >= 75 || stats?.total_classes === 0
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {(stats?.attendance_percentage || 0) >= 75 || stats?.total_classes === 0 ? 'Eligible (>=75%)' : 'Shortage (<75%)'}
            </span>
          </div>
        </div>

        {/* Card 3: Quick Navigation */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Actions</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Database className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-3">Explore Your Dataset</h3>
            <p className="text-xs text-slate-500 mt-1">
              Inspect your stored facial crops, review 5 augmentations, or retake if necessary.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/my-dataset"
              className="text-xs font-bold text-nitte-700 hover:text-nitte-900 flex items-center space-x-1"
            >
              <span>View Image Gallery</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-nitte-600" />
          <span>Recent Platform Activity</span>
        </h2>

        {stats?.recent_activity && stats.recent_activity.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {stats.recent_activity.map((item, idx) => (
              <div key={idx} className="py-3.5 flex items-start space-x-3">
                <div className="mt-0.5 p-1.5 rounded-full bg-nitte-50 text-nitte-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <UserCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No recent activities recorded yet.</p>
            <p className="text-xs text-slate-400">Capture your face dataset or attend a session to see activity logs.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default StudentDashboard;
