import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import confetti from 'canvas-confetti';
import {
  Camera,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  User,
  ShieldCheck,
  Video,
  VideoOff,
  Sparkles,
  Layers,
  RefreshCw,
  Eye,
  Sliders,
  Maximize2,
  Database
} from 'lucide-react';

const STEPS = [
  { id: 'forward', label: 'Forward', desc: 'Look directly at the camera with a neutral expression', icon: ArrowRight, angle: '0°' },
  { id: 'left', label: 'Left', desc: 'Turn head approximately 45 degrees to your left', icon: ArrowLeft, angle: '~45° L' },
  { id: 'right', label: 'Right', desc: 'Turn head approximately 45 degrees to your right', icon: ArrowRight, angle: '~45° R' },
  { id: 'up', label: 'Up', desc: 'Tilt face approximately 30–45 degrees upward', icon: ArrowUp, angle: '~35° Up' },
  { id: 'down', label: 'Down', desc: 'Tilt face approximately 30–45 degrees downward', icon: ArrowDown, angle: '~35° Down' },
];

const AUGMENTATIONS = [
  { name: 'Rotation', desc: 'Random angle between ±15° preserving facial structure' },
  { name: 'Horizontal Flip', desc: 'Deterministic mirror transformation for pose invariance' },
  { name: 'Brightness / Contrast', desc: '±20–30% lighting adjustments to simulate ambient variations' },
  { name: 'Blur / Noise', desc: 'Controlled mild Gaussian blur and sensor noise modeling' },
  { name: 'Scale (Zoom)', desc: '85–95% centered bounding-box crop and proportional resize' },
];

const FaceRegistrationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [captures, setCaptures] = useState({}); // { forward: dataUri, left: dataUri, ... }
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [streamResolution, setStreamResolution] = useState({ width: 0, height: 0 });
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [validationFeedback, setValidationFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize camera and list devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      } catch (err) {
        console.error("Device enumeration failed", err);
      }
    };
    getDevices();
  }, []);

  // Start or restart webcam stream
  const startCamera = async () => {
    setCameraError('');
    stopCamera();
    try {
      const constraints = {
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setStreamResolution({
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight,
          });
        };
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Webcam access error:", err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : `Unable to access webcam: ${err.message}`
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [selectedDeviceId]);

  // Capture current frame from video
  const captureFrame = () => {
    if (!videoRef.current || !isCameraActive) return null;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  // Perform Capture & RetinaFace validation
  const handleCapture = async () => {
    const currentStep = STEPS[currentStepIndex];
    setValidationError('');
    setValidationFeedback(null);
    setIsValidating(true);

    const dataUri = captureFrame();
    if (!dataUri) {
      setValidationError('Failed to capture frame from video feed. Please ensure camera is running.');
      setIsValidating(false);
      return;
    }

    try {
      // Send frame to RetinaFace validation endpoint
      const res = await api.post('/face-registration/validate-capture', {
        orientation: currentStep.id,
        image_base64: dataUri,
      });

      const result = res.data;
      if (!result.is_valid) {
        setValidationError(result.message);
        setIsValidating(false);
        return;
      }

      // Capture is valid! Save it into captures dictionary
      const updatedCaptures = { ...captures, [currentStep.id]: dataUri };
      setCaptures(updatedCaptures);
      setValidationFeedback(result.message);

      // Check if all 5 completed
      const completedCount = Object.keys(updatedCaptures).length;
      if (completedCount === 5) {
        setShowReviewModal(true);
      } else {
        // Find next incomplete step
        const nextIncompleteIndex = STEPS.findIndex(s => !updatedCaptures[s.id]);
        if (nextIncompleteIndex !== -1) {
          setCurrentStepIndex(nextIncompleteIndex);
        } else if (currentStepIndex < STEPS.length - 1) {
          setCurrentStepIndex(currentStepIndex + 1);
        }
      }
    } catch (err) {
      console.error("RetinaFace validation failed:", err);
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
        ? detail.map(d => d.msg || JSON.stringify(d)).join(', ')
        : 'Inference error during RetinaFace validation. Please try again.';
      setValidationError(errorMsg);
    } finally {
      setIsValidating(false);
    }
  };

  // Retake a specific orientation capture
  const handleRetake = (stepIndex) => {
    if (stepIndex < 0 || stepIndex >= STEPS.length) return;
    const step = STEPS[stepIndex];
    if (!step) return;
    const newCaptures = { ...captures };
    delete newCaptures[step.id];
    setCaptures(newCaptures);
    setCurrentStepIndex(stepIndex);
    setShowReviewModal(false);
    setValidationError('');
    setValidationFeedback(null);
  };

  // Final Dataset Submission (5 originals -> 25 augmentations -> 30 total SQL LONGBLOB storage)
  const handleSubmitDataset = async () => {
    setIsSubmitting(true);
    setValidationError('');

    try {
      const payload = {
        captures: STEPS.map((step) => ({
          orientation: step.id,
          image_base64: captures[step.id],
        })),
      };

      const res = await api.post('/face-registration/submit-dataset', payload);
      setSubmissionSuccess(res.data);
      setShowReviewModal(false);

      // Trigger celebration confetti safely
      try {
        if (typeof confetti === 'function') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } catch (confettiErr) {
        console.warn("Confetti animation skipped:", confettiErr);
      }
    } catch (err) {
      console.error("Dataset submission error:", err);
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
        ? detail.map(d => d.msg || JSON.stringify(d)).join(', ')
        : 'Dataset registration failed during storage. Please try again.';
      setValidationError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStep = STEPS[currentStepIndex] || STEPS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Camera className="w-6 h-6 text-nitte-600" />
            <span>Face Registration & Dataset Capture</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Capture 5 multi-orientation facial images for automated CNN training and attendance verification.
          </p>
        </div>

        <div className="mt-3 sm:mt-0 flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Student:</span>
          <span className="text-xs font-bold text-nitte-800 bg-nitte-100 px-2.5 py-1 rounded-lg">
            {user?.student?.full_name} ({user?.student?.usn})
          </span>
        </div>
      </div>

      {/* THREE-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: 5-Step Instructions (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Step Instructions</span>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">5 Facial Orientations</h2>
          </div>

          <div className="space-y-3">
            {STEPS.map((step, idx) => {
              const isCompleted = !!captures[step.id];
              const isCurrent = currentStepIndex === idx;

              return (
                <div
                  key={step.id}
                  onClick={() => {
                    if (isCompleted) handleRetake(idx);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-nitte-600 bg-nitte-50/70 shadow-sm'
                      : isCompleted
                      ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70'
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isCompleted
                            ? 'bg-emerald-500 text-white'
                            : isCurrent
                            ? 'bg-nitte-700 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className={`text-sm font-bold ${isCurrent ? 'text-nitte-900' : 'text-slate-800'}`}>
                        {step.label}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 font-semibold">
                      {step.angle}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 pl-9 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-nitte-600 flex-shrink-0" />
              <span>RetinaFace validates single person, bounds, and lighting automatically.</span>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Live Webcam (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col items-center">
          
          {/* Camera Controls Bar */}
          <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isCameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="font-semibold">{isCameraActive ? 'Live Camera Feed' : 'Camera Inactive'}</span>
              {isCameraActive && streamResolution.width > 0 && (
                <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                  {streamResolution.width} × {streamResolution.height}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {videoDevices.length > 1 && (
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs"
                >
                  {videoDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={isCameraActive ? stopCamera : startCamera}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center space-x-1"
              >
                {isCameraActive ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                <span>{isCameraActive ? 'Stop' : 'Start'}</span>
              </button>
            </div>
          </div>

          {/* Video Container with Circular & Bracket Overlays */}
          <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100" // Mirror for intuitive selfie experience
            />

            {/* Inactive or Error State */}
            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-slate-900/90 z-20">
                <VideoOff className="w-12 h-12 text-slate-400 mb-3" />
                <h3 className="text-base font-bold">Camera Feed Not Available</h3>
                <p className="text-xs text-slate-300 max-w-xs mt-1 mb-4">
                  {cameraError || 'Please allow webcam permissions to capture your facial dataset.'}
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-nitte-600 hover:bg-nitte-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Enable Camera
                </button>
              </div>
            )}

            {/* Circular Positioning Guide Overlay (White circular positioning guide over video) */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                {/* 4 Corner Framing Brackets */}
                <div className="absolute w-72 h-80 border-2 border-transparent">
                  {/* Top-Left */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/90 rounded-tl-lg shadow-sm"></div>
                  {/* Top-Right */}
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/90 rounded-tr-lg shadow-sm"></div>
                  {/* Bottom-Left */}
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/90 rounded-bl-lg shadow-sm"></div>
                  {/* Bottom-Right */}
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/90 rounded-br-lg shadow-sm"></div>
                </div>

                {/* White Circular Guide */}
                <div className="w-64 h-64 rounded-full border-2 border-dashed border-white/80 shadow-[0_0_15px_rgba(255,255,255,0.25)] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white/40"></div>
                </div>

                {/* Dynamic Directional Guidance Overlay */}
                <div className="absolute top-4 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-semibold flex items-center space-x-2 border border-white/20 shadow-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-nitte-400 animate-ping"></span>
                  <span className="font-bold text-nitte-200">Pose {currentStepIndex + 1} of 5:</span>
                  <span className="text-white uppercase tracking-wider">{currentStep.label}</span>
                  <span className="text-slate-300 font-mono text-[11px]">({currentStep.angle})</span>
                </div>

                {/* Center Visual Pose Direction Indicators */}
                {currentStep.id === 'left' && (
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center space-y-1 bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 animate-pulse">
                    <ArrowLeft className="w-7 h-7 text-amber-300" />
                    <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wider">Turn Left</span>
                  </div>
                )}

                {currentStep.id === 'right' && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center space-y-1 bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 animate-pulse">
                    <ArrowRight className="w-7 h-7 text-amber-300" />
                    <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wider">Turn Right</span>
                  </div>
                )}

                {currentStep.id === 'up' && (
                  <div className="absolute top-14 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 animate-pulse">
                    <ArrowUp className="w-5 h-5 text-amber-300" />
                    <span className="text-[11px] font-bold text-amber-200 uppercase tracking-wider">Tilt Head Upward</span>
                  </div>
                )}

                {currentStep.id === 'down' && (
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 animate-pulse">
                    <ArrowDown className="w-5 h-5 text-amber-300" />
                    <span className="text-[11px] font-bold text-amber-200 uppercase tracking-wider">Tilt Head Downward</span>
                  </div>
                )}

                {currentStep.id === 'forward' && (
                  <div className="absolute top-14 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20">
                    <Eye className="w-4 h-4 text-emerald-300" />
                    <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">Look Directly Forward</span>
                  </div>
                )}

                {/* Bottom Overlay Guideline / Active Error Guidance */}
                <div className={`absolute bottom-3 left-4 right-4 backdrop-blur-md py-2 px-3.5 rounded-xl text-center text-xs font-semibold border transition-all ${
                  validationError
                    ? 'bg-red-950/80 text-red-200 border-red-500/40'
                    : 'bg-black/65 text-white/90 border-white/10'
                }`}>
                  {validationError ? (
                    <span className="flex items-center justify-center space-x-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      <span>{validationError}</span>
                    </span>
                  ) : (
                    <span>{currentStep.desc}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Validation Error Message Alert */}
          {validationError && (
            <div className="w-full mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Validation Success Feedback */}
          {validationFeedback && !validationError && (
            <div className="w-full mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{validationFeedback}</span>
            </div>
          )}

          {/* DYNAMIC CAPTURE BUTTON */}
          <div className="w-full mt-4 flex items-center space-x-3">
            {Object.keys(captures).length === 5 ? (
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="flex-1 py-3.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-800/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ALL 5 POSES CAPTURED — REVIEW & SUBMIT</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCapture}
                disabled={!isCameraActive || isValidating}
                className="flex-1 py-3.5 bg-gradient-to-r from-nitte-800 to-nitte-600 hover:from-nitte-900 hover:to-nitte-700 text-white font-bold text-sm rounded-xl shadow-md shadow-nitte-800/25 flex items-center justify-center space-x-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isValidating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    <span>RetinaFace Validating...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>CAPTURE ({currentStepIndex + 1} / 5: {currentStep.label})</span>
                  </>
                )}
              </button>
            )}

            {Object.keys(captures).length > 0 && (
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl flex items-center space-x-1 transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Review ({Object.keys(captures).length}/5)</span>
              </button>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Progress & Augmentation Details (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Progress Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Capture Progress</span>
            <div className="flex items-center justify-between mt-1 mb-4">
              <h3 className="text-base font-bold text-slate-900">5 Poses Required</h3>
              <span className="text-xs font-extrabold text-nitte-700 bg-nitte-50 px-2 py-0.5 rounded-full">
                {Object.keys(captures).length} / 5 Done
              </span>
            </div>

            {/* 5 Connected Progress Indicators */}
            <div className="space-y-2.5">
              {STEPS.map((step, idx) => {
                const isCompleted = !!captures[step.id];
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step.id} className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-nitte-600 text-white ring-4 ring-nitte-100'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </div>

                    <div className="flex-1 flex items-center justify-between">
                      <span className={`text-xs font-semibold ${isCurrent ? 'text-nitte-900 font-bold' : 'text-slate-700'}`}>
                        {step.label}
                      </span>
                      {isCompleted ? (
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Saved</span>
                      ) : isCurrent ? (
                        <span className="text-[10px] text-nitte-600 font-bold bg-nitte-50 px-1.5 py-0.5 rounded">Active</span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Pending</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AUGMENTATION INFORMATION CARD */}
          <div className="bg-gradient-to-br from-slate-900 to-nitte-950 rounded-2xl p-5 text-white shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-nitte-300">
                AFTER COMPLETION
              </span>
              <Layers className="w-4 h-4 text-nitte-300" />
            </div>

            <h3 className="text-sm font-extrabold tracking-tight text-white">
              5 Independent Augmentations
            </h3>
            <p className="text-xs text-slate-300">
              Each original image generates 5 OpenCV transformations:
            </p>

            <div className="space-y-2 pt-1 text-xs">
              {AUGMENTATIONS.map((aug, i) => (
                <div key={i} className="flex items-start space-x-2 bg-white/5 p-2 rounded-lg border border-white/10">
                  <div className="w-4 h-4 rounded-full bg-nitte-500/40 text-nitte-200 flex items-center justify-center font-mono text-[10px] flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <span className="font-semibold text-white block">{aug.name}</span>
                    <span className="text-[11px] text-slate-300">{aug.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/10 text-center">
              <span className="text-xs font-mono font-bold text-nitte-200">
                5 originals + 25 augmented = 30 images
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* REVIEW & SUBMISSION MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Review 5 Captured Orientations</h3>
                <p className="text-xs text-slate-500">
                  Review all 5 photos before final augmentation and MySQL database storage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* 5 Captured Photos Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {STEPS.map((step, idx) => {
                const imgUri = captures[step.id];
                return (
                  <div key={step.id} className="flex flex-col space-y-1.5">
                    <div className="relative aspect-square rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm">
                      {imgUri ? (
                        <img src={imgUri} alt={step.label} className="w-full h-full object-cover transform -scale-x-100" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center text-xs">
                          <User className="w-6 h-6 mb-1 text-slate-300" />
                          <span>Missing</span>
                        </div>
                      )}
                      <span className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-md text-[10px] text-white px-1.5 py-0.5 rounded font-semibold">
                        {step.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRetake(idx)}
                      className="w-full py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg flex items-center justify-center space-x-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Retake</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Error Message */}
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Submission Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Back to Camera
              </button>

              <button
                type="button"
                disabled={Object.keys(captures).length < 5 || isSubmitting}
                onClick={handleSubmitDataset}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-nitte-800 to-nitte-600 hover:from-nitte-900 hover:to-nitte-700 text-white text-xs font-bold shadow-md shadow-nitte-800/25 flex items-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    <span>Augmenting & Storing 30 Images in SQL...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Submit & Generate 30 Images</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINAL SUCCESS SCREEN */}
      {submissionSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                FACE DATASET REGISTERED SUCCESSFULLY!
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                All 30 images verified and committed to MySQL database.
              </p>
            </div>

            {/* Statistics Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2 border border-slate-100 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Student Name:</span>
                <span className="font-bold text-slate-800">{submissionSuccess.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">USN:</span>
                <span className="font-mono font-bold text-nitte-700">{submissionSuccess.usn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Original Images:</span>
                <span className="font-bold text-slate-800">{submissionSuccess.original_images}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Augmented Images:</span>
                <span className="font-bold text-slate-800">{submissionSuccess.augmented_images}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-700 font-bold">Total Stored:</span>
                <span className="font-extrabold text-emerald-700">{submissionSuccess.total_images} Images</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Status:</span>
                <span className="font-bold text-emerald-600 uppercase">Completed</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/my-dataset')}
                className="flex-1 py-3 bg-nitte-700 hover:bg-nitte-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                View My Dataset
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-all"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FaceRegistrationPage;
