import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, Trash2, Camera, Plus } from "lucide-react";
import type { Project, Photo } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const projectId = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: project, isLoading: isLoadingProject } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
  });

  const { data: photos, isLoading: isLoadingPhotos } = useQuery<Photo[]>({
    queryKey: ["/api/projects", projectId, "photos"],
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: number) => apiRequest("DELETE", `/api/photos/${photoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "photos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] }); // Update photo count
      toast({
        title: "Photo deleted",
        description: "The photo has been permanently deleted.",
      });
    },
  });

  if (isLoadingProject || isLoadingPhotos) {
    return (
      <div className="container mx-auto p-4 pb-24">
        <div className="mb-6">
          <Skeleton className="h-6 w-24 mb-4" />
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-4 text-center pt-20">
        <h2 className="text-2xl font-bold mb-4">Project not found</h2>
        <Button onClick={() => setLocation("/projects")}>Return to Projects</Button>
      </div>
    );
  }

  const hasPhotos = photos && photos.length > 0;

  return (
    <div className="container mx-auto p-4 pb-24">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
          onClick={() => setLocation("/projects")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-muted-foreground max-w-2xl">{project.description}</p>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Created {new Date(project.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Camera className="w-4 h-4" />
                {photos?.length || 0} photos
              </span>
            </div>
          </div>

          <Button
            onClick={() => setLocation(`/camera/${projectId}`)}
            className="shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Photo
          </Button>
        </div>
      </div>

      {/* Photos Grid */}
      {hasPhotos ? (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="break-inside-avoid relative group rounded-xl overflow-hidden bg-card border shadow-sm hover:shadow-md transition-all"
            >
              <div
                className="cursor-pointer"
                onClick={() => window.open(`/api/photos/${photo.id}/file`, '_blank')}
              >
                <img
                  src={`/api/photos/${photo.id}/file`}
                  alt={photo.comment || "Project photo"}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <div className="text-white space-y-1">
                    {photo.comment && (
                      <p className="text-sm font-medium line-clamp-2">{photo.comment}</p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-white/70">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDistanceToNow(new Date(photo.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delete Button - Always visible on mobile, hover on desktop */}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Are you sure you want to delete this photo?")) {
                    deletePhotoMutation.mutate(photo.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>

              {photo.stickers && Array.isArray(photo.stickers) && photo.stickers.length > 0 && (
                <Badge variant="secondary" className="absolute top-2 left-2 text-[10px] h-5 px-1.5 bg-black/50 text-white border-none backdrop-blur-sm pointer-events-none">
                  {photo.stickers.length} stickers
                </Badge>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card className="glass border-dashed py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No photos yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              This project doesn't have any photos. Start by capturing the first one.
            </p>
            <Button onClick={() => setLocation(`/camera/${projectId}`)}>
              <Plus className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
