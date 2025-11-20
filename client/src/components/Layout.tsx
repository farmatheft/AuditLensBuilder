import { useLocation } from "wouter";
import { Camera, Home, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
    const [location, setLocation] = useLocation();

    // Hide nav on camera and editor pages for full immersion
    const isImmersive = location.startsWith("/camera") || location.startsWith("/editor");

    return (
        <div className="flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden">
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
                {children}
            </main>

            {!isImmersive && (
                <nav className="h-16 border-t bg-card/80 backdrop-blur-lg flex items-center justify-around px-4 pb-safe z-50">
                    <NavButton
                        active={location === "/" || location.startsWith("/projects")}
                        onClick={() => setLocation("/")}
                        icon={Home}
                        label="Projects"
                    />
                    <div className="relative -top-6">
                        <button
                            onClick={() => setLocation("/camera/quick")}
                            className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/40 hover:scale-105 transition-transform active:scale-95"
                        >
                            <Camera className="w-7 h-7" />
                        </button>
                    </div>
                    <NavButton
                        active={location === "/gallery"}
                        onClick={() => setLocation("/gallery")}
                        icon={Layers}
                        label="Gallery"
                    />
                </nav>
            )}
        </div>
    );
}

function NavButton({ active, onClick, icon: Icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center gap-1 w-16 transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
        >
            <Icon className={cn("w-6 h-6", active && "fill-current")} />
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    );
}
