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
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-gray-900 to-black safe-area-inset">
      {cameraError ? (
        <Card className="m-4 p-6">
          <p className="text-destructive text-center">{cameraError}</p>
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

            {/* Location Overlay - Bottom Left */}
            <div className="absolute bottom-4 left-4 flex items-start gap-2 bg-gradient-to-r from-black/90 to-black/80 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/10 max-w-[calc(100%-2rem)]">
              <MapPin className="w-8 h-8 text-emerald-400 flex-shrink-0 mt-0.5 drop-shadow-lg" />
              <div className="flex flex-col min-w-0">
                {location ? (
                  <span className="text-xl sm:text-2xl font-mono font-bold text-white leading-tight break-all" data-testid="text-location">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </span>
                ) : locationError ? (
                  <span className="text-sm text-red-400">{locationError}</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                    <span className="text-sm text-white/90">Getting location...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comment Input */}
          <div className="p-4 sm:p-6 bg-gradient-to-t from-black via-black/95 to-black/90 backdrop-blur-xl border-t border-white/10">
            <Textarea
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder="Add a comment (optional)"
              className="w-full min-h-[80px] sm:min-h-[70px] bg-white/10 border-white/20 text-white text-base sm:text-lg placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:border-emerald-400/50 resize-none rounded-xl transition-all"
              data-testid="input-comment"
            />
          </div>

          {/* Action Buttons */}
          <div className="p-4 sm:p-6 pt-2 bg-black/95 backdrop-blur-xl flex justify-center items-center gap-6 sm:gap-8 pb-safe">
            <Button
              size="icon"
              onClick={handleUploadClick}
              className="w-16 h-16 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-95 border-2 border-blue-400/50 shadow-xl shadow-blue-500/30 transition-all"
              data-testid="button-upload"
            >
              <Upload className="w-7 h-7 sm:w-6 sm:h-6 text-white drop-shadow-md" />
            </Button>
            <Button
              size="icon"
              onClick={handleCaptureAttempt}
              disabled={isCapturing}
              className="w-20 h-20 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-white to-gray-100 hover:from-gray-100 hover:to-gray-200 active:scale-95 border-4 border-white shadow-2xl shadow-white/20 transition-all disabled:opacity-50 disabled:scale-100"
              data-testid="button-capture"
            >
              <Camera className="w-10 h-10 sm:w-9 sm:h-9 text-gray-900 drop-shadow-sm" />
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
        </>
      )}

      {/* Comment Warning Modal */}
      {showCommentWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">No Comment Added</h3>
                <p className="text-white/80 text-base leading-relaxed">
                  You haven't added a comment. Do you want to continue without a comment?
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleWarningCancel}
                variant="outline"
                className="flex-1 h-12 text-base font-semibold bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleWarningOk}
                className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/30"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
