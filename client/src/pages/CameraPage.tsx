import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CameraCapture } from "@/components/CameraCapture";
import { PhotoEditor } from "@/components/PhotoEditor";
import { useToast } from "@/hooks/use-toast";
import type { Geolocation, Project } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface CameraPageProps {
  params: {
    id: string;
  };
}

export default function CameraPage({ params }: CameraPageProps) {
  const projectId = params.id;
  const [, setLocation] = useLocation();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedLocation, setCapturedLocation] = useState<Geolocation | null>(null);
  const [comment, setComment] = useState("");
  const [capturedAt, setCapturedAt] = useState<string>("");
  const { toast } = useToast();

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId && projectId !== "quick",
  });

  const handleCapture = (imageData: string, location: Geolocation | null, commentText: string, timestamp: string) => {
    setCapturedImage(imageData);
    setCapturedLocation(location);
    setComment(commentText);
    setCapturedAt(timestamp);
  };

  const handleUploadComplete = () => {
    toast({
      title: "Success",
      description: "Photo uploaded successfully",
      className: "glass border-green-500/50 text-green-500",
    });
    setCapturedImage(null);
    setCapturedLocation(null);
    setComment("");
    setCapturedAt("");
    if (projectId !== "quick") {
      setLocation(`/project/${projectId}`);
    } else {
      setLocation("/gallery");
    }
  };

  const handleCancel = () => {
    setCapturedImage(null);
    setCapturedLocation(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (capturedImage) {
    return (
      <PhotoEditor
        imageData={capturedImage}
        location={capturedLocation}
        comment={comment}
        projectId={projectId === "quick" ? "" : projectId}
        projectName={project?.name || "Quick Capture"}
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
      projectName={project?.name || "Quick Capture"}
    />
  );
}
