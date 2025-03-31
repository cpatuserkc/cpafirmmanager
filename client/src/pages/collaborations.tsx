import { useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthContext } from "@/App";
import FilingCabinet from "@/components/collaborations/FilingCabinet";
import Bookcase from "@/components/collaborations/Bookcase";
import FileUploader from "@/components/collaborations/FileUploader";
import TeamManagement from "@/components/collaborations/TeamManagement";
import { Folder, Upload, Users, UserPlus } from "lucide-react";

const Collaborations = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<"cabinet" | "bookcase">("cabinet");
  
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-neutral-100">
      {/* Office background with reduced opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
        style={{ 
          backgroundImage: "url('/images/office-background.svg')", 
          backgroundSize: "cover" 
        }}
      />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold">Collaborations & File Storage</h1>
            <p className="text-neutral-600 mt-1">Organize and share your documents with team members</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setActiveView("cabinet")}
            >
              <Folder size={16} />
              Filing Cabinet
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setActiveView("bookcase")}
            >
              <Users size={16} />
              Bookcase
            </Button>
            <FileUploader />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <Card className="bg-white/95 backdrop-blur shadow-lg border-neutral-200">
              <CardHeader>
                <CardTitle>
                  {activeView === "cabinet" ? "Filing Cabinet" : "Reference Bookcase"}
                </CardTitle>
                <CardDescription>
                  {activeView === "cabinet" 
                    ? "Store and organize client files and internal documents" 
                    : "Access reference materials and shared resources"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="folders" className="w-full">
                  <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                    <TabsTrigger value="folders">Folders</TabsTrigger>
                    <TabsTrigger value="recent">Recent Files</TabsTrigger>
                  </TabsList>
                  <TabsContent value="folders" className="mt-6">
                    {activeView === "cabinet" ? (
                      <FilingCabinet />
                    ) : (
                      <Bookcase />
                    )}
                  </TabsContent>
                  <TabsContent value="recent" className="mt-6">
                    <div className="bg-neutral-50 rounded-lg p-8 text-center">
                      <Upload className="mx-auto h-12 w-12 text-neutral-400" />
                      <h3 className="mt-4 text-lg font-medium">No recent files</h3>
                      <p className="mt-2 text-sm text-neutral-500">
                        Upload files to see them here
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-4">
            <TeamManagement />
            
            <Card className="mt-8 bg-white/95 backdrop-blur shadow-lg border-neutral-200">
              <CardHeader>
                <CardTitle>Activity</CardTitle>
                <CardDescription>Recent collaboration activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="relative mt-1">
                      <div className="bg-neutral-100 h-8 w-8 rounded-full flex items-center justify-center">
                        <UserPlus className="h-4 w-4 text-neutral-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Jane Smith shared "Tax Documents" with you</p>
                      <p className="text-xs text-neutral-500">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="relative mt-1">
                      <div className="bg-neutral-100 h-8 w-8 rounded-full flex items-center justify-center">
                        <Upload className="h-4 w-4 text-neutral-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">You uploaded 3 files to "Client Files"</p>
                      <p className="text-xs text-neutral-500">Yesterday</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="relative mt-1">
                      <div className="bg-neutral-100 h-8 w-8 rounded-full flex items-center justify-center">
                        <Folder className="h-4 w-4 text-neutral-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">You created folder "Financial Reports"</p>
                      <p className="text-xs text-neutral-500">3 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collaborations;