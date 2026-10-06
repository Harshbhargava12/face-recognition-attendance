import React, { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Card from '../components/ui/Card';
import { studentService, attendanceService } from '../services/api';
import { ClipboardList, CheckCircle2, AlertCircle, Calendar, UserCheck } from 'lucide-react';

export const ManualAttendance = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('Present');
  const [remarks, setRemarks] = useState('Manual admin entry');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await studentService.getAll();
        setStudents(res.data.students || []);
        if (res.data.students?.length > 0) {
          setSelectedStudent(res.data.students[0].id);
        }
      } catch (err) {
        console.error("Failed to load students:", err);
      }
    };
    fetchStudents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!selectedStudent) {
      setErrorMsg("Please select a student.");
      return;
    }

    setLoading(true);
    try {
      const res = await attendanceService.markManual({
        student_id: selectedStudent,
        attendance_date: date,
        status: status,
        remarks: remarks
      });
      setSuccessMsg(res.data.message);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to submit manual attendance.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Manual Attendance Override" />

        <main className="p-6 max-w-2xl mx-auto w-full space-y-6">
          <Card title="Mark Manual Attendance" icon={ClipboardList}>
            {successMsg && (
              <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Attendance Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Select Student *</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-blue-500"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.roll_number} - {s.name} ({s.course} {s.branch})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Attendance Status *</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Present', 'Absent', 'Late'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`py-2.5 px-3 rounded-xl font-bold transition-all border ${
                        status === st
                          ? st === 'Present'
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : st === 'Absent'
                            ? 'bg-rose-600 border-rose-500 text-white'
                            : 'bg-amber-600 border-amber-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Medical leave / Manual admin correction"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 mt-2"
              >
                {loading ? 'Saving Record...' : 'Save Manual Attendance Record'}
              </button>
            </form>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default ManualAttendance;
