import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Card from '../components/ui/Card';
import MultiShotWebcam from '../components/webcam/MultiShotWebcam';
import { studentService } from '../services/api';
import {
  UserPlus,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Image as ImageIcon
} from 'lucide-react';

export const RegisterStudent = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    roll_number: '',
    name: '',
    email: '',
    phone: '',
    course: 'B.Tech',
    branch: 'Computer Science & Engineering',
    semester: '1',
    section: 'A',
    date_of_birth: '',
    enrollment_date: new Date().toISOString().split('T')[0],
  });

  const [registrationMode, setRegistrationMode] = useState('webcam'); // 'webcam' | 'upload'
  const [capturedFrames, setCapturedFrames] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      // 1. Create Student record first
      const createRes = await studentService.create(formData);
      const newStudent = createRes.data.student;

      // 2. Register Face Encodings
      if (registrationMode === 'webcam' && capturedFrames.length > 0) {
        await studentService.registerFace(newStudent.id, {
          frames: capturedFrames
        });
      } else if (registrationMode === 'upload' && selectedFile) {
        const fileData = new FormData();
        fileData.append('file', selectedFile);
        await studentService.registerFace(newStudent.id, fileData);
      }

      setSuccessMsg(`Student "${newStudent.name}" registered successfully with face data!`);
      setTimeout(() => {
        navigate('/students');
      }, 1500);

    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to register student. Please check inputs and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Register New Student" />

        <main className="p-6 max-w-5xl mx-auto w-full space-y-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/students')}
              className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Students Directory
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Demographic Details Form */}
            <Card title="Student Information" icon={UserPlus}>
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Roll Number / Student ID *</label>
                  <input
                    type="text"
                    name="roll_number"
                    required
                    placeholder="e.g. 231B001"
                    value={formData.roll_number}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="rahul@college.edu"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Course</label>
                    <select
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-blue-500"
                    >
                      <option value="B.Tech">B.Tech</option>
                      <option value="M.Tech">M.Tech</option>
                      <option value="BCA">BCA</option>
                      <option value="MCA">MCA</option>
                      <option value="B.Sc">B.Sc</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Branch</label>
                    <input
                      type="text"
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Semester</label>
                    <input
                      type="text"
                      name="semester"
                      value={formData.semester}
                      onChange={handleChange}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Section</label>
                    <input
                      type="text"
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Enrollment Date</label>
                    <input
                      type="date"
                      name="enrollment_date"
                      value={formData.enrollment_date}
                      onChange={handleChange}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Face Registration Mode Selection */}
            <Card title="Biometric Face Data Capture" icon={Camera}>
              <div className="space-y-4 text-xs">
                {/* Mode Selector */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRegistrationMode('webcam')}
                    className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                      registrationMode === 'webcam'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Camera className="w-4 h-4" /> Option 1: Live Webcam
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegistrationMode('upload')}
                    className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                      registrationMode === 'upload'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Upload className="w-4 h-4" /> Option 2: Upload Photo
                  </button>
                </div>

                {/* Option 1: Live Webcam MultiShot */}
                {registrationMode === 'webcam' && (
                  <MultiShotWebcam onCapturedFrames={(frames) => setCapturedFrames(frames)} />
                )}

                {/* Option 2: Upload Image File */}
                {registrationMode === 'upload' && (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 p-6 rounded-2xl text-center flex flex-col items-center justify-center gap-2 bg-slate-950/50 transition-all cursor-pointer relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <ImageIcon className="w-8 h-8 text-slate-500" />
                      <div>
                        <p className="font-semibold text-slate-200">Click to upload or drag & drop</p>
                        <p className="text-[10px] text-slate-500">Supports JPG, PNG (Contains exactly 1 front face)</p>
                      </div>
                    </div>

                    {filePreview && (
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-950 max-h-48 mx-auto">
                        <img src={filePreview} alt="Face preview" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 mt-4"
                >
                  {loading ? 'Saving Student & Face Data...' : 'Complete Student Registration'}
                </button>
              </div>
            </Card>
          </form>
        </main>
      </div>
    </div>
  );
};

export default RegisterStudent;
