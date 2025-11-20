import { useState, useRef, useEffect } from "react";
import { ArrowRight, Circle, Trash2, Upload, RotateCw, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { LocationPicker } from "@/components/LocationPicker";
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

const STICKER_COLORS = [
  { name: "red", value: "rgb(255, 50, 50)" },
  { name: "yellow", value: "rgb(255, 200, 0)" },
  { name: "green", value: "rgb(0, 255, 100)" },
  { name: "blue", value: "rgb(33, 150, 243)" },
  { name: "cyan", value: "rgb(0, 255, 255)" },
  { name: "gray", value: "rgb(128, 128, 128)" },
  { name: "black", value: "rgb(0, 0, 0)" },
];

export function PhotoEditor({
  imageData,
  location,
  comment: initialComment,
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
  const [currentComment, setCurrentComment] = useState(initialComment);
  const [selectedColor, setSelectedColor] = useState<string>("red");
  const [currentLocation, setCurrentLocation] = useState<Geolocation | null>(location);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
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
  }, [stickers, selectedSticker, currentComment, imageLoaded]);

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

      // Draw stickers only - timestamp and location are now in the bottom info bar
      stickers.forEach((sticker) => {
        ctx.save();
        const centerX = sticker.x + sticker.width / 2;
        const centerY = sticker.y + sticker.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((sticker.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);

        const colorObj = STICKER_COLORS.find(c => c.name === sticker.color) || STICKER_COLORS[0];
        const baseColor = colorObj.value;

        if (sticker.type === "arrow" || sticker.type === "arrow-3d") {
          // Arrow Logic
          const shaftWidth = sticker.height * 0.4;
          const headWidth = sticker.height * 0.8;
          const headLen = sticker.width * 0.4;

          ctx.fillStyle = baseColor;
          ctx.strokeStyle = "white";
          ctx.lineWidth = Math.max(3, sticker.width / 25);

          // Shadow
          ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          ctx.beginPath();
          ctx.moveTo(sticker.x, sticker.y + sticker.height / 2 - shaftWidth / 2);
          ctx.lineTo(sticker.x + sticker.width - headLen, sticker.y + sticker.height / 2 - shaftWidth / 2);
          ctx.lineTo(sticker.x + sticker.width - headLen, sticker.y + sticker.height / 2 - headWidth / 2);
          ctx.lineTo(sticker.x + sticker.width, sticker.y + sticker.height / 2);
          ctx.lineTo(sticker.x + sticker.width - headLen, sticker.y + sticker.height / 2 + headWidth / 2);
          ctx.lineTo(sticker.x + sticker.width - headLen, sticker.y + sticker.height / 2 + shaftWidth / 2);
          ctx.lineTo(sticker.x, sticker.y + sticker.height / 2 + shaftWidth / 2);
          ctx.closePath();

          ctx.fill();
          ctx.shadowColor = "transparent"; // Reset shadow for stroke
          ctx.stroke();

          // 3D Highlight effect
          if (sticker.type === "arrow-3d") {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = shaftWidth / 3;
            ctx.beginPath();
            ctx.moveTo(sticker.x + 5, sticker.y + sticker.height / 2 - shaftWidth / 4);
            ctx.lineTo(sticker.x + sticker.width - headLen - 5, sticker.y + sticker.height / 2 - shaftWidth / 4);
            ctx.stroke();
          }

        } else if (sticker.type === "circle" || sticker.type === "circle-filled") {
          ctx.strokeStyle = "white";
          ctx.lineWidth = Math.max(3, sticker.width / 25);

          // Shadow
          ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

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

          if (sticker.type === "circle-filled") {
            ctx.fillStyle = baseColor.replace("rgb", "rgba").replace(")", ", 0.7)");
            ctx.fill();
            ctx.strokeStyle = baseColor; // Colored border for filled
            ctx.stroke();
            // White outer ring
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
            ctx.strokeStyle = "white";
            ctx.stroke();
          } else {
            ctx.strokeStyle = baseColor;
            ctx.stroke();
            // White outer ring
            ctx.beginPath();
            ctx.ellipse(
              sticker.x + sticker.width / 2,
              sticker.y + sticker.height / 2,
              sticker.width / 2 + 2,
              sticker.height / 2 + 2,
              0,
              0,
              2 * Math.PI
            );
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          ctx.shadowColor = "transparent";
        }

        if (selectedSticker === sticker.id) {
          ctx.strokeStyle = "rgba(33, 150, 243, 0.8)";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(sticker.x - 5, sticker.y - 5, sticker.width + 10, sticker.height + 10);
          ctx.setLineDash([]);
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
      color: selectedColor as any,
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

  const resizeSelected = (direction: "up" | "down") => {
    if (!selectedSticker) return;
    setStickers(
      stickers.map((s) => {
        if (s.id !== selectedSticker) return s;
        const factor = direction === "up" ? 1.1 : 0.9;
        return { ...s, width: s.width * factor, height: s.height * factor };
      })
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
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error("Canvas not available");
      }

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob from canvas"));
          }
        }, "image/jpeg", 0.95);
      });

      const formData = new FormData();
      formData.append("photo", blob, `photo-${Date.now()}.jpg`);
      formData.append("project_id", projectId);
      formData.append("project_title", projectName);
      formData.append("comment", currentComment);
      formData.append("captured_at", capturedAt);
      if (currentLocation) {
        formData.append("latitude", currentLocation.latitude.toString());
        formData.append("longitude", currentLocation.longitude.toString());
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
          console.error("Upload failed with status:", xhr.status, xhr.responseText);
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
      alert("Upload failed. Please try again.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-row bg-black safe-area-inset overflow-hidden">
      {isUploading && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="text-center">
            <Progress value={uploadProgress} className="w-64 h-2 bg-gray-800 mb-4" data-testid="progress-upload" />
            <p className="text-white text-lg">{uploadProgress}%</p>
          </div>
        </div>
      )}

      {/* Main Content Area (Canvas + Info) */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-black">
        {/* Cancel Button - Absolute Top Left */}
        <Button
          size="icon"
          onClick={onCancel}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 border border-red-500/50 text-red-500"
          data-testid="button-cancel"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>

        {/* Canvas Container - Centered & Aspect Ratio Preserved */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
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
            className="max-w-full max-h-full object-contain shadow-2xl"
            data-testid="canvas-editor"
          />
        </div>

        {/* Info Bars (Bottom of Main Area) */}
        <div className="w-full bg-black/80 backdrop-blur-sm border-t border-gray-800">
          {/* Location & Timestamp Row */}
          <div className="flex justify-between items-center px-4 py-2 text-xs text-gray-400 font-mono border-b border-gray-800/50">
            <button
              onClick={() => setShowLocationPicker(true)}
              className="hover:text-white hover:bg-gray-800/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors flex items-center gap-1"
            >
              {currentLocation ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}` : "No location - click to set"}
            </button>
            <div>
              {new Date(capturedAt).toLocaleString('en-CA', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
              }).replace(',', '')}
            </div>
          </div>

          {/* Comment Input */}
          <div className="px-4 py-3 flex items-center gap-3">
            <span className="text-sm font-bold text-white whitespace-nowrap">{projectName}</span>
            <Input
              value={currentComment}
              onChange={(e) => setCurrentComment(e.target.value)}
              className="bg-gray-900/50 border-gray-700 text-white h-9 text-sm"
              placeholder="Add comment..."
            />
          </div>
        </div>
      </div>

      {/* Right Sidebar - Vertical Toolbar */}
      <div className="w-20 flex flex-col items-center bg-gray-900 border-l border-gray-800 py-4 gap-6 z-20 overflow-y-auto no-scrollbar">

        {/* Colors */}
        <div className="flex flex-col gap-3 items-center">
          <Label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Color</Label>
          {STICKER_COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => {
                setSelectedColor(color.name);
                if (selectedSticker) {
                  setStickers(stickers.map(s => s.id === selectedSticker ? { ...s, color: color.name as any } : s));
                }
              }}
              className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color.name ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-transparent hover:scale-105'}`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>

        <div className="w-full h-px bg-gray-800" />

        {/* Tools */}
        <div className="flex flex-col gap-4 items-center w-full px-2">
          <Label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Tools</Label>

          <Button
            variant="ghost"
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
                color: selectedColor as any,
              };
              setStickers([...stickers, newSticker]);
              setSelectedSticker(newSticker.id);
            }}
            className="text-gray-400 hover:text-white hover:bg-gray-800 w-10 h-10 rounded-xl"
            title="Add Circle"
          >
            <Circle className="w-6 h-6 fill-current" style={{ color: STICKER_COLORS.find(c => c.name === selectedColor)?.value }} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const newSticker: Sticker = {
                id: `sticker-${Date.now()}`,
                type: "arrow-3d",
                x: 150,
                y: 300,
                width: 100,
                height: 100,
                rotation: 0,
                color: selectedColor as any,
              };
              setStickers([...stickers, newSticker]);
              setSelectedSticker(newSticker.id);
            }}
            className="text-gray-400 hover:text-white hover:bg-gray-800 w-10 h-10 rounded-xl"
            title="Add Arrow"
          >
            <ArrowRight className="w-6 h-6" style={{ color: STICKER_COLORS.find(c => c.name === selectedColor)?.value }} />
          </Button>
        </div>

        {/* Context Actions (Only when sticker selected) */}
        {selectedSticker && (
          <>
            <div className="w-full h-px bg-gray-800" />
            <div className="flex flex-col gap-2 items-center w-full px-2 animate-in fade-in slide-in-from-right-4 duration-200">
              <Button
                variant="ghost"
                size="icon"
                onClick={rotateSelected}
                className="text-blue-400 hover:text-blue-300 hover:bg-gray-800 w-10 h-10"
                title="Rotate"
              >
                <RotateCw className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => resizeSelected("up")}
                className="text-blue-400 hover:text-blue-300 hover:bg-gray-800 w-10 h-10"
                title="Larger"
              >
                <Maximize2 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => resizeSelected("down")}
                className="text-blue-400 hover:text-blue-300 hover:bg-gray-800 w-10 h-10"
                title="Smaller"
              >
                <Minimize2 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={deleteSelected}
                className="text-red-400 hover:text-red-300 hover:bg-gray-800 w-10 h-10"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </>
        )}

        <div className="flex-1" />

        {/* Bottom Actions */}
        <div className="flex flex-col gap-4 items-center w-full pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-400 hover:text-white text-xs"
          >
            Back
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            size="icon"
            className="w-12 h-12 rounded-full bg-white hover:bg-gray-200 text-black shadow-lg shadow-white/10"
            title="Publish"
          >
            <Upload className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          initialLocation={currentLocation}
          onSave={(newLocation) => {
            setCurrentLocation(newLocation);
            setShowLocationPicker(false);
          }}
          onCancel={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  );
}
