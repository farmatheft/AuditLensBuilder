import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CameraCapture } from "@/components/CameraCapture";
import { PhotoEditor } from "@/components/PhotoEditor";
import { useToast } from "@/hooks/use-toast";
import type { Geolocation, Project } from "@shared/schema";

interface CameraPageProps {
  projectId: string;
}

export default function CameraPage({ projectId }: CameraPageProps) {
  const [, setLocation] = useLocation();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedLocation, setCapturedLocation] = useState<Geolocation | null>(null);
  const [comment, setComment] = useState("");
  const [capturedAt, setCapturedAt] = useState<string>("");
  const { toast } = useToast();

  const { data: project } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const handleCapture = (imageData: string, location: Geolocation | null, commentText: string, timestamp: string) => {
    setCapturedImage(imageData);
    setCapturedLocation(location);
    setComment(commentText);
    setCapturedAt(timestamp);
  };

  const handleUploadComplete = () => {
    toast({
      title: "Photo uploaded",
      description: "Your photo has been saved successfully.",
    });
    setCapturedImage(null);
    setCapturedLocation(null);
    setComment("");
    setCapturedAt("");
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
        projectName={project?.name || ""}
        capturedAt={capturedAt}
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
      projectName={project?.name || ""}
    />
  );
}
