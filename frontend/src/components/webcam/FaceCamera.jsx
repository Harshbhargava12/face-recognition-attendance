import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { attendanceService } from '../../services/api';
import { Camera, RefreshCw, CheckCircle2, AlertTriangle, UserX, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import Badge from '../ui/Badge';

export const FaceCamera = ({ onRecognitionResult }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [isScanning, setIsScanning] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [lastResult, setLastResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);

  // Play audio notification feedback
  const playBeep = (type = 'success') => {
    if (!audioEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'already') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {}
  };

  const processFrame = useCallback(async () => {
    if (!isScanning || isProcessingFrame || !webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsProcessingFrame(true);
    try {
      const res = await attendanceService.recognizeFrame(imageSrc);

      if (res.data && res.data.results && res.data.results.length > 0) {
        const primaryRes = res.data.results[0];
        setLastResult(primaryRes);

        if (primaryRes.status === 'MATCHED') {
          if (primaryRes.is_newly_marked) {
            playBeep('success');
          } else {
            playBeep('already');
          }
        } else if (primaryRes.status === 'UNKNOWN_FACE') {
          playBeep('unknown');
        }

        if (onRecognitionResult) {
          onRecognitionResult(primaryRes);
        }
      }
      setErrorMsg(null);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMsg(err.response.data.message);
      }
    } finally {
      setIsProcessingFrame(false);
    }
  }, [isScanning, isProcessingFrame, onRecognitionResult, audioEnabled]);

  // Frame sampling interval (every 700ms)
  useEffect(() => {
    let intervalId;
    if (isScanning) {
      intervalId = setInterval(() => {
        processFrame();
      }, 750);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isScanning, processFrame]);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
      {/* Webcam Frame Container */}
      <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl group">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 1280,
            height: 720,
            facingMode: 'user',
          }}
          className="w-full h-full object-cover"
          onUserMediaError={(err) => setErrorMsg('Camera permission denied or camera unavailable.')}
        />

        {/* Live Indicator Overlay */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-700 text-xs font-semibold">
          <span className={`w-2.5 h-2.5 rounded-full ${isScanning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-slate-200">{isScanning ? 'Live AI Scanner' : 'Scanner Paused'}</span>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className="absolute top-4 right-4 p-2 bg-slate-900/80 backdrop-blur hover:bg-slate-800 rounded-full border border-slate-700 text-slate-300 transition-all"
          title={audioEnabled ? 'Mute Audio Beep' : 'Enable Audio Beep'}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        {/* Overlay Result Badge */}
        {lastResult && (
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-700/80 shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2">
            {lastResult.status === 'MATCHED' ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${lastResult.is_newly_marked ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-slate-100">{lastResult.student?.name}</h4>
                      <Badge status={lastResult.is_newly_marked ? 'Present' : 'Late'}>
                        {lastResult.is_newly_marked ? 'Marked Present' : 'Already Marked'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Roll No: <span className="font-mono text-slate-200">{lastResult.student?.roll_number}</span> | Course: {lastResult.student?.course} ({lastResult.student?.branch})
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Time: <span className="font-semibold text-slate-300">{lastResult.attendance_time}</span> • Confidence: <span className="text-emerald-400 font-semibold">{lastResult.confidence}%</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <UserX className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-rose-400">UNKNOWN FACE</h4>
                  <p className="text-xs text-slate-400">Face detected but match confidence is below system threshold.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message Alert */}
      {errorMsg && (
        <div className="w-full bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsScanning(!isScanning)}
          className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-lg ${
            isScanning
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
          }`}
        >
          {isScanning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Pause Camera
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" /> Resume Scanner
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FaceCamera;
