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
  onUploadComplete: () => void;
  onCancel: () => void;
}

export function PhotoEditor({
  imageData,
  location,
  comment,
  projectId,
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
  const [uploadTimestamp] = useState(new Date());

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
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-slate-950 via-indigo-950 to-black safe-area-inset overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(168,85,247,0.15),transparent_50%)]"></div>
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between p-3 sm:p-4 border-b border-white/10 bg-black/40 backdrop-blur-2xl shrink-0 shadow-2xl z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Edit Photo
          </h2>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCancel} 
            data-testid="button-cancel"
            className="rounded-xl font-bold bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
          >
            Cancel
          </Button>
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-50"></div>
            <Button 
              onClick={handleUpload} 
              disabled={isUploading} 
              size="sm" 
              data-testid="button-upload"
              className="relative rounded-xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 hover:from-blue-700 hover:via-blue-800 hover:to-purple-800 shadow-lg shadow-blue-500/40 transition-all duration-300"
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4 animate-pulse" />
                  <span className="hidden sm:inline">Uploading...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload</span>
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {isUploading && (
        <div className="relative px-3 sm:px-4 pt-3 pb-2 shrink-0 bg-black/20 backdrop-blur-sm z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-md opacity-30"></div>
            <Progress value={uploadProgress} className="relative w-full h-3 bg-white/10" data-testid="progress-upload" />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-white/80 font-semibold">Uploading your masterpiece...</p>
            <p className="text-sm font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{uploadProgress}%</p>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div className="relative flex-1 overflow-auto p-2 sm:p-4 z-10">
        <div ref={containerRef} className="max-w-4xl mx-auto">
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
            
            {/* Canvas Container */}
            <div className="relative bg-gradient-to-br from-white/5 to-white/10 p-1 rounded-3xl backdrop-blur-sm border border-white/20">
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
                className="w-full rounded-2xl cursor-crosshair shadow-2xl touch-none bg-white"
                data-testid="canvas-editor"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <Card className="relative m-2 sm:m-4 p-4 sm:p-5 space-y-4 shrink-0 max-h-[40vh] overflow-y-auto rounded-3xl shadow-2xl border border-white/20 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-2xl z-10">
        <div>
          <Label className="text-sm font-bold mb-3 block text-white/90 tracking-wide uppercase">Add Annotations</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button
              variant={placingSticker === "arrow" ? "default" : "outline"}
              size="sm"
              onClick={() => setPlacingSticker("arrow")}
              data-testid="button-add-arrow"
              className="rounded-lg font-bold h-10 bg-amber-500/20 border-amber-500/30 hover:bg-amber-500/30 text-white text-xs"
            >
              <ArrowRight className="w-4 h-4 mr-1" />
              Arrow
            </Button>
            <Button
              variant={placingSticker === "arrow-3d" ? "default" : "outline"}
              size="sm"
              onClick={() => setPlacingSticker("arrow-3d")}
              data-testid="button-add-arrow-3d"
              className="rounded-lg font-bold h-10 bg-orange-500/20 border-orange-500/30 hover:bg-orange-500/30 text-white text-xs"
            >
              <ArrowRight className="w-4 h-4 mr-1" />
              3D Arrow
            </Button>
            <Button
              variant={placingSticker === "circle" ? "default" : "outline"}
              size="sm"
              onClick={() => setPlacingSticker("circle")}
              data-testid="button-add-circle"
              className="rounded-lg font-bold h-10 bg-red-500/20 border-red-500/30 hover:bg-red-500/30 text-white text-xs"
            >
              <Circle className="w-4 h-4 mr-1" />
              Circle
            </Button>
            <Button
              variant={placingSticker === "circle-filled" ? "default" : "outline"}
              size="sm"
              onClick={() => setPlacingSticker("circle-filled")}
              data-testid="button-add-circle-filled"
              className="rounded-lg font-bold h-10 bg-pink-500/20 border-pink-500/30 hover:bg-pink-500/30 text-white text-xs"
            >
              <Circle className="w-4 h-4 mr-1 fill-current" />
              Filled
            </Button>
            <Button
              variant={placingSticker === "crosshair" ? "default" : "outline"}
              size="sm"
              onClick={() => setPlacingSticker("crosshair")}
              data-testid="button-add-crosshair"
              className="rounded-lg font-bold h-10 bg-green-500/20 border-green-500/30 hover:bg-green-500/30 text-white text-xs"
            >
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
              Target
            </Button>
          </div>
        </div>

        {selectedSticker && (
          <div className="animate-in slide-in-from-bottom duration-300">
            <Label className="text-sm font-bold mb-3 block text-white/90 tracking-wide uppercase">Transform Selected</Label>
            <div className="flex gap-3 flex-wrap">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={rotateSelected} 
                data-testid="button-rotate" 
                className="flex-1 sm:flex-none rounded-2xl font-bold h-12 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-white transition-all duration-300"
              >
                <RotateCw className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline">Rotate</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resizeSelected} 
                data-testid="button-resize" 
                className="flex-1 sm:flex-none rounded-2xl font-bold h-12 bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20 text-white transition-all duration-300"
              >
                <Maximize2 className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline">Resize</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deleteSelected}
                className="flex-1 sm:flex-none rounded-2xl font-bold h-12 bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-300"
                data-testid="button-delete-sticker"
              >
                <Trash2 className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          </div>
        )}

        <div>
          <Label className="text-sm font-bold mb-3 block text-white/90 tracking-wide uppercase">Comment Position</Label>
          <RadioGroup value={commentPosition} onValueChange={(v) => setCommentPosition(v as "top" | "bottom")}>
            <div className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer">
              <RadioGroupItem value="top" id="top" data-testid="radio-comment-top" className="border-white/30" />
              <Label htmlFor="top" className="cursor-pointer font-semibold text-white/90">Top</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer">
              <RadioGroupItem value="bottom" id="bottom" data-testid="radio-comment-bottom" className="border-white/30" />
              <Label htmlFor="bottom" className="cursor-pointer font-semibold text-white/90">Bottom</Label>
            </div>
          </RadioGroup>
        </div>
      </Card>
    </div>
  );
}
