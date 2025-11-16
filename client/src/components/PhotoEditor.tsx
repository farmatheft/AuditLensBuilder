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
  const [placingSticker, setPlacingSticker] = useState<"arrow" | "circle" | null>(null);
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
        const textMetrics = ctx.measureText(comment);
        const padding = fontSize * 0.5;
        const y = commentPosition === "top" ? padding : img.height - fontSize - padding;

        ctx.fillRect(0, y - fontSize - padding / 2, img.width, fontSize + padding);
        ctx.fillStyle = "white";
        ctx.fillText(comment, padding, y);
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
    <div className="w-full h-full flex flex-col bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">Edit Photo</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} data-testid="button-cancel">
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading} size="sm" data-testid="button-upload">
            {isUploading ? (
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4 animate-pulse" />
                Uploading...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload
              </span>
            )}
          </Button>
        </div>
      </div>

      {isUploading && (
        <div className="px-4 pt-2">
          <Progress value={uploadProgress} className="w-full" data-testid="progress-upload" />
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        <div ref={containerRef} className="max-w-4xl mx-auto">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className="w-full border border-border rounded-md cursor-crosshair shadow-lg"
            data-testid="canvas-editor"
          />
        </div>
      </div>

      <Card className="m-4 p-4 space-y-4">
        <div>
          <Label className="text-sm font-medium mb-2 block">Add Stickers</Label>
          <div className="flex gap-2">
            <Button
              variant={placingSticker === "arrow" ? "default" : "outline"}
              size="sm"
              onClick={() => setPlacingSticker("arrow")}
              data-testid="button-add-arrow"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Arrow
            </Button>
            <Button
              variant={placingSticker === "circle" ? "default" : "outline"}
              size="sm"
              onClick={() => setPlacingSticker("circle")}
              data-testid="button-add-circle"
            >
              <Circle className="w-4 h-4 mr-2" />
              Circle
            </Button>
          </div>
        </div>

        {selectedSticker && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Transform Selected</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={rotateSelected} data-testid="button-rotate">
                <RotateCw className="w-4 h-4 mr-2" />
                Rotate
              </Button>
              <Button variant="outline" size="sm" onClick={resizeSelected} data-testid="button-resize">
                <Maximize2 className="w-4 h-4 mr-2" />
                Resize
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deleteSelected}
                className="text-destructive"
                data-testid="button-delete-sticker"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}

        <div>
          <Label className="text-sm font-medium mb-2 block">Comment Position</Label>
          <RadioGroup value={commentPosition} onValueChange={(v) => setCommentPosition(v as "top" | "bottom")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="top" id="top" data-testid="radio-comment-top" />
              <Label htmlFor="top">Top</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bottom" id="bottom" data-testid="radio-comment-bottom" />
              <Label htmlFor="bottom">Bottom</Label>
            </div>
          </RadioGroup>
        </div>
      </Card>
    </div>
  );
}
