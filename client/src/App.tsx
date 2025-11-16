import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Camera, Folder, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import ProjectsPage from "@/pages/ProjectsPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import CameraPage from "@/pages/CameraPage";
import ApiPage from "@/pages/ApiPage";

function Navigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/projects", icon: Folder, label: "Projects" },
    { path: "/api", icon: Code, label: "API" },
  ];

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Camera className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Photo Audit Tracker</h1>
        </div>
        <div className="flex gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || location.startsWith(item.path + "/");
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => setLocation(item.path)}
                className="gap-2"
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <ProjectsPage />} />
      <Route path="/projects" component={() => <ProjectsPage />} />
      <Route path="/project/:id">
        {(params) => <ProjectDetailPage />}
      </Route>
      <Route path="/camera/:id">
        {(params) => <CameraPage projectId={params.id} />}
      </Route>
      <Route path="/api" component={() => <ApiPage />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isCameraPage = location.startsWith("/camera/");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex flex-col h-screen">
          {!isCameraPage && <Navigation />}
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
