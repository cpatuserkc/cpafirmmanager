import { useState } from "react";
import { Folder, File, Share2, MoreHorizontal, Lock, UserPlus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Temporary mock data - would come from API in production
const mockFolders = [
  { id: 1, name: "Client Files", owner: "You", shared: true, sharedWith: ["Jane Smith", "Mark Johnson"] },
  { id: 2, name: "Tax Documents", owner: "You", shared: false, sharedWith: [] },
  { id: 3, name: "Financial Reports", owner: "You", shared: true, sharedWith: ["Jane Smith"] },
  { id: 4, name: "Audit Materials", owner: "Jane Smith", shared: true, sharedWith: ["You"] },
];

interface FolderItemProps {
  folder: typeof mockFolders[0];
  onShare: (folderId: number) => void;
}

const FolderItem = ({ folder, onShare }: FolderItemProps) => {
  return (
    <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-md bg-white hover:bg-neutral-50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="bg-primary/10 p-2 rounded">
          <Folder className="h-6 w-6 text-primary" />
        </div>
        <div>
          <div className="font-medium">{folder.name}</div>
          <div className="text-sm text-neutral-500">Owner: {folder.owner}</div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {folder.shared && (
          <Badge variant="outline" className="flex items-center gap-1">
            <UserPlus className="h-3 w-3" />
            <span>{folder.sharedWith.length}</span>
          </Badge>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onShare(folder.id)}>
              <Share2 className="mr-2 h-4 w-4" />
              <span>Share</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <ExternalLink className="mr-2 h-4 w-4" />
              <span>Open</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

const FilingCabinet = () => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newCollaborator, setNewCollaborator] = useState("");
  const [permissionLevel, setPermissionLevel] = useState("view");
  
  const selectedFolder = mockFolders.find(f => f.id === selectedFolderId);
  
  const handleShareFolder = (folderId: number) => {
    setSelectedFolderId(folderId);
    setShareDialogOpen(true);
  };
  
  const handleAddCollaborator = () => {
    // In a real implementation, this would call an API to update permissions
    console.log(`Adding ${newCollaborator} with ${permissionLevel} permissions to folder ${selectedFolderId}`);
    setNewCollaborator("");
    // Close dialog after adding
    setShareDialogOpen(false);
  };
  
  const filteredFolders = searchQuery 
    ? mockFolders.filter(folder => 
        folder.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : mockFolders;
  
  return (
    <div>
      <div className="mb-4">
        <div className="relative">
          <Input
            placeholder="Search folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute right-0 top-0 h-full"
            onClick={() => setSearchQuery("")}
          >
            {searchQuery && "✕"}
          </Button>
        </div>
      </div>
      
      <div className="space-y-4 mt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Your Folders</h3>
          <Button size="sm" variant="outline">
            + New Folder
          </Button>
        </div>
        
        <div className="space-y-2">
          {filteredFolders.length > 0 ? (
            filteredFolders.map((folder) => (
              <FolderItem 
                key={folder.id} 
                folder={folder} 
                onShare={handleShareFolder} 
              />
            ))
          ) : (
            <div className="text-center py-8 text-neutral-500">
              No folders found
            </div>
          )}
        </div>
      </div>
      
      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share "{selectedFolder?.name}"</DialogTitle>
            <DialogDescription>
              Add people to collaborate on this folder
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="collaborator">Add collaborator</Label>
              <div className="flex space-x-2">
                <Input
                  id="collaborator"
                  placeholder="Email or username"
                  value={newCollaborator}
                  onChange={(e) => setNewCollaborator(e.target.value)}
                />
                <Select 
                  value={permissionLevel} 
                  onValueChange={setPermissionLevel}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View only</SelectItem>
                    <SelectItem value="comment">Comment</SelectItem>
                    <SelectItem value="edit">Can edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {selectedFolder?.sharedWith.length ? (
              <div>
                <Label>Already shared with</Label>
                <div className="mt-2 space-y-2">
                  {selectedFolder.sharedWith.map((user, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-neutral-50 rounded">
                      <span>{user}</span>
                      <Badge>Can edit</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            
            <div className="flex items-center space-x-2 text-sm">
              <Lock className="h-4 w-4 text-neutral-500" />
              <span className="text-neutral-500">
                Only people who have access can see and collaborate
              </span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCollaborator} disabled={!newCollaborator}>
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FilingCabinet;