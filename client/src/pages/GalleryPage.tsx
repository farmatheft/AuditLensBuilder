import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Camera } from "lucide-react";
import type { Photo } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function GalleryPage() {
    const [, setLocation] = useLocation();

    const { data: photos, isLoading } = useQuery<Photo[]>({
        queryKey: ["/api/photos"],
    });

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 pb-24">
                <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Gallery</h1>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    const hasPhotos = photos && photos.length > 0;

    return (
        <div className="container mx-auto p-4 pb-24">
            <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Gallery</h1>

            {hasPhotos ? (
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                    {photos.map((photo) => (
                        <div
                            key={photo.id}
                            className="break-inside-avoid relative group rounded-xl overflow-hidden bg-card border shadow-sm hover:shadow-md transition-all cursor-pointer"
                            onClick={() => window.open(`/api/photos/${photo.id}/file`, '_blank')}
                        >
                            <img
                                src={`/api/photos/${photo.id}/file`}
                                alt={photo.comment || "Photo"}
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

                            {photo.stickers && Array.isArray(photo.stickers) && photo.stickers.length > 0 && (
                                <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] h-5 px-1.5 bg-black/50 text-white border-none backdrop-blur-sm">
                                    {photo.stickers.length} stickers
                                </Badge>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <Card className="glass p-12 text-center border-dashed">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Camera className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No photos yet</h3>
                    <p className="text-muted-foreground mb-6">
                        Start capturing moments to see them here.
                    </p>
                    <button
                        onClick={() => setLocation("/camera/quick")}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        Take First Photo
                    </button>
                </Card>
            )}
        </div>
    );
}
