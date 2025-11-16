import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code } from "lucide-react";

export function ApiDocumentation() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2">API Documentation</h1>
        <p className="text-muted-foreground">
          RESTful API endpoints for integrating photo documentation into your custom applications.
        </p>
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">List Projects</CardTitle>
                <Badge variant="secondary">GET</Badge>
              </div>
              <CardDescription>Retrieve all projects with photo counts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md font-mono text-sm">
                <div className="text-primary">GET</div>
                <div className="mt-1">/api/projects</div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Response Example:</p>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
{`[
  {
    "id": "uuid",
    "name": "Building Renovation",
    "description": "Main hall renovation project",
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T14:30:00Z",
    "photoCount": 12
  }
]`}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Create Project</CardTitle>
                <Badge>POST</Badge>
              </div>
              <CardDescription>Create a new project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md font-mono text-sm">
                <div className="text-primary">POST</div>
                <div className="mt-1">/api/projects</div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Request Body:</p>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
{`{
  "name": "Building Renovation",
  "description": "Main hall renovation project"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Get Project Photos</CardTitle>
                <Badge variant="secondary">GET</Badge>
              </div>
              <CardDescription>Retrieve all photos for a specific project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md font-mono text-sm">
                <div className="text-primary">GET</div>
                <div className="mt-1">/api/projects/:projectId/photos</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Upload Photo</CardTitle>
                <Badge>POST</Badge>
              </div>
              <CardDescription>Upload a photo with metadata and overlays</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md font-mono text-sm">
                <div className="text-primary">POST</div>
                <div className="mt-1">/api/photos</div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Request (multipart/form-data):</p>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
{`photo: File (JPEG/PNG)
projectId: string (UUID)
comment: string (optional)
latitude: number
longitude: number
commentPosition: "top" | "bottom"
stickers: JSON array of sticker objects`}
                </pre>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Sticker Object Format:</p>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
{`{
  "id": "string",
  "type": "arrow" | "circle",
  "x": number,
  "y": number,
  "width": number,
  "height": number,
  "rotation": number
}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Get Photo</CardTitle>
                <Badge variant="secondary">GET</Badge>
              </div>
              <CardDescription>Retrieve a specific photo file</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md font-mono text-sm">
                <div className="text-primary">GET</div>
                <div className="mt-1">/api/photos/:photoId/file</div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Returns the photo file as JPEG image
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Delete Photo</CardTitle>
                <Badge variant="destructive">DELETE</Badge>
              </div>
              <CardDescription>Delete a photo and its associated file</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md font-mono text-sm">
                <div className="text-destructive">DELETE</div>
                <div className="mt-1">/api/photos/:photoId</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Code className="w-5 h-5" />
                API Authentication
              </CardTitle>
              <CardDescription>
                Currently, the API is open for development. Production deployments should implement
                token-based authentication.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Future Implementation:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Bearer token authentication via Authorization header</li>
                  <li>API key generation and management interface</li>
                  <li>Rate limiting per API key</li>
                  <li>Scope-based permissions (read, write, delete)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
