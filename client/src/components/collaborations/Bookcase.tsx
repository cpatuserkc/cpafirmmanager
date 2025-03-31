import { useState } from "react";
import { 
  FileText, 
  Book, 
  BookOpen, 
  MoreHorizontal, 
  Download, 
  ExternalLink, 
  Info, 
  Star, 
  StarOff, 
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Sample data - would be fetched from API in production
const mockResources = [
  {
    id: 1,
    title: "2025 Tax Updates Guide",
    type: "guide",
    category: "Tax",
    accessLevel: "Premium",
    description: "Comprehensive guide to all tax law changes for 2025",
    date: "Jan 10, 2025",
    starred: true
  },
  {
    id: 2,
    title: "Client Engagement Templates",
    type: "template",
    category: "Client Management",
    accessLevel: "Free",
    description: "Standardized templates for new client engagements",
    date: "Feb 15, 2025",
    starred: false
  },
  {
    id: 3,
    title: "Financial Statement Analysis",
    type: "whitepaper",
    category: "Accounting",
    accessLevel: "Premium",
    description: "Best practices for analyzing complex financial statements",
    date: "Mar 5, 2025",
    starred: true
  },
  {
    id: 4,
    title: "Audit Preparation Checklist",
    type: "checklist",
    category: "Audit",
    accessLevel: "Free",
    description: "Step-by-step guide to prepare clients for audits",
    date: "Dec 12, 2024",
    starred: false
  },
  {
    id: 5,
    title: "Industry Benchmarking Report",
    type: "report",
    category: "Analytics",
    accessLevel: "Premium",
    description: "Comparative analysis of financial metrics across industries",
    date: "Feb 28, 2025",
    starred: false
  },
  {
    id: 6,
    title: "Tax Planning Strategies",
    type: "guide",
    category: "Tax",
    accessLevel: "Premium",
    description: "Advanced tax planning strategies for high net worth clients",
    date: "Jan 25, 2025",
    starred: false
  }
];

interface ResourceItemProps {
  resource: typeof mockResources[0];
  onToggleStar: (id: number, starred: boolean) => void;
  onView: (resource: typeof mockResources[0]) => void;
}

const ResourceItem = ({ resource, onToggleStar, onView }: ResourceItemProps) => {
  const getResourceIcon = (type: string) => {
    switch(type) {
      case 'guide':
        return <Book className="h-5 w-5 text-blue-500" />;
      case 'template':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'report':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'whitepaper':
        return <BookOpen className="h-5 w-5 text-amber-500" />;
      case 'checklist':
        return <FileText className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-neutral-500" />;
    }
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="py-4 px-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            {getResourceIcon(resource.type)}
            <CardTitle className="ml-2 text-base">{resource.title}</CardTitle>
          </div>
          <div className="flex items-center space-x-1">
            <Badge variant={resource.accessLevel === "Premium" ? "default" : "outline"} className="mr-1">
              {resource.accessLevel}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggleStar(resource.id, !resource.starred)}
            >
              {resource.starred ? (
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              ) : (
                <StarOff className="h-4 w-4 text-neutral-400" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer" onClick={() => onView(resource)}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>Open</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Download className="mr-2 h-4 w-4" />
                  <span>Download</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Info className="mr-2 h-4 w-4" />
                  <span>Details</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  <span>Related Resources</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardDescription className="mt-1">{resource.description}</CardDescription>
      </CardHeader>
      <CardFooter className="py-2 px-5 flex justify-between border-t text-xs text-neutral-500">
        <span>Added: {resource.date}</span>
        <span>Category: {resource.category}</span>
      </CardFooter>
    </Card>
  );
};

const Bookcase = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [resources, setResources] = useState(mockResources);
  const [, setSelectedResource] = useState<typeof mockResources[0] | null>(null);

  const handleToggleStar = (id: number, starred: boolean) => {
    setResources(resources.map(r => 
      r.id === id ? { ...r, starred } : r
    ));
  };

  const handleViewResource = (resource: typeof mockResources[0]) => {
    setSelectedResource(resource);
    // In a real application, this would open the resource or show resource details
    console.log("Opening resource:", resource.title);
  };

  const filteredResources = resources.filter(resource => 
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="relative mb-6">
        <Search className="absolute top-2.5 left-3 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search resources..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="relative">
        <div 
          className="absolute -left-6 -right-6 top-0 opacity-20 pointer-events-none"
          style={{ 
            backgroundImage: "url('/images/bookcase.svg')", 
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "contain",
            height: "500px",
            zIndex: -1
          }}
        />
        
        <ScrollArea className="h-[400px] pr-4">
          {filteredResources.length > 0 ? (
            filteredResources.map(resource => (
              <ResourceItem 
                key={resource.id} 
                resource={resource} 
                onToggleStar={handleToggleStar}
                onView={handleViewResource}
              />
            ))
          ) : (
            <div className="text-center py-10 text-neutral-500">
              <BookOpen className="mx-auto h-10 w-10 text-neutral-300 mb-3" />
              <p>No resources found matching "{searchQuery}"</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default Bookcase;