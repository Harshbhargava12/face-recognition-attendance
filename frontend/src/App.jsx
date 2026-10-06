import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import RegisterStudent from './pages/RegisterStudent';
import StudentDetails from './pages/StudentDetails';
import FaceAttendance from './pages/FaceAttendance';
import ManualAttendance from './pages/ManualAttendance';
import AttendanceRecords from './pages/AttendanceRecords';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <Students />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students/register"
            element={
              <ProtectedRoute>
                <RegisterStudent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students/:id"
            element={
              <ProtectedRoute>
                <StudentDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/mark"
            element={
              <ProtectedRoute>
                <FaceAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/manual"
            element={
              <ProtectedRoute>
                <ManualAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/records"
            element={
              <ProtectedRoute>
                <AttendanceRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
