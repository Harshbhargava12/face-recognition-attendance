import React, { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { reportsService, studentService } from '../services/api';
import {
  FileSpreadsheet,
  Download,
  FileText,
  Filter,
  Calendar,
  BookOpen,
  Users
} from 'lucide-react';

export const Reports = () => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [course, setCourse] = useState('');
  const [branch, setBranch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  const [students, setStudents] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await studentService.getAll();
        setStudents(res.data.students || []);
      } catch (err) {}
    };
    fetchStudents();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await reportsService.getData({
        start_date: startDate,
        end_date: endDate,
        course,
        branch,
        student_id: selectedStudent
      });
      setReportData(res.data);
    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate, course, branch, selectedStudent]);

  const handleDownloadCSV = () => {
    const url = reportsService.getCSVUrl({
      start_date: startDate,
      end_date: endDate,
      course,
      branch,
      student_id: selectedStudent
    });
    window.open(url, '_blank');
  };

  const handleDownloadPDF = () => {
    const url = reportsService.getPDFUrl({
      start_date: startDate,
      end_date: endDate,
      course,
      branch,
      student_id: selectedStudent
    });
    window.open(url, '_blank');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Attendance Report Generator" />

        <main className="p-6 space-y-6">
          {/* Controls Card */}
          <Card title="Report Configuration & Filters" icon={Filter}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Course</label>
                <select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-blue-500"
                >
                  <option value="">All Courses</option>
                  <option value="B.Tech">B.Tech</option>
                  <option value="M.Tech">M.Tech</option>
                  <option value="BCA">BCA</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Branch</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-blue-500"
                >
                  <option value="">All Branches</option>
                  <option value="Computer Science & Engineering">CSE</option>
                  <option value="Information Technology">IT</option>
                  <option value="Electronics & Communication">ECE</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Student</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-blue-500"
                >
                  <option value="">All Students</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.roll_number} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-800">
              <button
                onClick={handleDownloadCSV}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" /> Download CSV Report
              </button>

              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all"
              >
                <FileText className="w-4 h-4" /> Download PDF Report
              </button>
            </div>
          </Card>

          {/* Summary Metric Strip */}
          {reportData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                <p className="text-xs text-slate-400 font-medium">Total Attendance Logs</p>
                <h4 className="text-2xl font-extrabold text-slate-100 mt-1">{reportData.total}</h4>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                <p className="text-xs text-emerald-400 font-medium">Present Logs</p>
                <h4 className="text-2xl font-extrabold text-emerald-400 mt-1">{reportData.present}</h4>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                <p className="text-xs text-rose-400 font-medium">Absent Logs</p>
                <h4 className="text-2xl font-extrabold text-rose-400 mt-1">{reportData.absent}</h4>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                <p className="text-xs text-amber-400 font-medium">Attendance Rate</p>
                <h4 className="text-2xl font-extrabold text-amber-400 mt-1">{reportData.attendance_percentage}%</h4>
              </div>
            </div>
          )}

          {/* Preview Table */}
          <Card title="Report Data Preview" icon={FileText}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Roll No</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Course / Branch</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {reportData?.records?.length > 0 ? (
                    reportData.records.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-mono font-semibold text-blue-400">{r.student?.roll_number}</td>
                        <td className="py-2 px-3 font-bold text-slate-200">{r.student?.name}</td>
                        <td className="py-2 px-3 text-slate-300">
                          {r.student?.course} - {r.student?.branch}
                        </td>
                        <td className="py-2 px-3 text-slate-300">{r.attendance_date}</td>
                        <td className="py-2 px-3 font-mono text-slate-400">{r.attendance_time}</td>
                        <td className="py-2 px-3">
                          <Badge status={r.status} />
                        </td>
                        <td className="py-2 px-3">
                          <Badge status={r.method} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        {loading ? 'Generating preview...' : 'No attendance data found for selected filter range.'}
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

export default Reports;
