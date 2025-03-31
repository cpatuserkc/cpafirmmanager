import { useState } from "react";
import { Check, Plus, UserPlus, User, X, UserCog, Mail, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock team members
const mockTeamMembers = [
  {
    id: 1,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "Senior Accountant",
    status: "active",
    lastActive: "Today at 2:30 PM",
    avatar: "", // Would be a URL in real implementation
    permissions: {
      files: "edit",
      team: "view",
      clients: "edit",
    }
  },
  {
    id: 2,
    name: "Mark Johnson",
    email: "mark.johnson@example.com",
    role: "Tax Specialist",
    status: "active",
    lastActive: "Yesterday at 5:15 PM",
    avatar: "",
    permissions: {
      files: "edit",
      team: "none",
      clients: "view",
    }
  },
  {
    id: 3,
    name: "Sarah Williams",
    email: "sarah.williams@example.com",
    role: "Junior Accountant",
    status: "invited",
    lastActive: "Never",
    avatar: "",
    permissions: {
      files: "view",
      team: "none",
      clients: "view",
    }
  },
];

// Permission levels with descriptions
const permissionLevels = [
  { value: "none", label: "No Access", icon: <X className="h-4 w-4" /> },
  { value: "view", label: "View Only", icon: <User className="h-4 w-4" /> },
  { value: "edit", label: "Can Edit", icon: <UserCog className="h-4 w-4" /> },
  { value: "admin", label: "Admin", icon: <Shield className="h-4 w-4" /> },
];

interface TeamMemberItemProps {
  member: typeof mockTeamMembers[0];
  onEditPermissions: (memberId: number) => void;
}

const TeamMemberItem = ({ member, onEditPermissions }: TeamMemberItemProps) => {
  return (
    <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-md bg-white hover:bg-neutral-50 transition-colors">
      <div className="flex items-center space-x-3">
        <Avatar>
          <AvatarImage src={member.avatar} alt={member.name} />
          <AvatarFallback>{member.name.charAt(0)}{member.name.split(' ')[1]?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium flex items-center">
            {member.name}
            {member.status === "invited" && (
              <Badge variant="outline" className="ml-2 text-xs">Invited</Badge>
            )}
          </div>
          <div className="text-sm text-neutral-500">{member.role}</div>
        </div>
      </div>
      
      <div className="flex items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center text-xs text-neutral-500 mr-4">
                <Clock className="h-3 w-3 mr-1" />
                <span>{member.lastActive}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Last active: {member.lastActive}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onEditPermissions(member.id)}
        >
          Permissions
        </Button>
      </div>
    </div>
  );
};

interface PermissionSettingProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}

const PermissionSetting = ({ label, description, value, onChange }: PermissionSettingProps) => {
  return (
    <div className="flex items-center justify-between p-3 border border-neutral-100 rounded-md">
      <div>
        <h4 className="font-medium">{label}</h4>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {permissionLevels.map(level => (
            <SelectItem key={level.value} value={level.value}>
              <div className="flex items-center">
                <span className="mr-2">{level.icon}</span>
                <span>{level.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const TeamManagement = () => {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("staff");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState({
    files: "view",
    team: "none",
    clients: "view",
  });
  
  const selectedMember = mockTeamMembers.find(m => m.id === selectedMemberId);
  
  const handleInvite = () => {
    // In a real implementation, this would send an invitation API call
    console.log(`Inviting ${name} (${email}) as ${role}`);
    // Reset form
    setEmail("");
    setName("");
    setRole("staff");
    // Close dialog
    setShowInviteDialog(false);
  };
  
  const handleEditPermissions = (memberId: number) => {
    const member = mockTeamMembers.find(m => m.id === memberId);
    if (member) {
      setSelectedMemberId(memberId);
      setPermissions({...member.permissions});
      setShowPermissionsDialog(true);
    }
  };
  
  const handleSavePermissions = () => {
    // In a real implementation, this would update the user's permissions
    console.log(`Updating permissions for user ${selectedMemberId}:`, permissions);
    setShowPermissionsDialog(false);
  };
  
  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage access for your firm's staff
              </CardDescription>
            </div>
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus size={16} />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to collaborate on your firm's workspace
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      placeholder="John Doe" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="john.doe@example.com" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="send-email">Send invitation email</Label>
                    <Switch id="send-email" defaultChecked />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInvite} disabled={!email || !name}>
                    Send Invitation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockTeamMembers.map(member => (
              <TeamMemberItem 
                key={member.id} 
                member={member} 
                onEditPermissions={handleEditPermissions} 
              />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Permissions: {selectedMember?.name}</DialogTitle>
            <DialogDescription>
              Set what this team member can access
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <PermissionSetting
              label="File Access"
              description="Access to files, folders and documents"
              value={permissions.files}
              onChange={(value) => setPermissions({...permissions, files: value})}
            />
            
            <PermissionSetting
              label="Team Management"
              description="Ability to invite and manage team members"
              value={permissions.team}
              onChange={(value) => setPermissions({...permissions, team: value})}
            />
            
            <PermissionSetting
              label="Client Data"
              description="Access to client information and history"
              value={permissions.clients}
              onChange={(value) => setPermissions({...permissions, clients: value})}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePermissions}>
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamManagement;