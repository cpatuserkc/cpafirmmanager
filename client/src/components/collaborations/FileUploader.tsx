import { useState } from "react";
import { Upload, X, CheckCircle, File, Image, FileText } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

// File types with their associated icons
const fileTypeIcons = {
  pdf: <FileText className="h-8 w-8 text-red-500" />,
  docx: <FileText className="h-8 w-8 text-blue-500" />,
  xlsx: <FileText className="h-8 w-8 text-green-500" />,
  jpg: <Image className="h-8 w-8 text-purple-500" />,
  png: <Image className="h-8 w-8 text-orange-500" />,
  default: <File className="h-8 w-8 text-neutral-500" />
};

interface FileItemProps {
  file: File;
  progress: number;
  onRemove: () => void;
}

const FileItem = ({ file, progress, onRemove }: FileItemProps) => {
  // Get file extension
  const extension = file.name.split('.').pop()?.toLowerCase() || 'default';
  const fileIcon = fileTypeIcons[extension as keyof typeof fileTypeIcons] || fileTypeIcons.default;
  
  const isComplete = progress === 100;
  
  return (
    <div className="flex items-center space-x-4 p-3 bg-neutral-50 rounded-md">
      <div className="flex-shrink-0">
        {fileIcon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-neutral-500">{(file.size / 1024).toFixed(1)} KB</p>
        
        {progress < 100 ? (
          <Progress value={progress} className="h-1 mt-2" />
        ) : (
          <div className="flex items-center mt-1 text-xs text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            <span>Uploaded successfully</span>
          </div>
        )}
      </div>
      <Button 
        size="sm" 
        variant="ghost" 
        className="flex-shrink-0 h-8 w-8 p-0"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Remove</span>
      </Button>
    </div>
  );
};

const FileUploader = () => {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [progresses, setProgresses] = useState<number[]>([]);
  const [destination, setDestination] = useState("client-files");
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
    setProgresses(prev => [...prev, ...selectedFiles.map(() => 0)]);
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setProgresses(prev => prev.filter((_, i) => i !== index));
  };
  
  const simulateUpload = () => {
    setIsUploading(true);
    
    // Simulate upload progress for each file
    const intervals = files.map((_, index) => {
      return setInterval(() => {
        setProgresses(prev => {
          const newProgresses = [...prev];
          
          if (newProgresses[index] < 100) {
            // Random increment between 5 and 15
            const increment = Math.floor(Math.random() * 10) + 5;
            newProgresses[index] = Math.min(newProgresses[index] + increment, 100);
          }
          
          // Check if all uploads are complete
          if (newProgresses.every(p => p === 100)) {
            setIsUploading(false);
            // Clear all intervals
            intervals.forEach(clearInterval);
          }
          
          return newProgresses;
        });
      }, 500);
    });
    
    // Cleanup function to clear intervals if component unmounts during upload
    return () => intervals.forEach(clearInterval);
  };
  
  const handleUpload = () => {
    if (files.length === 0) return;
    
    // In a real implementation, this would upload files to a server
    console.log(`Uploading ${files.length} files to ${destination}`);
    simulateUpload();
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="flex items-center gap-2">
          <Upload size={16} />
          Upload Files
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Upload files to share with your team
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger>
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client-files">Client Files</SelectItem>
                <SelectItem value="tax-documents">Tax Documents</SelectItem>
                <SelectItem value="financial-reports">Financial Reports</SelectItem>
                <SelectItem value="audit-materials">Audit Materials</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="files">Files</Label>
            <div 
              className={`border-2 border-dashed rounded-md p-6 text-center ${
                files.length > 0 ? 'border-neutral-300' : 'border-primary/40'
              }`}
            >
              {files.length === 0 ? (
                <div>
                  <Upload className="mx-auto h-10 w-10 text-neutral-400" />
                  <p className="mt-2 text-sm text-neutral-600">
                    Drag and drop files here or click to browse
                  </p>
                  <label className="mt-4 inline-block">
                    <Input
                      id="files"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button variant="outline" size="sm" className="mx-auto" type="button">
                      Select Files
                    </Button>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <FileItem 
                        key={index} 
                        file={file} 
                        progress={progresses[index]} 
                        onRemove={() => removeFile(index)} 
                      />
                    ))}
                  </div>
                  
                  <label>
                    <Input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button variant="outline" size="sm" type="button">
                      Add More Files
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-neutral-500">
              Maximum file size: 10MB
            </span>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploader;