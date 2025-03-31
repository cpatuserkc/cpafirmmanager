import { useState } from "react";
import { Book, File, Tag, MoreHorizontal, ExternalLink, Download, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Temporary mock data - would come from API in production
const mockResources = [
  { 
    id: 1, 
    name: "Tax Planning Guide 2025", 
    type: "ebook", 
    category: "Tax",
    shared: true,
    collaborators: 4,
    tags: ["tax", "guide", "2025"]
  },
  { 
    id: 2, 
    name: "Client Interview Templates", 
    type: "templates", 
    category: "Client Management",
    shared: true,
    collaborators: 2,
    tags: ["templates", "client"]
  },
  { 
    id: 3, 
    name: "Financial Reporting Standards", 
    type: "reference", 
    category: "Accounting",
    shared: false,
    collaborators: 0,
    tags: ["standards", "accounting"]
  },
  { 
    id: 4, 
    name: "Audit Workpapers", 
    type: "templates", 
    category: "Audit",
    shared: true,
    collaborators: 3,
    tags: ["audit", "workpapers"]
  },
];

// Get all unique categories
const categories = Array.from(new Set(mockResources.map(r => r.category)));

interface ResourceItemProps {
  resource: typeof mockResources[0];
}

const ResourceItem = ({ resource }: ResourceItemProps) => {
  return (
    <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-md bg-white hover:bg-neutral-50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="bg-primary/10 p-2 rounded">
          <Book className="h-6 w-6 text-primary" />
        </div>
        <div>
          <div className="font-medium">{resource.name}</div>
          <div className="text-sm text-neutral-500 flex items-center gap-2">
            <Badge variant="outline">{resource.category}</Badge>
            {resource.tags.map((tag, i) => (
              <span key={i} className="text-xs text-neutral-400">#{tag}</span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {resource.shared && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{resource.collaborators}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Shared with {resource.collaborators} people</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>
              <ExternalLink className="mr-2 h-4 w-4" />
              <span>Open</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              <span>Download</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Tag className="mr-2 h-4 w-4" />
              <span>Manage Tags</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

const Bookcase = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Filter resources based on search and category
  const filteredResources = mockResources.filter(resource => {
    const matchesSearch = searchQuery === "" || 
      resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === null || resource.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div>
      <div className="mb-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Search resources..."
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
        
        <div className="flex space-x-2">
          <Button 
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="space-y-4 mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {selectedCategory ? `${selectedCategory} Resources` : "All References"}
          </h3>
          <Button size="sm" variant="outline">
            + Add Resource
          </Button>
        </div>
        
        <div className="space-y-2">
          {filteredResources.length > 0 ? (
            filteredResources.map((resource) => (
              <ResourceItem key={resource.id} resource={resource} />
            ))
          ) : (
            <div className="text-center py-8 text-neutral-500">
              No resources found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bookcase;