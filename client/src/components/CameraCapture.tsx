import { useEffect, useRef, useState } from "react";
import { Camera, MapPin, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { LocationPicker } from "@/components/LocationPicker";
import type { Geolocation } from "@shared/schema";

interface CameraCaptureProps {
  onCapture: (imageData: string, location: Geolocation | null, comment: string, capturedAt: string) => void;
  comment: string;
  onCommentChange: (comment: string) => void;
  projectName: string;
}

export function CameraCapture({ onCapture, comment, onCommentChange, projectName }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [location, setLocation] = useState<Geolocation | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [cameraError, setCameraError] = useState<string>("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCommentWarning, setShowCommentWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

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
          setCameraError("");
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setCameraError("Camera not available");
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
      const capturedAt = new Date().toISOString();
      onCapture(imageData, location, comment, capturedAt);
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
        const capturedAt = new Date().toISOString();
        onCapture(imageData, location, comment, capturedAt);
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
    <div className="fixed inset-0 flex flex-col bg-black safe-area-inset overflow-hidden">
      {/* Camera/Video Preview - Fixed size */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center bg-black">
        <div className="relative w-full max-w-[414px] h-full max-h-[736px] bg-black">
          {cameraError ? (
            <div className="absolute inset-0 bg-black flex items-center justify-center">
              <div className="text-center p-6">
                <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-sm">{cameraError}</p>
                <p className="text-gray-500 text-xs mt-2">You can still upload from gallery</p>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              data-testid="video-camera-preview"
            />
          )}
        </div>
      </div>

      {/* Location Bar - Full width of video */}
      <div className="flex justify-center bg-black">
        <div className="w-full max-w-[414px] bg-black text-white px-4 py-3">
          <button
            onClick={() => setShowLocationPicker(true)}
            className="w-full text-left hover:bg-gray-900 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors"
          >
            {location ? (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-lg font-mono" data-testid="text-location">
                  {location.latitude.toFixed(4)},{location.longitude.toFixed(4)}
                </span>
              </div>
            ) : locationError ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>{locationError}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Acquiring GPS...</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Comment Input Section */}
      <div className="flex justify-center bg-black">
        <div className="w-full max-w-[414px] px-4 py-3">
          <input
            type="text"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Enter comment..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg text-white text-base px-4 py-3 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600"
            data-testid="input-comment"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center bg-black pb-6">
        <div className="w-full max-w-[414px] px-4 flex justify-between items-center">
          {/* Back Button - Left */}
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="text-white hover:bg-gray-900"
            data-testid="button-back"
          >
            Back
          </Button>

          {/* Center Buttons */}
          <div className="flex items-center gap-4">
            {/* Capture Button - Center */}
            <Button
              size="icon"
              onClick={handleCaptureAttempt}
              disabled={isCapturing || !!cameraError}
              className="w-20 h-20 rounded-full bg-white hover:bg-gray-100 active:scale-90 transition-all disabled:opacity-50 disabled:bg-gray-400"
              data-testid="button-capture"
            >
              <Camera className="w-10 h-10 text-gray-900" />
            </Button>

            {/* Upload Button - Right of center */}
            <Button
              size="icon"
              onClick={handleUploadClick}
              className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 active:scale-90 transition-all"
              data-testid="button-upload"
            >
              <Upload className="w-6 h-6 text-white" />
            </Button>
          </div>

          {/* Publish Button - Right */}
          <Button
            variant="ghost"
            className="text-white hover:bg-gray-900 invisible"
          >
            Publish
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-file"
          />
        </div>
      </div>

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

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          initialLocation={location}
          onSave={(newLocation) => {
            setLocation(newLocation);
            setLocationError("");
            setShowLocationPicker(false);
          }}
          onCancel={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  );
}
