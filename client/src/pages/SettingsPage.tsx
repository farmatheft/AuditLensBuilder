import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Pencil, Trash2, Loader2, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Packaging, InsertPackaging } from "@/types/schema";
import { cn } from "@/lib/utils";
import { useTranslation, languages } from "@/i18n";

const EMOJI_OPTIONS = [
    "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "⬛️", "⬜️", "🟨🟩", "🔲", "▫️"
];

export default function SettingsPage() {
    const { t, language, setLanguage } = useTranslation();
    const { data: packagings, isLoading } = useQuery<Packaging[]>({
        queryKey: ["/api/packagings"],
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPackaging, setEditingPackaging] = useState<Packaging | null>(null);

    const handleEdit = (packaging: Packaging) => {
        setEditingPackaging(packaging);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingPackaging(null);
        setIsDialogOpen(true);
    };

    return (
        <div className="container mx-auto p-4 pb-24">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Settings
                </h1>
                <Button onClick={handleCreate} className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Packaging
                </Button>
            </div>

            <div className="space-y-6">
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-foreground/80">Packagings</h2>

                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : packagings?.length === 0 ? (
                        <div className="text-center p-8 border border-dashed rounded-xl bg-card/50">
                            <p className="text-muted-foreground">No packagings defined yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {packagings?.map((pkg) => (
                                <div
                                    key={pkg.id}
                                    className="flex items-center justify-between p-4 bg-card border rounded-xl shadow-sm"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="text-2xl bg-secondary/50 w-12 h-12 flex items-center justify-center rounded-lg">
                                            {pkg.color}
                                        </div>
                                        <div>
                                            <h3 className="font-medium">{pkg.name}</h3>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(pkg)}
                                        >
                                            <Pencil className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                        <DeletePackagingButton id={pkg.id} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Language Settings */}
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-primary" />
                            <h2 className="text-2xl font-bold">Language</h2>
                        </div>
                    </div>
                    <div className="bg-card border rounded-xl shadow-sm p-4">
                        <Label htmlFor="language-select" className="text-sm font-medium mb-2 block">
                            Select your preferred language
                        </Label>
                        <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
                            <SelectTrigger id="language-select" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map((lang) => (
                                    <SelectItem key={lang.code} value={lang.code}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{lang.flag}</span>
                                            <span>{lang.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </section>
            </div>

            <PackagingDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialData={editingPackaging}
            />
        </div>
    );
}

function DeletePackagingButton({ id }: { id: string }) {
    const { toast } = useToast();
    const deleteMutation = useMutation({
        mutationFn: () => apiRequest("DELETE", `/api/packagings/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/packagings"] });
            toast({ title: "Packaging deleted" });
        },
    });

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Packaging?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this packaging type.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => deleteMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function PackagingDialog({
    open,
    onOpenChange,
    initialData,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData: Packaging | null;
}) {
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [color, setColor] = useState(EMOJI_OPTIONS[0]);

    useEffect(() => {
        if (open) {
            if (initialData) {
                setName(initialData.name);
                setColor(initialData.color);
            } else {
                setName("");
                setColor(EMOJI_OPTIONS[0]);
            }
        }
    }, [open, initialData]);

    const mutation = useMutation({
        mutationFn: async (data: InsertPackaging) => {
            if (initialData) {
                return apiRequest("PUT", `/api/packagings/${initialData.id}`, data);
            } else {
                return apiRequest("POST", "/api/packagings", data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/packagings"] });
            toast({
                title: initialData ? "Packaging updated" : "Packaging created",
            });
            onOpenChange(false);
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to save packaging. Please try again.",
                variant: "destructive",
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        mutation.mutate({ name, color });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Packaging" : "New Packaging"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Box, Pallet"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Color / Icon</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full h-12 text-2xl justify-start px-4"
                                    type="button"
                                >
                                    {color}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2">
                                <div className="grid grid-cols-4 gap-2">
                                    {EMOJI_OPTIONS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => setColor(emoji)}
                                            className={cn(
                                                "text-2xl h-10 w-10 flex items-center justify-center rounded hover:bg-secondary transition-colors",
                                                color === emoji && "bg-secondary ring-2 ring-primary"
                                            )}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={mutation.isPending || !name.trim()}>
                            {mutation.isPending ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
