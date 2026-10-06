import React, { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { attendanceService } from '../services/api';
import { CalendarDays, Search, Filter, RefreshCw } from 'lucide-react';

export const AttendanceRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getRecords({
        date: date,
        search: search,
        course: courseFilter,
        branch: branchFilter,
        status: statusFilter
      });
      setRecords(res.data.records || []);
    } catch (err) {
      console.error("Failed to load records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [date, search, courseFilter, branchFilter, statusFilter]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Date-Wise Attendance Records" />

        <main className="p-6 space-y-6">
          {/* Filter Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student or roll number..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-200 py-2 px-3 rounded-xl outline-none"
              />

              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-300 py-2 px-3 rounded-xl outline-none"
              >
                <option value="">All Courses</option>
                <option value="B.Tech">B.Tech</option>
                <option value="M.Tech">M.Tech</option>
                <option value="BCA">BCA</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-300 py-2 px-3 rounded-xl outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
              </select>

              <button
                onClick={fetchRecords}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs"
                title="Refresh Records"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Records Table */}
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Course & Branch</th>
                    <th className="py-3 px-4">Time Logged</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {records.length > 0 ? (
                    records.map((rec, idx) => (
                      <tr key={rec.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-400">{rec.student?.roll_number}</td>
                        <td className="py-3 px-4 font-bold text-slate-200">{rec.student?.name}</td>
                        <td className="py-3 px-4 text-slate-300">
                          {rec.student?.course} - {rec.student?.branch}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">{rec.attendance_time}</td>
                        <td className="py-3 px-4">
                          <Badge status={rec.status} />
                        </td>
                        <td className="py-3 px-4">
                          <Badge status={rec.method} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        {loading ? 'Loading records...' : `No attendance logs found for date ${date}.`}
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

export default AttendanceRecords;
