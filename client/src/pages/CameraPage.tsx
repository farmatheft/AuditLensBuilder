import { useState } from "react";
import { useLocation } from "wouter";
import { CameraCapture } from "@/components/CameraCapture";
import { PhotoEditor } from "@/components/PhotoEditor";
import { useToast } from "@/hooks/use-toast";
import type { Geolocation } from "@shared/schema";

interface CameraPageProps {
  projectId: string;
}

export default function CameraPage({ projectId }: CameraPageProps) {
  const [, setLocation] = useLocation();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedLocation, setCapturedLocation] = useState<Geolocation | null>(null);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const handleCapture = (imageData: string, location: Geolocation | null, commentText: string) => {
    setCapturedImage(imageData);
    setCapturedLocation(location);
    setComment(commentText);
  };

  const handleUploadComplete = () => {
    toast({
      title: "Photo uploaded",
      description: "Your photo has been saved successfully.",
    });
    setCapturedImage(null);
    setCapturedLocation(null);
  };

  const handleCancel = () => {
    setCapturedImage(null);
    setCapturedLocation(null);
  };

  if (capturedImage) {
    return (
      <PhotoEditor
        imageData={capturedImage}
        location={capturedLocation}
        comment={comment}
        projectId={projectId}
        onUploadComplete={handleUploadComplete}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <CameraCapture
      onCapture={handleCapture}
      comment={comment}
      onCommentChange={setComment}
    />
  );
}
