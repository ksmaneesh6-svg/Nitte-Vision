import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Code2, 
  Users2, 
  CheckCircle2, 
  CalendarDays, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User, 
  GraduationCap, 
  Hash, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

const AuthPage = ({ initialTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    full_name: '',
    usn: '',
    email: '',
    password: '',
    branch: 'AIML',
    semester: 5,
    consent_given: true,
  });

  const getAcademicYear = (sem) => {
    const s = parseInt(sem, 10);
    if (s <= 2) return '1st Year';
    if (s <= 4) return '2nd Year';
    if (s <= 6) return '3rd Year';
    return '4th Year';
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      const user = await login(loginForm.email, loginForm.password);
      if (user.role === 'student') navigate('/dashboard');
      else if (user.role === 'faculty') navigate('/faculty');
      else if (user.role === 'admin') navigate('/admin');
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!registerForm.consent_given) {
      setErrorMessage('You must grant consent for facial image collection to proceed');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...registerForm,
        semester: parseInt(registerForm.semester, 10),
      };
      const user = await register(payload);
      navigate('/face-registration');
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#fbfaff]">
      
      {/* LEFT SECTION (50% width on large screens) */}
      <div className="lg:w-1/2 relative bg-gradient-to-br from-nitte-950 via-nitte-900 to-indigo-950 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between overflow-hidden min-h-[460px] lg:min-h-screen">
        {/* Decorative glowing gradient elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-nitte-500/20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"></div>

        {/* Top Header */}
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-extrabold tracking-wider text-base text-white shadow-inner">
              NITTE
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">NitteVision Platform</h2>
              <p className="text-xs text-nitte-200">Nitte Meenakshi Institute of Technology</p>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mt-6">
            Nitte Student <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-nitte-200 via-indigo-200 to-purple-200">
              Learning Platform
            </span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-nitte-200 font-medium">
            Learn • Practice • Collaborate • Grow
          </p>
        </div>

        {/* Five Translucent Feature Cards */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3.5 flex items-center space-x-3 hover:bg-white/15 transition-all">
            <div className="p-2 rounded-lg bg-nitte-600/40 text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Courses & Resources</p>
              <p className="text-xs text-nitte-200">Official syllabus & lecture notes</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3.5 flex items-center space-x-3 hover:bg-white/15 transition-all">
            <div className="p-2 rounded-lg bg-nitte-600/40 text-white">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Coding & Labs</p>
              <p className="text-xs text-nitte-200">Hands-on coding assessments</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3.5 flex items-center space-x-3 hover:bg-white/15 transition-all">
            <div className="p-2 rounded-lg bg-nitte-600/40 text-white">
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Peer Learning</p>
              <p className="text-xs text-nitte-200">Group discussions & project teams</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3.5 flex items-center space-x-3 hover:bg-white/15 transition-all">
            <div className="p-2 rounded-lg bg-nitte-600/40 text-white">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Assignments & Progress</p>
              <p className="text-xs text-nitte-200">Real-time attendance & submission</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3.5 flex items-center space-x-3 hover:bg-white/15 transition-all sm:col-span-2">
            <div className="p-2 rounded-lg bg-nitte-600/40 text-white">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Events & Workshops</p>
              <p className="text-xs text-nitte-200">Campus hackathons, seminars and tech conclaves</p>
            </div>
          </div>
        </div>

        {/* Bottom Sub-footer */}
        <div className="relative z-10 text-xs text-nitte-300 flex items-center justify-between border-t border-white/10 pt-4">
          <span>&copy; {new Date().getFullYear()} NMIT • All rights reserved</span>
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>RetinaFace AI Verified</span>
          </span>
        </div>
      </div>

      {/* RIGHT SECTION (Form) */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md">
          
          <div className="text-left mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome to Nitte Learn
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Your unified learning platform for courses, practice, projects and more.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200/80">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-nitte-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMessage(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-nitte-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register Student
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2.5 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="student@nitte.edu.in"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nitte-500/20 focus:border-nitte-600 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full pl-11 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nitte-500/20 focus:border-nitte-600 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-nitte-800 to-nitte-600 hover:from-nitte-900 hover:to-nitte-700 text-white font-semibold rounded-xl shadow-md shadow-nitte-800/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 cursor-pointer mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span>Sign In</span>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  New student?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-nitte-700 font-semibold hover:underline"
                  >
                    Create your account
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={registerForm.full_name}
                    onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nitte-500/20 focus:border-nitte-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    USN
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="1NT22AI001"
                      value={registerForm.usn}
                      onChange={(e) => setRegisterForm({ ...registerForm, usn: e.target.value.toUpperCase() })}
                      className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nitte-500/20 focus:border-nitte-600 uppercase font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Branch
                  </label>
                  <select
                    value={registerForm.branch}
                    onChange={(e) => setRegisterForm({ ...registerForm, branch: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nitte-500/20 focus:border-nitte-600 font-medium"
                  >
                    <option value="AIML">AIML</option>
                    <option value="CSE">CSE</option>
                    <option value="ISE">ISE</option>
                    <option value="ECE">ECE</option>
                    <option value="ME">ME</option>
                    <option value="CE">CE</option>
                    <option value="EEE">EEE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={registerForm.semester}
                    onChange={(e) => setRegisterForm({ ...registerForm, semester: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nitte-500/20 focus:border-nitte-600 font-medium"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Academic Year
                  </label>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium">
                    {getAcademicYear(registerForm.semester)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="student@nitte.edu.in"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nitte-500/20 focus:border-nitte-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nitte-500/20 focus:border-nitte-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Consent checkbox */}
              <div className="pt-1 flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="consent"
                  checked={registerForm.consent_given}
                  onChange={(e) => setRegisterForm({ ...registerForm, consent_given: e.target.checked })}
                  className="mt-1 rounded text-nitte-600 focus:ring-nitte-500 border-slate-300"
                />
                <label htmlFor="consent" className="text-xs text-slate-600 leading-tight">
                  I consent to the collection and processing of my facial images for campus attendance and dataset research.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-nitte-800 to-nitte-600 hover:from-nitte-900 hover:to-nitte-700 text-white font-semibold rounded-xl shadow-md shadow-nitte-800/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 cursor-pointer mt-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span>Create Account & Register Face</span>
                )}
              </button>

              <div className="text-center pt-1">
                <p className="text-xs text-slate-500">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-nitte-700 font-semibold hover:underline"
                  >
                    Log In instead
                  </button>
                </p>
              </div>
            </form>
          )}

        </div>
      </div>

    </div>
  );
};

export default AuthPage;
