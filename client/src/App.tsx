import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/Layout";
import ProjectsPage from "@/pages/ProjectsPage";
import GalleryPage from "@/pages/GalleryPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import CameraPage from "@/pages/CameraPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ProjectsPage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/gallery" component={GalleryPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/project/:id" component={ProjectDetailPage} />
      <Route path="/camera/:id" component={CameraPage} />
      {/* Add more routes as we build them */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Router />
      </Layout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
