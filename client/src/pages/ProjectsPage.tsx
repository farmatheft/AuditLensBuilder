import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ProjectCard } from "@/components/ProjectCard";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, Plus } from "lucide-react";
import type { Project } from "@shared/schema";

export default function ProjectsPage() {
  const [, setLocation] = useLocation();

  const { data: projects, isLoading } = useQuery<(Project & { photoCount: number })[]>({
    queryKey: ["/api/projects"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 pb-24">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const hasProjects = projects && projects.length > 0;

  return (
    <div className="container mx-auto p-4 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your audit sites</p>
        </div>
        <CreateProjectDialog />
      </div>

      {hasProjects ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => setLocation(`/project/${project.id}`)}
            />
          ))}
        </div>
      ) : (
        <Card className="glass border-dashed py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first project to start documenting.
            </p>
            <CreateProjectDialog />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
