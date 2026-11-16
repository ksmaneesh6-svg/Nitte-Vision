import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  CalendarCheck, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Save, 
  Search, 
  AlertCircle 
} from 'lucide-react';

const FacultyDashboard = () => {
  const [stats, setStats] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classData, setClassData] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMarks, setAttendanceMarks] = useState({}); // { student_id: 'present' | 'absent' }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [statsRes, classesRes] = await Promise.all([
          api.get('/faculty/dashboard-stats'),
          api.get('/faculty/classes')
        ]);
        setStats(statsRes.data);
        setClasses(classesRes.data);
        if (classesRes.data.length > 0) {
          setSelectedClassId(classesRes.data[0].class_id);
        }
      } catch (err) {
        console.error("Failed to load faculty initial data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    const fetchClassStudents = async () => {
      try {
        const res = await api.get(`/faculty/classes/${selectedClassId}/students`);
        setClassData(res.data);
        // Default marks to present
        const defaultMarks = {};
        res.data.students.forEach((s) => {
          defaultMarks[s.student_id] = 'present';
        });
        setAttendanceMarks(defaultMarks);
      } catch (err) {
        console.error("Failed to load class students", err);
      }
    };
    fetchClassStudents();
  }, [selectedClassId]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceMarks((prev) => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const records = Object.keys(attendanceMarks).map((sId) => ({
        student_id: parseInt(sId, 10),
        status: attendanceMarks[sId]
      }));

      await api.post('/faculty/attendance/mark', {
        class_id: parseInt(selectedClassId, 10),
        attendance_date: attendanceDate,
        records
      });

      setSaveMessage('Attendance saved successfully!');
      setTimeout(() => setSaveMessage(''), 4000);

      // Refresh class data
      const refreshRes = await api.get(`/faculty/classes/${selectedClassId}/students`);
      setClassData(refreshRes.data);
    } catch (err) {
      console.error("Failed to save attendance", err);
      setSaveMessage('Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (!selectedClassId) return;
    window.open(`/api/v1/faculty/attendance/export/${selectedClassId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-28 bg-slate-200/70 rounded-2xl"></div>
          <div className="h-64 bg-slate-200/70 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const filteredStudents = classData?.students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return s.full_name.toLowerCase().includes(q) || s.usn.toLowerCase().includes(q);
  }) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Welcome / Stats Header */}
      <div className="bg-gradient-to-r from-nitte-950 via-nitte-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white relative shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-nitte-200 mb-2">
              <GraduationCap className="w-4 h-4" />
              <span>{stats?.department} Department</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {stats?.faculty_name}
            </h1>
            <p className="text-xs text-nitte-200 mt-1">
              Classroom Attendance & Student Dataset Supervision Console
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="block text-xl font-black text-white">{stats?.assigned_classes_count}</span>
              <span className="text-[11px] text-nitte-200 font-semibold uppercase">Classes</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="block text-xl font-black text-white">{stats?.total_students_enrolled}</span>
              <span className="text-[11px] text-nitte-200 font-semibold uppercase">Enrolled</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 col-span-2 sm:col-span-1">
              <span className="block text-xl font-black text-emerald-400">{stats?.average_attendance_percentage}%</span>
              <span className="text-[11px] text-nitte-200 font-semibold uppercase">Avg Attendance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Attendance Marking Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        
        {/* Class Selection & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Select Class:</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-nitte-500/20 focus:border-nitte-600"
              >
                {classes.map((c) => (
                  <option key={c.class_id} value={c.class_id}>
                    {c.class_name} ({c.enrolled_count} Students)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Attendance Date:</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-nitte-500/20 focus:border-nitte-600"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Report</span>
            </button>

            <button
              onClick={handleSaveAttendance}
              disabled={saving || filteredStudents.length === 0}
              className="px-5 py-2 bg-nitte-700 hover:bg-nitte-800 text-white text-xs font-bold rounded-xl shadow-md shadow-nitte-700/20 flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {saveMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}

        {/* Search bar */}
        <div className="flex items-center justify-between">
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name or USN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-nitte-500/20 focus:border-nitte-600"
            />
          </div>

          <span className="text-xs text-slate-500">
            Showing <strong className="text-slate-800">{filteredStudents.length}</strong> enrolled students
          </span>
        </div>

        {/* Student Attendance Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">USN</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Branch / Sem</th>
                <th className="py-3 px-4">Face Dataset</th>
                <th className="py-3 px-4 text-center">Attendance %</th>
                <th className="py-3 px-4 text-center">Eligibility</th>
                <th className="py-3 px-4 text-center">Mark for {attendanceDate}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => {
                  const currentMark = attendanceMarks[s.student_id] || 'present';
                  return (
                    <tr key={s.student_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-nitte-800">{s.usn}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{s.full_name}</td>
                      <td className="py-3 px-4 text-slate-600">{s.branch} - Sem {s.semester}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.has_face_dataset
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {s.has_face_dataset ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Registered (30 Img)</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 text-amber-500" />
                              <span>Pending</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {s.attendance_percentage}%
                        <span className="block text-[10px] text-slate-400 font-normal">
                          ({s.present_classes}/{s.total_classes} days)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.attendance_percentage >= 75 || s.total_classes === 0
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {s.attendance_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.student_id, 'present')}
                            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                              currentMark === 'present'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.student_id, 'absent')}
                            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                              currentMark === 'absent'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 text-xs">
                    No students found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

export default FacultyDashboard;
