import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertProject } from "@/types/schema";
import { useTranslation } from "@/i18n";

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();

  const createMutation = useMutation({
    mutationFn: (data: InsertProject) => apiRequest("POST", "/api/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: t('toasts.success'),
        description: t('toasts.projectUpdatedDesc'),
      });
      setOpen(false);
      setName("");
      setDescription("");
    },
    onError: () => {
      toast({
        title: t('toasts.error'),
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), description: description.trim() || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" data-testid="button-create-project">
          <Plus className="w-4 h-4" />
          {t('projects.createNew')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dialogs.createProject')}</DialogTitle>
          <DialogDescription>
            {/* Create a new project to organize and track photos for different repair or construction jobs. */}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('dialogs.projectName')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('dialogs.enterProjectName')}
              required
              data-testid="input-project-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t('dialogs.description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('dialogs.enterDescription')}
              rows={3}
              data-testid="input-project-description"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('settings.cancel')}
            </Button>
            <Button type="submit" disabled={!name.trim() || createMutation.isPending} data-testid="button-submit-project">
              {createMutation.isPending ? t('common.loading') : t('projects.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
