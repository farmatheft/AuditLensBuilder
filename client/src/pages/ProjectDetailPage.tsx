import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { ArrowLeft, Calendar, MapPin, Trash2, Camera, Plus, Edit, MoreVertical } from "lucide-react";
import type { Project, Photo } from "@/types/schema";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const projectId = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [transferProjectId, setTransferProjectId] = useState<string>("");

  const { data: project, isLoading: isLoadingProject } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
  });

  const { data: allProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: photos, isLoading: isLoadingPhotos } = useQuery<Photo[]>({
    queryKey: ["/api/projects", projectId, "photos"],
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: string) => apiRequest("DELETE", `/api/photos/${photoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "photos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] }); // Update photo count
      toast({
        title: "Photo deleted",
        description: "The photo has been permanently deleted.",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiRequest("PATCH", `/api/projects/${projectId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowEditDialog(false);
      toast({
        title: "Project updated",
        description: "The project has been successfully updated.",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (transferId?: string) => {
      const url = transferId
        ? `/api/projects/${projectId}?transfer_project_id=${transferId}`
        : `/api/projects/${projectId}`;
      return apiRequest("DELETE", url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project deleted",
        description: "The project has been permanently deleted.",
      });
      setLocation("/projects");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
        variant: "destructive",
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

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setEditName(project.name);
                setEditDescription(project.description || "");
                setShowEditDialog(true);
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setLocation(`/camera/${projectId}`)}
              className="shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Photo
            </Button>
          </div>
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

      {/* Edit Project Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update your project details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter project description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editName.trim()) {
                  updateProjectMutation.mutate({
                    name: editName,
                    description: editDescription || undefined,
                  });
                }
              }}
              disabled={!editName.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              {hasPhotos ? (
                <div className="space-y-4">
                  <p>
                    This project contains {photos?.length} photo(s). You must select a project to transfer these photos to before deletion.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="transfer-project">Transfer photos to:</Label>
                    <Select value={transferProjectId} onValueChange={setTransferProjectId}>
                      <SelectTrigger id="transfer-project">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {allProjects?.filter(p => p.id !== projectId).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <p>
                  Are you sure you want to delete this project? This action cannot be undone.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTransferProjectId("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (hasPhotos && !transferProjectId) {
                  toast({
                    title: "Transfer project required",
                    description: "Please select a project to transfer photos to.",
                    variant: "destructive",
                  });
                  return;
                }
                deleteProjectMutation.mutate(hasPhotos ? transferProjectId : undefined);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
