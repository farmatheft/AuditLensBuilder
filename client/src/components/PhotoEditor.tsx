import { useState, useRef, useEffect } from "react";
import { ArrowRight, Circle, Trash2, Upload, RotateCw, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import type { Sticker, Geolocation } from "@shared/schema";

interface PhotoEditorProps {
  imageData: string;
  location: Geolocation | null;
  comment: string;
  projectId: string;
  projectName: string;
  capturedAt: string;
  onUploadComplete: () => void;
  onCancel: () => void;
}

export function PhotoEditor({
  imageData,
  location,
  comment,
  projectId,
  projectName,
  capturedAt,
  onUploadComplete,
  onCancel,
}: PhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [placingSticker, setPlacingSticker] = useState<"arrow" | "circle" | "circle-filled" | "crosshair" | "arrow-3d" | null>(null);
  const [commentPosition, setCommentPosition] = useState<"top" | "bottom">("top");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageLoaded(true);
      redrawCanvas();
    };
    img.src = imageData;
  }, [imageData]);

  useEffect(() => {
    if (imageLoaded) {
      redrawCanvas();
    }
  }, [stickers, selectedSticker, commentPosition, comment, imageLoaded]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (comment) {
        const fontSize = Math.max(24, img.height / 30);
        ctx.font = `${fontSize}px Roboto, sans-serif`;
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        const padding = fontSize * 0.5;
        const y = commentPosition === "top" ? padding : img.height - fontSize - padding;

        ctx.fillRect(0, y - fontSize - padding / 2, img.width, fontSize + padding);
        ctx.fillStyle = "white";
        ctx.fillText(comment, padding, y);
      }

      // Draw timestamp at bottom right
      const timestamp = uploadTimestamp.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const timestampFontSize = Math.max(18, img.height / 45);
      ctx.font = `bold ${timestampFontSize}px Roboto, sans-serif`;
      const timestampMetrics = ctx.measureText(timestamp);
      const timestampPadding = timestampFontSize * 0.6;
      const timestampY = img.height - timestampPadding * 1.2;
      const timestampX = img.width - timestampMetrics.width - timestampPadding * 2;

      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.fillRect(
        timestampX - timestampPadding,
        timestampY - timestampFontSize - timestampPadding / 2,
        timestampMetrics.width + timestampPadding * 2,
        timestampFontSize + timestampPadding * 1.2
      );
      ctx.fillStyle = "white";
      ctx.fillText(timestamp, timestampX, timestampY - timestampPadding / 2);

      // Draw location at bottom left if available
      if (location) {
        const locationText = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
        const locationFontSize = Math.max(18, img.height / 45);
        ctx.font = `bold ${locationFontSize}px Roboto, sans-serif`;
        const locationMetrics = ctx.measureText(locationText);
        const locationPadding = locationFontSize * 0.6;
        const locationY = img.height - locationPadding * 1.2;
        const locationX = locationPadding * 2;
        const iconSize = locationFontSize * 1.2;

        // Draw background
        ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
        ctx.fillRect(
          locationPadding,
          locationY - locationFontSize - locationPadding / 2,
          locationMetrics.width + iconSize + locationPadding * 3,
          locationFontSize + locationPadding * 1.2
        );

        // Draw map pin icon
        ctx.fillStyle = "#10b981"; // emerald-500
        ctx.beginPath();
        const pinX = locationPadding + iconSize / 2;
        const pinY = locationY - locationFontSize / 2;
        ctx.arc(pinX, pinY - iconSize * 0.15, iconSize * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(pinX, pinY + iconSize * 0.15);
        ctx.lineTo(pinX - iconSize * 0.15, pinY - iconSize * 0.05);
        ctx.lineTo(pinX + iconSize * 0.15, pinY - iconSize * 0.05);
        ctx.closePath();
        ctx.fill();

        // Draw location text
        ctx.fillStyle = "white";
        ctx.fillText(locationText, locationX + iconSize + locationPadding, locationY - locationPadding / 2);
      }

      stickers.forEach((sticker) => {
        ctx.save();
        const centerX = sticker.x + sticker.width / 2;
        const centerY = sticker.y + sticker.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((sticker.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);

        if (sticker.type === "arrow") {
          ctx.strokeStyle = "rgb(255, 200, 0)";
          ctx.fillStyle = "rgb(255, 200, 0)";
          ctx.lineWidth = Math.max(4, sticker.width / 20);

          ctx.beginPath();
          ctx.moveTo(sticker.x, sticker.y + sticker.height / 2);
          ctx.lineTo(sticker.x + sticker.width * 0.7, sticker.y + sticker.height / 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(sticker.x + sticker.width, sticker.y + sticker.height / 2);
          ctx.lineTo(sticker.x + sticker.width * 0.7, sticker.y + sticker.height * 0.2);
          ctx.lineTo(sticker.x + sticker.width * 0.7, sticker.y + sticker.height * 0.8);
          ctx.closePath();
          ctx.fill();
        } else if (sticker.type === "arrow-3d") {
          const gradient = ctx.createLinearGradient(sticker.x, sticker.y, sticker.x + sticker.width, sticker.y + sticker.height);
          gradient.addColorStop(0, "rgb(255, 200, 0)");
          gradient.addColorStop(0.5, "rgb(255, 150, 0)");
          gradient.addColorStop(1, "rgb(200, 100, 0)");
          
          ctx.strokeStyle = gradient;
          ctx.fillStyle = gradient;
          ctx.lineWidth = Math.max(5, sticker.width / 18);

          ctx.beginPath();
          ctx.moveTo(sticker.x, sticker.y + sticker.height / 2);
          ctx.lineTo(sticker.x + sticker.width * 0.65, sticker.y + sticker.height / 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(sticker.x + sticker.width, sticker.y + sticker.height / 2);
          ctx.lineTo(sticker.x + sticker.width * 0.65, sticker.y + sticker.height * 0.15);
          ctx.lineTo(sticker.x + sticker.width * 0.65, sticker.y + sticker.height * 0.85);
          ctx.closePath();
          ctx.fill();
        } else if (sticker.type === "circle") {
          ctx.strokeStyle = "rgb(255, 50, 50)";
          ctx.lineWidth = Math.max(4, sticker.width / 15);
          ctx.beginPath();
          ctx.ellipse(
            sticker.x + sticker.width / 2,
            sticker.y + sticker.height / 2,
            sticker.width / 2,
            sticker.height / 2,
            0,
            0,
            2 * Math.PI
          );
          ctx.stroke();
        } else if (sticker.type === "circle-filled") {
          ctx.fillStyle = "rgba(255, 50, 50, 0.4)";
          ctx.strokeStyle = "rgb(255, 50, 50)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(
            sticker.x + sticker.width / 2,
            sticker.y + sticker.height / 2,
            sticker.width / 2,
            sticker.height / 2,
            0,
            0,
            2 * Math.PI
          );
          ctx.fill();
          ctx.stroke();
        } else if (sticker.type === "crosshair") {
          ctx.strokeStyle = "rgb(0, 255, 100)";
          ctx.lineWidth = Math.max(3, sticker.width / 25);
          
          const cx = sticker.x + sticker.width / 2;
          const cy = sticker.y + sticker.height / 2;
          
          // Outer circle
          ctx.beginPath();
          ctx.arc(cx, cy, sticker.width / 2, 0, 2 * Math.PI);
          ctx.stroke();
          
          // Vertical line
          ctx.beginPath();
          ctx.moveTo(cx, sticker.y);
          ctx.lineTo(cx, sticker.y + sticker.height);
          ctx.stroke();
          
          // Horizontal line
          ctx.beginPath();
          ctx.moveTo(sticker.x, cy);
          ctx.lineTo(sticker.x + sticker.width, cy);
          ctx.stroke();
          
          // Inner circle
          ctx.beginPath();
          ctx.arc(cx, cy, sticker.width / 8, 0, 2 * Math.PI);
          ctx.stroke();
        }

        if (selectedSticker === sticker.id) {
          ctx.strokeStyle = "rgba(33, 150, 243, 0.8)";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(sticker.x, sticker.y, sticker.width, sticker.height);
          ctx.setLineDash([]);

          const handleSize = 12;
          ctx.fillStyle = "rgba(33, 150, 243, 0.9)";
          ctx.fillRect(sticker.x + sticker.width - handleSize / 2, sticker.y + sticker.height - handleSize / 2, handleSize, handleSize);
        }

        ctx.restore();
      });
    };
    img.src = imageData;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!placingSticker || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const newSticker: Sticker = {
      id: `sticker-${Date.now()}`,
      type: placingSticker,
      x: x - 50,
      y: y - 50,
      width: 100,
      height: 100,
      rotation: 0,
    };

    setStickers([...stickers, newSticker]);
    setSelectedSticker(newSticker.id);
    setPlacingSticker(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (placingSticker || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const clickedSticker = stickers.find((s) => {
      return x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height;
    });

    if (clickedSticker) {
      setSelectedSticker(clickedSticker.id);
      setIsDragging(true);
      setDragStart({ x: x - clickedSticker.x, y: y - clickedSticker.y });
    } else {
      setSelectedSticker(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedSticker || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setStickers(
      stickers.map((s) =>
        s.id === selectedSticker ? { ...s, x: x - dragStart.x, y: y - dragStart.y } : s
      )
    );
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const rotateSelected = () => {
    if (!selectedSticker) return;
    setStickers(
      stickers.map((s) => (s.id === selectedSticker ? { ...s, rotation: (s.rotation + 45) % 360 } : s))
    );
  };

  const resizeSelected = () => {
    if (!selectedSticker) return;
    setStickers(
      stickers.map((s) =>
        s.id === selectedSticker
          ? { ...s, width: s.width * 1.2, height: s.height * 1.2 }
          : s
      )
    );
  };

  const deleteSelected = () => {
    if (!selectedSticker) return;
    setStickers(stickers.filter((s) => s.id !== selectedSticker));
    setSelectedSticker(null);
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await fetch(imageData);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("photo", blob, `photo-${Date.now()}.jpg`);
      formData.append("projectId", projectId);
      formData.append("comment", comment);
      formData.append("commentPosition", commentPosition);
      formData.append("capturedAt", capturedAt);
      if (location) {
        formData.append("latitude", location.latitude.toString());
        formData.append("longitude", location.longitude.toString());
      }
      formData.append("stickers", JSON.stringify(stickers));

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 201) {
          onUploadComplete();
        } else {
          throw new Error("Upload failed");
        }
      });

      xhr.addEventListener("error", () => {
        throw new Error("Upload failed");
      });

      xhr.open("POST", "/api/photos");
      xhr.send(formData);
    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-black safe-area-inset overflow-hidden">
      {isUploading && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="text-center">
            <Progress value={uploadProgress} className="w-64 h-2 bg-gray-800 mb-4" data-testid="progress-upload" />
            <p className="text-white text-lg">{uploadProgress}%</p>
          </div>
        </div>
      )}

      {/* Canvas Area - Fixed size with overlay buttons */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center bg-black">
        <div ref={containerRef} className="relative w-full max-w-[414px] h-full max-h-[736px]">
          {/* Cancel Button - Top Left */}
          <Button
            size="icon"
            onClick={onCancel}
            className="absolute top-4 left-4 z-10 w-12 h-12 rounded-full bg-black/80 hover:bg-black border-2 border-red-500"
            data-testid="button-cancel"
          >
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>

          {/* Add Sticker Button - Bottom Left */}
          <Button
            size="icon"
            onClick={() => {
              const newSticker: Sticker = {
                id: `sticker-${Date.now()}`,
                type: "circle-filled",
                x: 150,
                y: 300,
                width: 100,
                height: 100,
                rotation: 0,
              };
              setStickers([...stickers, newSticker]);
              setSelectedSticker(newSticker.id);
            }}
            className="absolute bottom-4 left-4 z-10 w-12 h-12 rounded-full bg-yellow-400 hover:bg-yellow-500"
            data-testid="button-add-sticker"
          >
            <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </Button>

          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY,
              });
              handleCanvasMouseDown(mouseEvent as any);
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY,
              });
              handleCanvasMouseMove(mouseEvent as any);
            }}
            onTouchEnd={() => handleCanvasMouseUp()}
            className="w-full h-full cursor-crosshair touch-none bg-white"
            data-testid="canvas-editor"
          />
        </div>
      </div>

      {/* Location Bar */}
      <div className="flex justify-center bg-black">
        <div className="w-full max-w-[414px] bg-black text-white px-4 py-3">
          {location ? (
            <div className="text-lg font-mono" data-testid="text-location">
              {location.latitude.toFixed(4)},{location.longitude.toFixed(4)}
            </div>
          ) : (
            <div className="text-sm text-gray-400">No location</div>
          )}
        </div>
      </div>

      {/* Comment Bar */}
      <div className="flex justify-center bg-black">
        <div className="w-full max-w-[414px] bg-black text-white px-4 py-3">
          <div className="text-base">
            <span className="font-bold">{projectName}</span> - {comment || "custom comment"}
          </div>
        </div>
      </div>

      {/* Timestamp Bar */}
      <div className="flex justify-center bg-black pb-4">
        <div className="w-full max-w-[414px] bg-black text-white px-4 text-right">
          <div className="text-sm font-mono">
            {new Date(capturedAt).toLocaleString('en-CA', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }).replace(',', '')}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center bg-black pb-6">
        <div className="w-full max-w-[414px] px-4 flex justify-between items-center">
          {/* Back Button - Left */}
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-white hover:bg-gray-900"
            data-testid="button-back"
          >
            Back
          </Button>

          {/* Publish Button - Right */}
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="text-white hover:bg-gray-900"
            data-testid="button-upload"
          >
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
