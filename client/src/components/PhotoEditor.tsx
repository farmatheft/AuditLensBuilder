import { useState, useRef, useEffect } from "react";
import { ArrowRight, Circle, Trash2, Upload, RotateCw, Maximize2, MapPin } from "lucide-react";
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
  const [placingSticker, setPlacingSticker] = useState<"arrow" | "circle" | null>(null);
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
        const textMetrics = ctx.measureText(comment);
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
          ctx.strokeStyle = "rgba(255, 193, 7, 0.9)";
          ctx.fillStyle = "rgba(255, 193, 7, 0.9)";
          ctx.lineWidth = Math.max(3, sticker.width / 20);

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
        } else if (sticker.type === "circle") {
          ctx.strokeStyle = "rgba(244, 67, 54, 0.9)";
          ctx.lineWidth = Math.max(3, sticker.width / 15);
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
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black safe-area-inset">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shrink-0 shadow-sm">
        <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Edit Photo</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCancel} 
            data-testid="button-cancel"
            className="rounded-xl font-semibold"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={isUploading} 
            size="sm" 
            data-testid="button-upload"
            className="rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30"
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

      {isUploading && (
        <div className="px-3 sm:px-4 pt-2 shrink-0">
          <Progress value={uploadProgress} className="w-full h-2" data-testid="progress-upload" />
          <p className="text-center text-sm text-muted-foreground mt-2">{uploadProgress}%</p>
        </div>
      )}

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto p-2 sm:p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black">
        <div ref={containerRef} className="max-w-4xl mx-auto">
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
            className="w-full border-2 border-gray-300 dark:border-gray-700 rounded-2xl cursor-crosshair shadow-2xl touch-none bg-white"
            data-testid="canvas-editor"
          />
        </div>
      </div>

      {/* Controls */}
      <Card className="m-2 sm:m-4 p-3 sm:p-4 space-y-3 sm:space-y-4 shrink-0 max-h-[40vh] overflow-y-auto rounded-2xl shadow-xl border-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl">
        <div>
          <Label className="text-sm font-bold mb-3 block text-gray-700 dark:text-gray-300">Add Annotations</Label>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={placingSticker === "arrow" ? "default" : "outline"}
              size="sm"
              onClick={() => setPlacingSticker("arrow")}
              data-testid="button-add-arrow"
              className="flex-1 sm:flex-none rounded-xl font-semibold h-11"
            >
              <ArrowRight className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Arrow</span>
            </Button>
            <Button
              variant={placingSticker === "circle" ? "default" : "outline"}
              size="sm"
              onClick={() => setPlacingSticker("circle")}
              data-testid="button-add-circle"
              className="flex-1 sm:flex-none rounded-xl font-semibold h-11"
            >
              <Circle className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Circle</span>
            </Button>
          </div>
        </div>

        {selectedSticker && (
          <div>
            <Label className="text-sm font-bold mb-3 block text-gray-700 dark:text-gray-300">Transform Selected</Label>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={rotateSelected} 
                data-testid="button-rotate" 
                className="flex-1 sm:flex-none rounded-xl font-semibold h-11"
              >
                <RotateCw className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Rotate</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resizeSelected} 
                data-testid="button-resize" 
                className="flex-1 sm:flex-none rounded-xl font-semibold h-11"
              >
                <Maximize2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Resize</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deleteSelected}
                className="text-destructive flex-1 sm:flex-none rounded-xl font-semibold h-11 hover:bg-red-50 dark:hover:bg-red-950"
                data-testid="button-delete-sticker"
              >
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          </div>
        )}

        <div>
          <Label className="text-sm font-bold mb-3 block text-gray-700 dark:text-gray-300">Comment Position</Label>
          <RadioGroup value={commentPosition} onValueChange={(v) => setCommentPosition(v as "top" | "bottom")}>
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <RadioGroupItem value="top" id="top" data-testid="radio-comment-top" />
              <Label htmlFor="top" className="cursor-pointer font-medium">Top</Label>
            </div>
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <RadioGroupItem value="bottom" id="bottom" data-testid="radio-comment-bottom" />
              <Label htmlFor="bottom" className="cursor-pointer font-medium">Bottom</Label>
            </div>
          </RadioGroup>
        </div>
      </Card>
    </div>
  );
}
