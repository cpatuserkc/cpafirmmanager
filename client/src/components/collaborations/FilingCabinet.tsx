import { useState } from "react";
import { 
  FolderOpen, 
  File, 
  MoreHorizontal, 
  Users, 
  Lock, 
  Trash2, 
  Download, 
  Edit,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define interfaces for our folder structure
interface FileItem {
  id: number;
  name: string;
  type: string;
  size: string;
  date: string;
}

interface FolderType {
  id: number;
  name: string;
  shared: boolean;
  files: FileItem[];
  subfolders?: FolderType[];
}

// Sample data - would be fetched from API in production
const mockFolders: FolderType[] = [
  {
    id: 1,
    name: "Client Files",
    shared: true,
    files: [
      { id: 1, name: "Adams Family Proposal 02-25-25.pdf", type: "pdf", size: "2.4 MB", date: "Feb 25, 2025" },
      { id: 2, name: "D. White Proposal 02-24-25.pdf", type: "pdf", size: "1.8 MB", date: "Feb 24, 2025" }
    ],
    subfolders: [
      {
        id: 1,
        name: "Tax Documents",
        shared: true,
        files: [
          { id: 3, name: "2024 Tax Planning.xlsx", type: "excel", size: "1.2 MB", date: "Jan 15, 2025" }
        ]
      }
    ]
  },
  {
    id: 2,
    name: "Firm Documents",
    shared: false,
    files: [
      { id: 4, name: "Staff Meeting Notes.docx", type: "word", size: "0.5 MB", date: "Mar 10, 2025" },
      { id: 5, name: "Office Policies.pdf", type: "pdf", size: "1.5 MB", date: "Dec 5, 2024" }
    ]
  },
  {
    id: 3,
    name: "Financial Reports",
    shared: true,
    files: [
      { id: 6, name: "Q1 2025 Analysis.xlsx", type: "excel", size: "2.1 MB", date: "Mar 15, 2025" }
    ]
  }
];

interface FileItemProps {
  file: FileItem;
  onView: (file: FileItem) => void;
}

const FileItem = ({ file, onView }: FileItemProps) => {
  const getFileIcon = (type: string) => {
    switch(type) {
      case 'pdf':
        return <File className="h-4 w-4 text-red-500" />;
      case 'excel':
        return <File className="h-4 w-4 text-green-500" />;
      case 'word':
        return <File className="h-4 w-4 text-blue-500" />;
      default:
        return <File className="h-4 w-4 text-neutral-500" />;
    }
  };

  return (
    <div 
      className="flex items-center justify-between p-2 hover:bg-neutral-100 rounded-md cursor-pointer transition-colors"
      onClick={() => onView(file)}
    >
      <div className="flex items-center space-x-3">
        {getFileIcon(file.type)}
        <span className="text-sm">{file.name}</span>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-xs text-neutral-500">{file.date}</span>
        <span className="text-xs text-neutral-500">{file.size}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer">
              <Download className="mr-2 h-4 w-4" />
              <span>Download</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Users className="mr-2 h-4 w-4" />
              <span>Share</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Copy className="mr-2 h-4 w-4" />
              <span>Copy Link</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

interface FolderProps {
  folder: FolderType;
  level?: number;
}

const Folder = ({ folder, level = 0 }: FolderProps) => {
  return (
    <AccordionItem value={`folder-${folder.id}`} className="border-none">
      <AccordionTrigger className="hover:bg-neutral-100 rounded-md px-2 py-2">
        <div className="flex items-center space-x-2">
          <FolderOpen className={`h-5 w-5 ${level === 0 ? 'text-amber-500' : 'text-amber-400'}`} />
          <span>{folder.name}</span>
          {folder.shared && (
            <Badge variant="outline" className="ml-2 py-0 px-2 h-5 font-normal">
              <Users className="h-3 w-3 mr-1" /> Shared
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-1 pb-2">
        <div className="space-y-1 pl-6">
          {/* Files in this folder */}
          {folder.files.map((file) => (
            <FileItem key={file.id} file={file} onView={() => console.log("Viewing file:", file.name)} />
          ))}
          
          {/* Subfolders */}
          {folder.subfolders && folder.subfolders.length > 0 && (
            <div className="pt-2">
              <Accordion type="multiple" className="space-y-2">
                {folder.subfolders.map((subfolder) => (
                  <Folder key={subfolder.id} folder={subfolder} level={level + 1} />
                ))}
              </Accordion>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

const FilingCabinet = () => {
  const [, setSelectedFile] = useState<FileItem | null>(null);

  const handleFileView = (file: FileItem) => {
    setSelectedFile(file);
    // In a real application, this would open the file or show file details
    console.log("Opening file:", file.name);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Your Files</h3>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" className="flex items-center gap-1">
            <Edit className="h-4 w-4" />
            New Folder
          </Button>
        </div>
      </div>
      
      <div className="relative">
        <div 
          className="absolute -left-6 -right-6 top-0 opacity-20 pointer-events-none"
          style={{ 
            backgroundImage: "url('/images/filing-cabinet.svg')", 
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "contain",
            height: "500px",
            zIndex: -1
          }}
        />
        
        <ScrollArea className="h-[400px] pr-4">
          <Accordion type="multiple" className="space-y-2">
            {mockFolders.map((folder) => (
              <Folder key={folder.id} folder={folder} />
            ))}
          </Accordion>
        </ScrollArea>
      </div>
    </div>
  );
};

export default FilingCabinet;