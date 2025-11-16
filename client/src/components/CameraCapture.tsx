import { useEffect, useRef, useState } from "react";
import { Camera, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { Geolocation } from "@shared/schema";

interface CameraCaptureProps {
  onCapture: (imageData: string, location: Geolocation | null, comment: string) => void;
  comment: string;
  onCommentChange: (comment: string) => void;
}

export function CameraCapture({ onCapture, comment, onCommentChange }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [location, setLocation] = useState<Geolocation | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [cameraError, setCameraError] = useState<string>("");
  const [isCapturing, setIsCapturing] = useState(false);

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

  return (
    <div className="relative w-full h-full flex flex-col bg-black">
      {cameraError ? (
        <Card className="m-4 p-6">
          <p className="text-destructive text-center">{cameraError}</p>
        </Card>
      ) : (
        <>
          <div className="relative flex-1 overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              data-testid="video-camera-preview"
            />

            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
              <div className="flex items-center gap-2 text-white">
                <MapPin className="w-5 h-5" />
                {location ? (
                  <span className="text-sm font-mono" data-testid="text-location">
                    {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                  </span>
                ) : locationError ? (
                  <span className="text-sm text-destructive-foreground">{locationError}</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Getting location...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-black/80 backdrop-blur-md border-t border-white/10">
            <Input
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder="Add a comment (optional)"
              className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
              data-testid="input-comment"
            />
          </div>

          <div className="p-6 bg-black/80 backdrop-blur-md flex justify-center">
            <Button
              size="icon"
              onClick={capturePhoto}
              disabled={isCapturing}
              className="w-16 h-16 rounded-full bg-white hover:bg-white/90 border-4 border-white shadow-lg hover-elevate active-elevate-2"
              data-testid="button-capture"
            >
              <Camera className="w-8 h-8 text-black" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
