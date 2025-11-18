import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Camera, MapPin, Trash2 } from "lucide-react";
import type { Photo, Project } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [touchedCard, setTouchedCard] = useState<string | null>(null);

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", id],
    enabled: !!id,
  });

  const { data: photos, isLoading: photosLoading } = useQuery<Photo[]>({
    queryKey: ["/api/projects", id, "photos"],
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => apiRequest("DELETE", `/api/photos/${photoId}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "photos"] });
      toast({
        title: "Photo deleted",
        description: "The photo has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (projectLoading || photosLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-9 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Project not found</p>
        </Card>
      </div>
    );
  }

  const hasPhotos = photos && photos.length > 0;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/projects")}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
          </div>
          <Button onClick={() => setLocation(`/camera/${id}`)} data-testid="button-take-photo">
            <Camera className="w-4 h-4 mr-2" />
            Take Photo
          </Button>
        </div>
      </div>

      {hasPhotos ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
          {photos.map((photo) => (
            <Card 
              key={photo.id} 
              className="group overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all" 
              data-testid={`card-photo-${photo.id}`}
              onClick={() => {
                if (touchedCard === photo.id) {
                  window.open(`/api/photos/${photo.id}/file`, '_blank');
                  setTouchedCard(null);
                } else {
                  setTouchedCard(photo.id);
                  setTimeout(() => setTouchedCard(null), 3000);
                }
              }}
              style={{ width: '145px' }}
            >
              <div className="relative aspect-[9/16] bg-muted">
                <img
                  src={`/api/photos/${photo.id}/file`}
                  alt={photo.comment || "Photo"}
                  className="w-full h-full object-cover"
                  data-testid={`img-photo-${photo.id}`}
                />
                
                {/* Info overlay - показується на hover або touch */}
                <div className={`absolute inset-0 bg-black/80 transition-opacity duration-300 p-2 flex flex-col justify-between text-white text-xs overflow-hidden ${
                  touchedCard === photo.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  <div className="space-y-1">
                    {photo.comment && (
                      <p className="font-medium line-clamp-3">{photo.comment}</p>
                    )}
                    {photo.latitude && photo.longitude && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="font-mono text-[10px]" data-testid={`text-location-${photo.id}`}>
                          {photo.latitude.toFixed(4)}, {photo.longitude.toFixed(4)}
                        </span>
                      </div>
                    )}
                    {photo.stickers && Array.isArray(photo.stickers) && photo.stickers.length > 0 && (
                      <p className="text-[10px]">{photo.stickers.length} sticker{photo.stickers.length !== 1 ? "s" : ""}</p>
                    )}
                  </div>
                  <p className="text-[10px] text-white/70">
                    {formatDistanceToNow(new Date(photo.createdAt), { addSuffix: true })}
                  </p>
                </div>

                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(photo.id);
                  }}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-photo-${photo.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No photos yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Start documenting progress by taking your first photo.
            </p>
            <Button onClick={() => setLocation(`/camera/${id}`)} data-testid="button-take-first-photo">
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
