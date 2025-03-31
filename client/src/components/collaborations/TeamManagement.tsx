import { useState } from "react";
import { 
  UserPlus, 
  Users, 
  Mail, 
  Shield, 
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Sample data - would be fetched from API in production
const mockTeamMembers = [
  {
    id: 1,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "Owner",
    avatar: "",
    initials: "JS",
    permissions: {
      files: "full", // full, edit, view
      resources: "full",
      clients: "full"
    }
  },
  {
    id: 2,
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    role: "Partner",
    avatar: "",
    initials: "MJ",
    permissions: {
      files: "edit",
      resources: "edit",
      clients: "full" 
    }
  },
  {
    id: 3,
    name: "Sarah Williams",
    email: "sarah.williams@example.com",
    role: "Associate",
    avatar: "",
    initials: "SW",
    permissions: {
      files: "edit",
      resources: "view",
      clients: "edit"
    }
  },
  {
    id: 4,
    name: "Robert Taylor",
    email: "robert.taylor@example.com",
    role: "Staff",
    avatar: "",
    initials: "RT",
    permissions: {
      files: "view",
      resources: "view",
      clients: "view"
    }
  }
];

interface TeamMemberItemProps {
  member: typeof mockTeamMembers[0];
  onEditPermissions: (memberId: number) => void;
}

const TeamMemberItem = ({ member, onEditPermissions }: TeamMemberItemProps) => {
  // Get role color based on role name
  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'Owner':
        return 'bg-purple-100 text-purple-800';
      case 'Partner':
        return 'bg-blue-100 text-blue-800';
      case 'Associate':
        return 'bg-green-100 text-green-800';
      case 'Staff':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  // Get permissions icon based on permission level
  const getPermissionBadge = (level: string) => {
    switch(level) {
      case 'full':
        return <Badge variant="default" className="text-[10px] py-0 px-2 h-4">Full Access</Badge>;
      case 'edit':
        return <Badge variant="outline" className="text-[10px] py-0 px-2 h-4 border-blue-300 text-blue-700">Edit</Badge>;
      case 'view':
        return <Badge variant="outline" className="text-[10px] py-0 px-2 h-4 border-neutral-300 text-neutral-700">View</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
      <div className="flex items-center">
        <Avatar className="h-9 w-9 mr-3">
          <AvatarImage src={member.avatar} alt={member.name} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {member.initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{member.name}</p>
          <div className="flex items-center text-xs text-neutral-500">
            <Mail className="h-3 w-3 mr-1" /> 
            {member.email}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <Badge variant="outline" className={`${getRoleBadgeColor(member.role)} border-0`}>
          {member.role}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => onEditPermissions(member.id)}
            >
              <Shield className="mr-2 h-4 w-4" />
              <span>Edit Permissions</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit Details</span>
            </DropdownMenuItem>
            {member.role !== 'Owner' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Remove</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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
    <div className="mb-5">
      <Label className="text-base">{label}</Label>
      <p className="text-sm text-neutral-500 mb-3">{description}</p>
      <RadioGroup value={value} onValueChange={onChange} className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="full" id={`${label.toLowerCase()}-full`} />
          <Label htmlFor={`${label.toLowerCase()}-full`} className="font-normal">
            Full Access
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="edit" id={`${label.toLowerCase()}-edit`} />
          <Label htmlFor={`${label.toLowerCase()}-edit`} className="font-normal">
            Edit Access
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="view" id={`${label.toLowerCase()}-view`} />
          <Label htmlFor={`${label.toLowerCase()}-view`} className="font-normal">
            View Only
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

const TeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState(mockTeamMembers);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Staff");
  const [editPermissionsFor, setEditPermissionsFor] = useState<number | null>(null);
  const [editedPermissions, setEditedPermissions] = useState({
    files: "view",
    resources: "view",
    clients: "view"
  });

  const handleInviteMember = () => {
    if (!inviteEmail) return;
    
    // In a real app, this would send an invitation email
    // For demo purposes, we'll just add the user to our list
    const initials = inviteEmail
      .split('@')[0]
      .split('.')
      .map(part => part[0]?.toUpperCase())
      .join('');
    
    const newMember = {
      id: teamMembers.length + 1,
      name: inviteEmail.split('@')[0].replace('.', ' '),
      email: inviteEmail,
      role: inviteRole,
      avatar: "",
      initials,
      permissions: {
        files: "view",
        resources: "view",
        clients: "view"
      }
    };
    
    setTeamMembers([...teamMembers, newMember]);
    setInviteEmail("");
    setInviteRole("Staff");
    setShowInviteDialog(false);
  };

  const handleEditPermissions = (memberId: number) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (member) {
      setEditedPermissions({...member.permissions});
      setEditPermissionsFor(memberId);
    }
  };

  const handleSavePermissions = () => {
    if (editPermissionsFor === null) return;
    
    setTeamMembers(teamMembers.map(member => 
      member.id === editPermissionsFor
        ? { ...member, permissions: editedPermissions }
        : member
    ));
    
    setEditPermissionsFor(null);
  };

  return (
    <Card className="bg-white/95 backdrop-blur shadow-lg border-neutral-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage access and collaboration</CardDescription>
          </div>
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-1">
                <UserPlus className="h-4 w-4" />
                <span>Invite</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Add a new team member to collaborate on files and resources.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    placeholder="colleague@example.com"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={setInviteRole}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Partner">Partner</SelectItem>
                      <SelectItem value="Associate">Associate</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleInviteMember}
                  disabled={!inviteEmail}
                >
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center mb-4">
          <Users className="h-4 w-4 text-neutral-500 mr-1" />
          <span className="text-sm text-neutral-500">{teamMembers.length} members</span>
        </div>
        <div>
          {teamMembers.map(member => (
            <TeamMemberItem 
              key={member.id} 
              member={member}
              onEditPermissions={handleEditPermissions}
            />
          ))}
        </div>
      </CardContent>
      
      {/* Edit Permissions Dialog */}
      <Dialog
        open={editPermissionsFor !== null}
        onOpenChange={(open) => !open && setEditPermissionsFor(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Permissions</DialogTitle>
            <DialogDescription>
              Customize access levels for this team member
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <PermissionSetting
              label="Files & Documents"
              description="Access to filing cabinet and document storage"
              value={editedPermissions.files}
              onChange={(value) => setEditedPermissions({...editedPermissions, files: value})}
            />
            
            <PermissionSetting
              label="Firm Resources"
              description="Access to resources and reference materials"
              value={editedPermissions.resources}
              onChange={(value) => setEditedPermissions({...editedPermissions, resources: value})}
            />
            
            <PermissionSetting
              label="Client Information"
              description="Access to client data and communication"
              value={editedPermissions.clients}
              onChange={(value) => setEditedPermissions({...editedPermissions, clients: value})}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPermissionsFor(null)}>
              Cancel
            </Button>
            <Button onClick={handleSavePermissions}>
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TeamManagement;