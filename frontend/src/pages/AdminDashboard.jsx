import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  ShieldCheck, 
  Users, 
  Database, 
  GraduationCap, 
  CalendarCheck, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Layers,
  ChevronRight
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'students', 'datasets', 'faculty'
  const [students, setStudents] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  // Add faculty modal
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [facultyForm, setFacultyForm] = useState({
    full_name: '',
    email: '',
    password: '',
    department: 'AIML'
  });
  const [facultyMsg, setFacultyMsg] = useState('');

  useEffect(() => {
    fetchAllData();
  }, [selectedBranch, selectedSemester, searchQuery]);

  const fetchAllData = async () => {
    try {
      const [statsRes, studentsRes, datasetsRes, facultyRes] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/admin/students', {
          params: {
            search: searchQuery || undefined,
            branch: selectedBranch || undefined,
            semester: selectedSemester || undefined
          }
        }),
        api.get('/admin/datasets'),
        api.get('/admin/faculty')
      ]);

      setStats(statsRes.data);
      setStudents(studentsRes.data);
      setDatasets(datasetsRes.data);
      setFacultyList(facultyRes.data);
    } catch (err) {
      console.error("Failed to load admin console data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    setFacultyMsg('');
    try {
      await api.post('/admin/faculty', facultyForm);
      setFacultyMsg('Faculty created successfully!');
      setFacultyForm({ full_name: '', email: '', password: '', department: 'AIML' });
      fetchAllData();
      setTimeout(() => {
        setShowAddFacultyModal(false);
        setFacultyMsg('');
      }, 1500);
    } catch (err) {
      setFacultyMsg(err.response?.data?.detail || 'Failed to create faculty');
    }
  };

  const handleExportAuditCSV = () => {
    window.open('/api/v1/admin/export-audit-csv', '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-slate-200/70 rounded-2xl"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-200/70 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-nitte-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white relative shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-nitte-500/20 text-nitte-300 text-xs font-semibold mb-2 border border-nitte-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Institutional Administration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              NitteVision Admin Console
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Centralized platform metrics, face dataset registrations, and audit controls.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportAuditCSV}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 flex items-center space-x-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Audit CSV</span>
            </button>
            <button
              onClick={() => setShowAddFacultyModal(true)}
              className="px-4 py-2.5 bg-nitte-600 hover:bg-nitte-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Faculty</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Key Platform KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Students</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats?.total_students}</span>
          <span className="text-[10px] text-slate-400 font-medium">Registered</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Faculty Members</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats?.total_faculty}</span>
          <span className="text-[10px] text-slate-400 font-medium">Teaching Staff</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Datasets Completed</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats?.registered_face_datasets}</span>
          <span className="text-[10px] text-emerald-600 font-medium">Verified (30 Img)</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">Pending Datasets</span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">{stats?.pending_face_registrations}</span>
          <span className="text-[10px] text-amber-600 font-medium">Action Required</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Attendance Records</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats?.total_attendance_records}</span>
          <span className="text-[10px] text-slate-400 font-medium">Logged Days</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nitte-600 block">Avg Attendance</span>
          <span className="text-2xl font-black text-nitte-700 mt-1 block">{stats?.average_attendance}%</span>
          <span className="text-[10px] text-slate-400 font-medium">Across Classes</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex border-b border-slate-100 pb-3 space-x-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-nitte-700 text-nitte-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Branch Overview
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`pb-2 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'students'
                ? 'border-nitte-700 text-nitte-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Student Directory ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('datasets')}
            className={`pb-2 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'datasets'
                ? 'border-nitte-700 text-nitte-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Face Datasets Audit ({datasets.length})
          </button>
          <button
            onClick={() => setActiveTab('faculty')}
            className={`pb-2 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'faculty'
                ? 'border-nitte-700 text-nitte-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Faculty Accounts ({facultyList.length})
          </button>
        </div>

        {/* TAB 1: Branch Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
              Departmental Student Distribution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {stats?.branch_distribution && Object.entries(stats.branch_distribution).map(([b, count]) => (
                <div key={b} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">
                  <span className="block text-xs font-bold text-nitte-700">{b}</span>
                  <span className="block text-xl font-extrabold text-slate-900 mt-1">{count}</span>
                  <span className="text-[10px] text-slate-400">Students</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Students List */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or USN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-nitte-500/20 focus:border-nitte-600"
                />
              </div>

              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              >
                <option value="">All Branches</option>
                <option value="AIML">AIML</option>
                <option value="CSE">CSE</option>
                <option value="ISE">ISE</option>
                <option value="ECE">ECE</option>
                <option value="ME">ME</option>
                <option value="CE">CE</option>
                <option value="EEE">EEE</option>
              </select>

              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">USN</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Branch / Sem</th>
                    <th className="py-3 px-4">Face Dataset</th>
                    <th className="py-3 px-4 text-center">Images Stored</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => (
                    <tr key={s.student_id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-nitte-800">{s.usn}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{s.full_name}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{s.email}</td>
                      <td className="py-3 px-4 text-slate-600">{s.branch} - Sem {s.semester}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.dataset_status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {s.dataset_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {s.total_images} / 30
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Datasets Audit */}
        {activeTab === 'datasets' && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Session ID</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Originals</th>
                    <th className="py-3 px-4">Augmented</th>
                    <th className="py-3 px-4">Total SQL LONGBLOB</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Completed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {datasets.map((d) => (
                    <tr key={d.session_id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-slate-400">#{d.session_id}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {d.student_name} <span className="text-slate-400 font-mono text-[10px]">({d.usn})</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{d.branch} - Sem {d.semester}</td>
                      <td className="py-3 px-4 font-bold text-nitte-700">{d.total_original_images} / 5</td>
                      <td className="py-3 px-4 font-bold text-purple-700">{d.total_augmented_images} / 25</td>
                      <td className="py-3 px-4 font-black text-emerald-700">{d.total_images} Images</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {d.capture_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {d.completed_at ? new Date(d.completed_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Faculty Accounts */}
        {activeTab === 'faculty' && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Faculty ID</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {facultyList.map((f) => (
                    <tr key={f.faculty_id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-slate-400">#{f.faculty_id}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{f.full_name}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{f.email}</td>
                      <td className="py-3 px-4 text-nitte-700 font-semibold">{f.department}</td>
                      <td className="py-3 px-4 text-slate-400">{new Date(f.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ADD FACULTY MODAL */}
      {showAddFacultyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add New Faculty Member</h3>
              <button onClick={() => setShowAddFacultyModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            {facultyMsg && (
              <div className="p-2.5 bg-nitte-50 text-nitte-800 text-xs rounded-xl font-semibold">
                {facultyMsg}
              </div>
            )}

            <form onSubmit={handleCreateFaculty} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold uppercase text-slate-500 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Prof. Ananya Rao"
                  value={facultyForm.full_name}
                  onChange={(e) => setFacultyForm({ ...facultyForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-500 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="ananya@nitte.edu.in"
                  value={facultyForm.email}
                  onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-500 mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={facultyForm.password}
                  onChange={(e) => setFacultyForm({ ...facultyForm, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-500 mb-1">Department</label>
                <select
                  value={facultyForm.department}
                  onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
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

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddFacultyModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-nitte-700 hover:bg-nitte-800 text-white rounded-xl font-bold shadow-md"
                >
                  Create Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
