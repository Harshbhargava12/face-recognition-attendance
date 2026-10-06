import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export const MultiShotWebcam = ({ onCapturedFrames, targetShotCount = 5 }) => {
  const webcamRef = useRef(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [error, setError] = useState(null);

  const capturePhoto = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();

    if (imageSrc) {
      if (capturedImages.length >= 10) {
        setError("Maximum 10 images limit reached.");
        return;
      }
      setCapturedImages((prev) => [...prev, imageSrc]);
      setError(null);

      if (onCapturedFrames) {
        onCapturedFrames([...capturedImages, imageSrc]);
      }
    }
  };

  const removePhoto = (index) => {
    const updated = capturedImages.filter((_, i) => i !== index);
    setCapturedImages(updated);
    if (onCapturedFrames) {
      onCapturedFrames(updated);
    }
  };

  return (
    <div className="space-y-4">
      {/* Camera Preview */}
      <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
          className="w-full h-full object-cover"
        />

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
          <button
            type="button"
            onClick={capturePhoto}
            className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
          >
            <Camera className="w-4 h-4" /> Capture Photo ({capturedImages.length}/{targetShotCount})
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center">
        💡 Tip: Capture 3 to 5 images from slightly different face angles (front, slight left, slight right, smiling).
      </p>

      {/* Captured Thumbnails Strip */}
      {capturedImages.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-300 mb-2">Captured Shots:</h4>
          <div className="grid grid-cols-5 gap-2">
            {capturedImages.map((img, idx) => (
              <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-900 aspect-square">
                <img src={img} alt={`Shot ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 transition-all"
                  title="Remove shot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs text-rose-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default MultiShotWebcam;
