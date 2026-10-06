import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Card from '../components/ui/Card';
import FaceCamera from '../components/webcam/FaceCamera';
import Badge from '../components/ui/Badge';
import { Camera, CheckCircle2, AlertTriangle, UserX, Clock, History } from 'lucide-react';

export const FaceAttendance = () => {
  const [recentLogs, setRecentLogs] = useState([]);

  const handleRecognitionResult = (result) => {
    if (result && result.status === 'MATCHED') {
      setRecentLogs((prev) => {
        // Prevent duplicate entries in recent log strip
        const exists = prev.some(
          (item) => item.student?.id === result.student?.id && item.attendance_time === result.attendance_time
        );
        if (exists) return prev;
        return [result, ...prev.slice(0, 9)];
      });
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Live AI Face Recognition Attendance" />

        <main className="p-6 max-w-5xl mx-auto w-full space-y-6">
          {/* Header Banner */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">Real-time Face Recognition</h2>
            <p className="text-xs text-slate-400">
              Position student in front of the camera. Attendance will be automatically verified and logged into database.
            </p>
          </div>

          {/* AI Face Camera */}
          <FaceCamera onRecognitionResult={handleRecognitionResult} />

          {/* Real-time Verification Log Stream */}
          <Card title="Live Session Verification Activity Log" icon={History}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Roll Number</th>
                    <th className="py-2.5 px-3">Course / Branch</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">AI Confidence</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentLogs.length > 0 ? (
                    recentLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-slate-200">{log.student?.name}</td>
                        <td className="py-2.5 px-3 font-mono text-blue-400">{log.student?.roll_number}</td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {log.student?.course} - {log.student?.branch}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{log.attendance_time}</td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-400">{log.confidence}%</td>
                        <td className="py-2.5 px-3">
                          <Badge status={log.is_newly_marked ? 'Present' : 'Late'}>
                            {log.is_newly_marked ? 'Marked Present' : 'Already Marked'}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">
                        Camera active. Standing by for face detection...
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

export default FaceAttendance;
