import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  UserPlus, 
  LogIn, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Hash,
  CheckCircle2,
  Info
} from 'lucide-react';

const INSTITUTIONS = [
  { id: 'NMIT', name: 'NMIT', fullName: 'Nitte Meenakshi Institute of Technology' },
  { id: 'NCOPS', name: 'NCOPS', fullName: 'Nitte College of Pharmaceutical Sciences' },
  { id: 'NSOA', name: 'NSOA', fullName: 'Nitte School of Architecture' },
  { id: 'NSOM', name: 'NSOM', fullName: 'Nitte School of Management' },
];

const AuthPage = ({ initialTab = 'register' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [ssoNotice, setSsoNotice] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState('NMIT');

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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSsoNotice('');
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
    setSsoNotice('');

    if (selectedInstitution !== 'NMIT') {
      setErrorMessage(`${selectedInstitution} portal integration will open in Phase 2. Please register under NMIT for NitteVision.`);
      return;
    }

    if (!registerForm.usn.trim()) {
      setErrorMessage('USN (University Seat Number) is required for NMIT student registration.');
      return;
    }

    if (!registerForm.consent_given) {
      setErrorMessage('Consent for facial image capture and verification is required to proceed.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...registerForm,
        semester: parseInt(registerForm.semester, 10),
      };
      await register(payload);
      navigate('/face-registration');
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleSsoClick = (provider) => {
    setSsoNotice(
      `${provider} Single Sign-On (SSO) is managed by Nitte IT Services and will be activated upon campus domain rollout. Please use your email & password credentials above.`
    );
    setTimeout(() => setSsoNotice(''), 7000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#fdfdff] overflow-x-hidden font-sans select-none">
      
      {/* ======================================================== */}
      {/* 1. LEFT PANEL (Approx 51% width) — EXACT REFERENCE IMAGE */}
      {/* ======================================================== */}
      <div className="w-full lg:w-[51%] relative min-h-[460px] lg:h-screen lg:min-h-0 bg-slate-900 overflow-hidden flex flex-col justify-end">
        {/* Exact campus photograph from the reference image */}
        <img
          src="/nitte-campus-left-2x.jpg"
          alt="Nitte Campus Learning Platform"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Subtle hoverable overlay over the 5 cards for interactive polish */}
        <div className="relative z-10 w-full px-4 pb-6 pt-2 pointer-events-auto">
          <div className="grid grid-cols-5 gap-2 max-w-xl mx-auto opacity-0 hover:opacity-100 transition-opacity duration-300">
            {['Courses & Resources', 'Coding & Labs', 'Peer Learning', 'Assignments & Progress', 'Events & Workshops'].map((cardName, idx) => (
              <div 
                key={idx} 
                className="h-16 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-center p-1 cursor-default"
                title={cardName}
              >
                <span className="text-[10px] text-white/90 font-medium leading-tight">
                  {cardName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. RIGHT PANEL (Approx 49% width) — EXACT REFERENCE DESIGN */}
      {/* ======================================================== */}
      <div className="w-full lg:w-[49%] relative min-h-screen lg:h-screen lg:overflow-y-auto bg-[#fdfdff] flex flex-col justify-between p-6 sm:p-10 lg:p-8 xl:p-12">
        
        {/* Top-Right Decorative Lavender Curve */}
        <div className="absolute top-0 right-0 w-52 sm:w-64 h-48 sm:h-56 pointer-events-none z-0 overflow-hidden">
          <svg viewBox="0 0 200 200" className="w-full h-full text-[#dcd8f8] fill-current">
            <path d="M0,0 L200,0 L200,200 C150,160 120,130 90,80 C60,30 30,10 0,0 Z" opacity="0.85" />
          </svg>
        </div>

        {/* Bottom-Right Decorative Lavender Curve */}
        <div className="absolute bottom-0 right-0 w-44 sm:w-56 h-40 sm:h-48 pointer-events-none z-0 overflow-hidden">
          <svg viewBox="0 0 200 200" className="w-full h-full text-[#dcd8f8] fill-current">
            <path d="M200,200 L0,200 C40,170 80,150 120,110 C160,70 180,40 200,0 Z" opacity="0.85" />
          </svg>
        </div>

        {/* Main Form Container */}
        <div className="relative z-10 w-full max-w-[460px] mx-auto my-auto py-2">
          
          {/* Header with Graduation Cap Icon & Title */}
          <div className="flex items-center space-x-3.5 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-[#ece8ff] border border-[#ded8fc] flex items-center justify-center flex-shrink-0 shadow-xs">
              <GraduationCap className="w-7 h-7 text-[#4537a9]" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#0f172a] tracking-tight leading-tight">
                Welcome to <span className="text-[#4537a9]">Nitte Learn</span>
              </h1>
              <p className="text-xs text-[#64748b] mt-0.5 leading-snug">
                Your unified learning platform for courses, practice, projects and more.
              </p>
            </div>
          </div>

          {/* Segmented Horizontal Navigation Bar */}
          <div className="flex items-center bg-[#f1eff9] p-1 rounded-xl border border-[#e4e1f3] mb-5">
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMessage(''); setSsoNotice(''); }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-[#4537a9] text-white shadow-sm'
                  : 'text-[#475569] hover:text-[#0f172a]'
              }`}
            >
              <UserPlus className="w-4 h-4" strokeWidth={2.2} />
              <span>Register</span>
              <span className="font-normal opacity-90 text-[11px]">(Create Account)</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMessage(''); setSsoNotice(''); }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-[#4537a9] text-white shadow-sm'
                  : 'text-[#475569] hover:text-[#0f172a]'
              }`}
            >
              <LogIn className="w-4 h-4" strokeWidth={2.2} />
              <span>Login</span>
              <span className="font-normal opacity-90 text-[11px]">(Existing User)</span>
            </button>
          </div>

          {/* Form Subheading */}
          <h2 className="text-sm font-bold text-[#0f172a] mb-3">
            {activeTab === 'register' ? 'Create your account' : 'Sign in to your account'}
          </h2>

          {/* Error Alert Box */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SSO Notice Toast */}
          {ssoNotice && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start space-x-2 text-[#4537a9] text-xs">
              <Info className="w-4 h-4 text-[#4537a9] flex-shrink-0 mt-0.5" />
              <span>{ssoNotice}</span>
            </div>
          )}

          {/* ================= REGISTER FORM ================= */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-[#1e293b] mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl border border-[#cbd5e1] bg-white shadow-2xs focus-within:border-[#4537a9] focus-within:ring-2 focus-within:ring-[#4537a9]/15 transition-all">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={registerForm.full_name}
                    onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs text-[#0f172a] placeholder-[#94a3b8] bg-transparent outline-none rounded-xl"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-bold text-[#1e293b] mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl border border-[#cbd5e1] bg-white shadow-2xs focus-within:border-[#4537a9] focus-within:ring-2 focus-within:ring-[#4537a9]/15 transition-all">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your institutional or personal email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs text-[#0f172a] placeholder-[#94a3b8] bg-transparent outline-none rounded-xl"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-[#1e293b] mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl border border-[#cbd5e1] bg-white shadow-2xs focus-within:border-[#4537a9] focus-within:ring-2 focus-within:ring-[#4537a9]/15 transition-all">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Create a strong password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="w-full pl-9 pr-9 py-2 text-xs text-[#0f172a] placeholder-[#94a3b8] bg-transparent outline-none rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569] p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Institution * Selector */}
              <div>
                <label className="block text-[11px] font-bold text-[#1e293b] mb-1.5">
                  Institution <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {INSTITUTIONS.map((inst) => {
                    const isSelected = selectedInstitution === inst.id;
                    return (
                      <div
                        key={inst.id}
                        onClick={() => setSelectedInstitution(inst.id)}
                        className={`rounded-xl p-2 border cursor-pointer transition-all flex flex-col items-center justify-start text-center ${
                          isSelected
                            ? 'bg-[#f0edff] border-[#4537a9] shadow-xs'
                            : 'bg-white border-[#cbd5e1] hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-1 mb-1">
                          {/* Radio Circle */}
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-[#4537a9] bg-white'
                                : 'border-[#94a3b8] bg-white'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-[#4537a9]"></div>}
                          </div>
                          <span
                            className={`text-[11px] font-black ${
                              isSelected ? 'text-[#4537a9]' : 'text-[#1e293b]'
                            }`}
                          >
                            {inst.name}
                          </span>
                        </div>
                        <span className="text-[8.5px] text-[#64748b] leading-tight line-clamp-2">
                          {inst.fullName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preserved NMIT Student Academic Requirements (USN, Branch, Semester, Consent) */}
              {selectedInstitution === 'NMIT' && (
                <div className="bg-[#f8f7fe] rounded-xl p-2.5 border border-[#e4e1f3] space-y-2 mt-1">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#475569] mb-0.5">
                        USN *
                      </label>
                      <div className="relative">
                        <Hash className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                        <input
                          type="text"
                          required
                          placeholder="1NT22AI001"
                          value={registerForm.usn}
                          onChange={(e) => setRegisterForm({ ...registerForm, usn: e.target.value.toUpperCase() })}
                          className="w-full pl-6 pr-1.5 py-1 text-[11px] font-mono font-bold bg-white border border-[#cbd5e1] rounded-lg uppercase outline-none focus:border-[#4537a9]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#475569] mb-0.5">
                        Branch
                      </label>
                      <select
                        value={registerForm.branch}
                        onChange={(e) => setRegisterForm({ ...registerForm, branch: e.target.value })}
                        className="w-full px-1.5 py-1 text-[11px] font-bold bg-white border border-[#cbd5e1] rounded-lg outline-none focus:border-[#4537a9]"
                      >
                        {['AIML', 'CSE', 'ISE', 'ECE', 'ME', 'CE', 'EEE'].map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#475569] mb-0.5">
                        Semester
                      </label>
                      <select
                        value={registerForm.semester}
                        onChange={(e) => setRegisterForm({ ...registerForm, semester: e.target.value })}
                        className="w-full px-1.5 py-1 text-[11px] font-bold bg-white border border-[#cbd5e1] rounded-lg outline-none focus:border-[#4537a9]"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>Sem {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 pt-0.5">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={registerForm.consent_given}
                      onChange={(e) => setRegisterForm({ ...registerForm, consent_given: e.target.checked })}
                      className="rounded text-[#4537a9] focus:ring-[#4537a9] border-slate-300 w-3.5 h-3.5"
                    />
                    <label htmlFor="consent" className="text-[10px] text-[#475569] leading-tight">
                      I consent to biometric face registration for AI-based classroom attendance.
                    </label>
                  </div>
                </div>
              )}

              {/* Large Purple Register / Sign Up Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#4537a9] hover:bg-[#392c94] text-white text-xs font-bold rounded-xl shadow-md shadow-[#4537a9]/20 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-70 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" strokeWidth={2.2} />
                    <span>Register / Sign Up</span>
                  </>
                )}
              </button>

              {/* "or continue with" Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="w-full border-t border-[#e2e8f0]"></div>
                <span className="absolute bg-[#fdfdff] px-2.5 text-[10.5px] text-[#94a3b8] font-medium">
                  or continue with
                </span>
              </div>

              {/* Google and Microsoft Sign-Up Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSsoClick('Google')}
                  className="py-2 px-3 bg-white border border-[#cbd5e1] hover:bg-slate-50 text-[#334155] rounded-xl text-[11px] font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-2xs"
                >
                  {/* Google 'G' official SVG */}
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign up with Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSsoClick('Microsoft')}
                  className="py-2 px-3 bg-white border border-[#cbd5e1] hover:bg-slate-50 text-[#334155] rounded-xl text-[11px] font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-2xs"
                >
                  {/* Microsoft 4-Square official SVG */}
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 21 21">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                  </svg>
                  <span>Sign up with Microsoft</span>
                </button>
              </div>

              {/* Already have an account? Login / Sign In */}
              <div className="text-center pt-1.5">
                <span className="text-[11px] text-[#64748b]">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('login'); setErrorMessage(''); setSsoNotice(''); }}
                    className="text-[#4537a9] font-bold hover:underline cursor-pointer"
                  >
                    Login / Sign In
                  </button>
                </span>
              </div>

            </form>
          )}

          {/* ================= LOGIN FORM ================= */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              
              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-bold text-[#1e293b] mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl border border-[#cbd5e1] bg-white shadow-2xs focus-within:border-[#4537a9] focus-within:ring-2 focus-within:ring-[#4537a9]/15 transition-all">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your institutional or personal email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs text-[#0f172a] placeholder-[#94a3b8] bg-transparent outline-none rounded-xl"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-[#1e293b] mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl border border-[#cbd5e1] bg-white shadow-2xs focus-within:border-[#4537a9] focus-within:ring-2 focus-within:ring-[#4537a9]/15 transition-all">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 text-xs text-[#0f172a] placeholder-[#94a3b8] bg-transparent outline-none rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569] p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Hint Notice */}
              <div className="bg-[#f8f7fe] rounded-xl p-2.5 border border-[#e4e1f3] text-[10.5px] text-[#64748b]">
                <span className="font-semibold text-[#4537a9]">Institutional Single Login:</span> Students, Faculty members, and System Administrators sign in here with their respective accounts.
              </div>

              {/* Large Purple Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#4537a9] hover:bg-[#392c94] text-white text-xs font-bold rounded-xl shadow-md shadow-[#4537a9]/20 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-70 mt-3"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" strokeWidth={2.2} />
                    <span>Login / Sign In</span>
                  </>
                )}
              </button>

              {/* "or continue with" Divider */}
              <div className="relative flex items-center justify-center my-3.5">
                <div className="w-full border-t border-[#e2e8f0]"></div>
                <span className="absolute bg-[#fdfdff] px-2.5 text-[10.5px] text-[#94a3b8] font-medium">
                  or continue with
                </span>
              </div>

              {/* Google and Microsoft Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSsoClick('Google')}
                  className="py-2 px-3 bg-white border border-[#cbd5e1] hover:bg-slate-50 text-[#334155] rounded-xl text-[11px] font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSsoClick('Microsoft')}
                  className="py-2 px-3 bg-white border border-[#cbd5e1] hover:bg-slate-50 text-[#334155] rounded-xl text-[11px] font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 21 21">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                  </svg>
                  <span>Sign in with Microsoft</span>
                </button>
              </div>

              {/* Don't have an account? Register */}
              <div className="text-center pt-1.5">
                <span className="text-[11px] text-[#64748b]">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('register'); setErrorMessage(''); setSsoNotice(''); }}
                    className="text-[#4537a9] font-bold hover:underline cursor-pointer"
                  >
                    Register / Sign Up
                  </button>
                </span>
              </div>

            </form>
          )}

        </div>

        {/* Bottom subtle copyright notice */}
        <div className="relative z-10 text-center pt-2">
          <p className="text-[10px] text-[#94a3b8]">
            &copy; {new Date().getFullYear()} Nitte (Deemed to be University) • NMIT Campus
          </p>
        </div>

      </div>

    </div>
  );
};

export default AuthPage;
