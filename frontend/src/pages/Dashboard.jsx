import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { dashboardService } from '../services/api';
import {
  Users,
  UserCheck,
  UserX,
  Percent,
  ClipboardList,
  Camera,
  ArrowUpRight,
  TrendingUp,
  PieChart as PieIcon,
  BookOpen
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const res = await dashboardService.getStats();
      setData(res.data);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto refresh every 10 seconds
    const timer = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(timer);
  }, []);

  const stats = data?.stats || {
    total_students: 0,
    present_today: 0,
    absent_today: 0,
    attendance_percentage: 0,
    total_attendance_records: 0
  };

  const statCards = [
    {
      title: 'Total Registered Students',
      value: stats.total_students,
      sub: 'Enrolled in system',
      icon: Users,
      color: 'from-blue-600 to-indigo-600',
      iconColor: 'text-blue-400'
    },
    {
      title: 'Present Today',
      value: stats.present_today,
      sub: 'Marked marked via AI / Manual',
      icon: UserCheck,
      color: 'from-emerald-600 to-teal-600',
      iconColor: 'text-emerald-400'
    },
    {
      title: 'Absent Today',
      value: stats.absent_today,
      sub: 'Not recorded yet today',
      icon: UserX,
      color: 'from-rose-600 to-pink-600',
      iconColor: 'text-rose-400'
    },
    {
      title: 'Overall Attendance Rate',
      value: `${stats.attendance_percentage}%`,
      sub: 'Across all active courses',
      icon: Percent,
      color: 'from-amber-600 to-orange-600',
      iconColor: 'text-amber-400'
    },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Attendance Analytics & Dashboard" />

        <main className="p-6 space-y-6">
          {/* Quick Action Hero Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-100 tracking-tight">
                Automated Face Recognition Attendance
              </h3>
              <p className="text-xs text-slate-400 max-w-xl">
                Real-time AI continuous camera scanning, automatic date/time logging, and instant student verification.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/attendance/mark')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
              >
                <Camera className="w-4 h-4" /> Start AI Scanner
              </button>
              <button
                onClick={() => navigate('/students/register')}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all"
              >
                + Register Student
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">{card.title}</span>
                    <div className={`p-2.5 rounded-xl bg-slate-800/80 ${card.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <h4 className="text-2xl font-extrabold text-slate-100 tracking-tight">{card.value}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">{card.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Attendance Trend */}
            <Card title="Weekly Attendance Trend (Last 7 Days)" icon={TrendingUp} className="lg:col-span-2">
              <div className="h-72 w-full">
                {data?.weekly_chart?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.weekly_chart}>
                      <defs>
                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                      <YAxis stroke="#64748B" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="present"
                        name="Present Students"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorPresent)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No trend data available.
                  </div>
                )}
              </div>
            </Card>

            {/* Present vs Absent Ratio */}
            <Card title="Today's Attendance Ratio" icon={PieIcon}>
              <div className="h-72 w-full flex flex-col items-center justify-center">
                {data?.status_breakdown?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.status_breakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.status_breakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-500">No data today.</p>
                )}
                <div className="flex gap-4 mt-2 text-xs font-semibold">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present ({stats.present_today})
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent ({stats.absent_today})
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom Grid: Course-wise % & Recent Log Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Course Attendance Percentage */}
            <Card title="Course-wise Attendance Rate" icon={BookOpen}>
              <div className="h-64 w-full">
                {data?.course_chart?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.course_chart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="course" stroke="#64748B" fontSize={11} />
                      <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }}
                      />
                      <Bar dataKey="attendance_percentage" name="Attendance %" fill="#6366F1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No course data.
                  </div>
                )}
              </div>
            </Card>

            {/* Recent Live Activity */}
            <Card
              title="Recent Live Attendance Logs"
              icon={ClipboardList}
              action={
                <button
                  onClick={() => navigate('/attendance/records')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                >
                  View All <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data?.recent_activity?.length > 0 ? (
                      data.recent_activity.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3">
                            <p className="font-semibold text-slate-200">{rec.student?.name}</p>
                            <p className="text-[10px] text-slate-400">{rec.student?.roll_number}</p>
                          </td>
                          <td className="py-2 px-3 text-slate-400 font-mono">
                            {rec.attendance_date} <br />
                            <span className="text-slate-300">{rec.attendance_time}</span>
                          </td>
                          <td className="py-2 px-3">
                            <Badge status={rec.status} />
                          </td>
                          <td className="py-2 px-3">
                            <Badge status={rec.method} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-slate-500">
                          No recent attendance logs recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
