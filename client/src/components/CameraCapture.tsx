import { useEffect, useRef, useState } from "react";
import { Camera, MapPin, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { LocationPicker } from "@/components/LocationPicker";
import type { Geolocation } from "@/types/schema";
import { PackagingSelector } from "@/components/PackagingSelector";
import type { Packaging } from "@/types/schema";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/i18n";

interface CameraCaptureProps {
  onCapture: (imageData: string, location: Geolocation | null, comment: string, capturedAt: string, packagingId: string) => void;
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
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedPackagingId, setSelectedPackagingId] = useState<string>(" ");
  const { t } = useTranslation();

  const { data: packagings } = useQuery<Packaging[]>({
    queryKey: ["/api/packagings"],
  });

  useEffect(() => {
    let mounted = true;
    let localStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });

        if (!mounted) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        localStream = mediaStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        
        setStream(mediaStream);
        setCameraError("");
      } catch (err) {
        console.error("Camera access error:", err);
        if (mounted) {
          setCameraError(t('camera.cameraNotAvailable'));
        }
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
            if (mounted) {
              setLocationError("Unable to get location");
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        if (mounted) {
          setLocationError("Geolocation not supported");
        }
      }
    };

    startCamera();
    getLocation();

    return () => {
      mounted = false;
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCaptureAttempt = () => {
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
      onCapture(imageData, location, comment, capturedAt, selectedPackagingId);
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
        onCapture(imageData, location, comment, capturedAt, selectedPackagingId);
      };
      reader.readAsDataURL(file);
    };

    processFile();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
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
                <p className="text-gray-500 text-xs mt-2">{t('camera.uploadFromGallery')}</p>
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
                <span className="text-sm">{t('camera.acquiringGPS')}</span>
              </div>
            )}
          </button>
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
            {t('camera.back')}
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
            {t('photoEditor.publish')}
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
