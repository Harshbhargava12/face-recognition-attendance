import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { studentService } from '../services/api';
import {
  ArrowLeft,
  User,
  Calendar,
  Mail,
  Phone,
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Percent
} from 'lucide-react';

export const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await studentService.getById(id);
        setStudent(res.data.student);
      } catch (err) {
        console.error("Failed to load student details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar title="Student Profile & Attendance History" />
          <div className="p-6 text-center text-slate-400">Loading student details...</div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar title="Student Profile" />
          <div className="p-6 text-center text-slate-400">Student not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title={`Student Profile: ${student.name}`} />

        <main className="p-6 max-w-6xl mx-auto w-full space-y-6">
          <button
            onClick={() => navigate('/students')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Students
          </button>

          {/* Top Profile Summary Card */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Profile Photo */}
              <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center shrink-0 shadow-xl">
                {student.profile_image ? (
                  <img src={student.profile_image} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-500" />
                )}
              </div>

              {/* Info Details */}
              <div className="flex-1 space-y-2 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">{student.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Roll No: {student.roll_number}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span>{student.course} ({student.branch})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-400" />
                    <span>Semester {student.semester} - Sec {student.section || 'A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{student.email}</span>
                  </div>
                </div>
              </div>

              {/* Big Attendance % Badge */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center min-w-[140px] shadow-lg">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Attendance %</p>
                <h3
                  className={`text-3xl font-extrabold tracking-tight mt-1 ${
                    student.attendance_percentage >= 75 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {student.attendance_percentage}%
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">
                  {student.attendance_percentage >= 75 ? 'Eligible for Exams' : 'Shortage Warning'}
                </p>
              </div>
            </div>
          </Card>

          {/* Attendance Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
              <p className="text-xs font-medium text-slate-400">Total Classes</p>
              <h4 className="text-xl font-bold text-slate-100 mt-1">{student.total_classes}</h4>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
              <p className="text-xs font-medium text-emerald-400">Present Days</p>
              <h4 className="text-xl font-bold text-emerald-400 mt-1">{student.present_count}</h4>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
              <p className="text-xs font-medium text-rose-400">Absent Days</p>
              <h4 className="text-xl font-bold text-rose-400 mt-1">{student.absent_count}</h4>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
              <p className="text-xs font-medium text-amber-400">Late Days</p>
              <h4 className="text-xl font-bold text-amber-400 mt-1">{student.late_count}</h4>
            </div>
          </div>

          {/* Detailed History Table */}
          <Card title="Detailed Attendance History Log" icon={Calendar}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Recognition Method</th>
                    <th className="py-2.5 px-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {student.attendance_history?.length > 0 ? (
                    student.attendance_history.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-semibold text-slate-200">{log.attendance_date}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{log.attendance_time}</td>
                        <td className="py-2.5 px-3">
                          <Badge status={log.status} />
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge status={log.method} />
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{log.remarks || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-500">
                        No attendance records recorded for this student yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default StudentDetails;
