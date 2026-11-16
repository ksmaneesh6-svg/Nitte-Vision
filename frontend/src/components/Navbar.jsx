import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Camera, 
  Database, 
  LayoutDashboard, 
  LogOut, 
  User, 
  GraduationCap, 
  ShieldCheck, 
  Users, 
  ChevronDown 
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isStudent = user.role === 'student';
  const isFaculty = user.role === 'faculty';
  const isAdmin = user.role === 'admin';

  const student = user.student;
  const faculty = user.faculty;

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-nitte-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-nitte-900 via-nitte-800 to-nitte-600 flex items-center justify-center text-white shadow-md shadow-nitte-900/20 group-hover:scale-105 transition-transform">
                <span className="font-extrabold text-sm tracking-wider">NITTE</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-900 tracking-tight text-lg">NitteVision</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-nitte-100 text-nitte-800">
                    Platform
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">Student Learning & Face Platform</span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center ml-6 space-x-1">
              {isStudent && (
                <>
                  <Link
                    to="/dashboard"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/dashboard')
                        ? 'bg-nitte-50 text-nitte-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/face-registration"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/face-registration')
                        ? 'bg-nitte-50 text-nitte-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Face Registration</span>
                  </Link>
                  <Link
                    to="/my-dataset"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/my-dataset')
                        ? 'bg-nitte-50 text-nitte-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Database className="w-4 h-4" />
                    <span>My Dataset</span>
                  </Link>
                </>
              )}

              {isFaculty && (
                <Link
                  to="/faculty"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/faculty')
                      ? 'bg-nitte-50 text-nitte-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Faculty Dashboard</span>
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/admin')
                      ? 'bg-nitte-50 text-nitte-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Console</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Right Section: User Profile & Actions */}
          <div className="flex items-center space-x-3">
            {/* User Meta Info Badge */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-800">
                {student?.full_name || faculty?.full_name || 'Administrator'}
              </span>
              <span className="text-xs text-slate-500">
                {isStudent && `${student?.branch} • ${student?.academic_year}`}
                {isFaculty && `${faculty?.department} • Faculty`}
                {isAdmin && 'System Superuser'}
              </span>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
              >
                <div className="w-9 h-9 rounded-full bg-nitte-100 border border-nitte-200 text-nitte-700 flex items-center justify-center font-bold text-sm">
                  {student?.full_name ? student.full_name[0] : (faculty?.full_name ? faculty.full_name[0] : 'A')}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {dropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed in as</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
                    {student && (
                      <p className="text-xs text-nitte-600 font-mono mt-0.5">USN: {student.usn}</p>
                    )}
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center space-x-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
