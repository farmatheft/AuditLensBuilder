import { useEffect, useRef, useState } from "react";
import { Camera, MapPin, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import type { Geolocation } from "@shared/schema";

interface CameraCaptureProps {
  onCapture: (imageData: string, location: Geolocation | null, comment: string) => void;
  comment: string;
  onCommentChange: (comment: string) => void;
}

export function CameraCapture({ onCapture, comment, onCommentChange }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [location, setLocation] = useState<Geolocation | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [cameraError, setCameraError] = useState<string>("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCommentWarning, setShowCommentWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });

        if (mounted && videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setCameraError("Unable to access camera. Please grant camera permissions.");
      }
    };

    const getLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (mounted) {
              setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              });
            }
          },
          (err) => {
            console.error("Geolocation error:", err);
            setLocationError("Unable to get location");
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setLocationError("Geolocation not supported");
      }
    };

    startCamera();
    getLocation();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCaptureAttempt = () => {
    if (!comment.trim()) {
      setShowCommentWarning(true);
      setPendingAction(() => capturePhoto);
      return;
    }
    capturePhoto();
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    setIsCapturing(true);
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.95);
      onCapture(imageData, location, comment);
    }

    setTimeout(() => setIsCapturing(false), 300);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    const processFile = () => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        onCapture(imageData, location, comment);
      };
      reader.readAsDataURL(file);
    };

    if (!comment.trim()) {
      setShowCommentWarning(true);
      setPendingAction(() => processFile);
      event.target.value = "";
      return;
    }

    processFile();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleWarningOk = () => {
    setShowCommentWarning(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleWarningCancel = () => {
    setShowCommentWarning(false);
    setPendingAction(null);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-slate-950 via-blue-950 to-black safe-area-inset overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>

      {cameraError ? (
        <Card className="m-4 p-6 bg-gradient-to-br from-red-950/90 to-red-900/90 backdrop-blur-xl border-red-500/30 shadow-2xl">
          <p className="text-red-200 text-center font-semibold">{cameraError}</p>
        </Card>
      ) : (
        <>
          {/* Camera/Video Preview */}
          <div className="relative flex-1 overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              data-testid="video-camera-preview"
            />
            
            {/* Vignette Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none"></div>

            {/* Location Overlay - Bottom Left with Premium Design */}
            <div className="absolute bottom-6 left-4 right-4 sm:right-auto sm:max-w-md">
              <div className="relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                
                {/* Main Card */}
                <div className="relative flex items-start gap-3 bg-gradient-to-br from-black/95 via-gray-900/95 to-black/95 backdrop-blur-2xl rounded-3xl p-5 shadow-2xl border border-white/10 hover:border-emerald-400/30 transition-all duration-300">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400 rounded-full blur-md opacity-50 animate-[glow-pulse_2s_ease-in-out_infinite]"></div>
                    <MapPin className="relative w-9 h-9 text-emerald-400 flex-shrink-0 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-semibold text-emerald-400 mb-1 tracking-wider uppercase">Location</span>
                    {location ? (
                      <span className="text-lg sm:text-xl font-mono font-bold text-white leading-tight break-all" data-testid="text-location">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </span>
                    ) : locationError ? (
                      <span className="text-sm text-red-400 font-medium">{locationError}</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                        <span className="text-sm text-white/90 font-medium">Acquiring GPS...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Status Bar */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                  <span className="text-white/90 text-sm font-semibold">LIVE</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5">
                  <Camera className="w-4 h-4 text-white/80" />
                  <span className="text-white/80 text-xs font-medium">HD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comment Input Section */}
          <div className="relative p-4 sm:p-6 bg-gradient-to-t from-black via-gray-950/98 to-gray-900/95 backdrop-blur-2xl border-t border-white/10">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 focus-within:opacity-100 transition-opacity duration-300"></div>
              <Textarea
                value={comment}
                onChange={(e) => onCommentChange(e.target.value)}
                placeholder="✨ Add your thoughts here..."
                className="relative w-full min-h-[80px] sm:min-h-[70px] bg-white/5 border-white/10 text-white text-base sm:text-lg placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:border-emerald-400/50 focus-visible:bg-white/10 resize-none rounded-2xl transition-all duration-300 shadow-inner"
                data-testid="input-comment"
              />
            </div>
          </div>

          {/* Action Buttons with Premium Design */}
          <div className="relative p-4 sm:p-6 pt-2 bg-black/98 backdrop-blur-2xl flex justify-center items-center gap-6 sm:gap-8 pb-safe">
            {/* Upload Button */}
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
              <Button
                size="icon"
                onClick={handleUploadClick}
                className="relative w-16 h-16 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 hover:from-blue-600 hover:via-blue-700 hover:to-cyan-700 active:scale-90 border-2 border-blue-400/50 shadow-2xl shadow-blue-500/40 transition-all duration-300 hover:shadow-blue-500/60"
                data-testid="button-upload"
              >
                <Upload className="w-7 h-7 sm:w-6 sm:h-6 text-white drop-shadow-lg" />
              </Button>
            </div>

            {/* Capture Button - Hero Element */}
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-r from-white via-blue-200 to-white rounded-full blur-2xl opacity-40 animate-[pulse-glow_2s_ease-in-out_infinite]"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-75"></div>
              <Button
                size="icon"
                onClick={handleCaptureAttempt}
                disabled={isCapturing}
                className="relative w-24 h-24 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-white via-gray-50 to-gray-100 hover:from-gray-50 hover:via-white hover:to-gray-50 active:scale-90 border-4 border-white shadow-2xl shadow-white/30 transition-all duration-300 disabled:opacity-50 disabled:scale-100 hover:shadow-white/50"
                data-testid="button-capture"
              >
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
                <Camera className="relative w-12 h-12 sm:w-10 sm:h-10 text-gray-900 drop-shadow-md" />
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-file"
            />
          </div>
        </>
      )}

      {/* Premium Comment Warning Modal */}
      {showCommentWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative max-w-md w-full">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-3xl blur-2xl opacity-30 animate-[gradient-xy_3s_ease_infinite]"></div>
            
            {/* Modal Content */}
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-amber-500/30 rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-300">
              <div className="flex items-start gap-4 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500 rounded-2xl blur-lg opacity-50"></div>
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center border border-amber-500/50">
                    <svg className="w-7 h-7 text-amber-400 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">No Comment Added</h3>
                  <p className="text-gray-300 text-base leading-relaxed">
                    You haven't added a comment. Do you want to continue without a comment?
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleWarningCancel}
                  variant="outline"
                  className="flex-1 h-12 text-base font-bold bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 rounded-2xl transition-all duration-300"
                >
                  Cancel
                </Button>
                <div className="relative flex-1">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-50"></div>
                  <Button
                    onClick={handleWarningOk}
                    className="relative w-full h-12 text-base font-bold bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 text-white rounded-2xl shadow-lg shadow-emerald-500/40 transition-all duration-300 hover:shadow-emerald-500/60"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
