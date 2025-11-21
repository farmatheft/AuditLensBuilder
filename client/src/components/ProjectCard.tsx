import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Folder, Camera } from "lucide-react";
import type { Project } from "@/types/schema";
import { formatDistanceToNow } from "date-fns";

interface ProjectCardProps {
  project: Project & { photoCount: number };
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <Card
      className="hover-elevate active-elevate-2 cursor-pointer transition-all"
      onClick={onClick}
      data-testid={`card-project-${project.id}`}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Folder className="w-5 h-5 text-primary" />
          <span className="truncate">{project.name}</span>
        </CardTitle>
        <Badge variant="secondary" data-testid={`badge-photo-count-${project.id}`}>
          <Camera className="w-3 h-3 mr-1" />
          {project.photoCount}
        </Badge>
      </CardHeader>
      <CardContent>
        {project.description && (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{project.description}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
}
