import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { Label } from "@/components/ui/label";

interface FileItemProps {
  file: File;
  progress: number;
  onRemove: () => void;
}

const FileItem = ({ file, progress, onRemove }: FileItemProps) => {
  return (
    <div className="bg-neutral-50 rounded-md p-3 mb-3 relative">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <div className="mr-3">
            <div className="h-10 w-10 bg-neutral-200 rounded flex items-center justify-center">
              <span className="text-xs font-medium text-neutral-600">
                {file.name.split('.').pop()?.toUpperCase()}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium truncate" style={{ maxWidth: "180px" }}>
              {file.name}
            </p>
            <p className="text-xs text-neutral-500">{formatFileSize(file.size)}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Progress value={progress} className="h-1 mt-2" />
    </div>
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileUploader = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const [destination, setDestination] = useState("client-files");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
    
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileRemove = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (files.length === 0) return;
    
    setUploading(true);
    
    // Mock upload progress for demonstration
    files.forEach((file, index) => {
      let uploadProgress = 0;
      const intervalId = setInterval(() => {
        if (uploadProgress >= 100) {
          clearInterval(intervalId);
          
          // Check if all files are uploaded
          const allUploaded = Object.values({
            ...progress,
            [file.name]: 100
          }).every(val => val === 100);
          
          if (allUploaded) {
            setTimeout(() => {
              setUploading(false);
              setFiles([]);
              setProgress({});
              setIsOpen(false);
            }, 500);
          }
        } else {
          uploadProgress += Math.random() * 10;
          if (uploadProgress > 100) uploadProgress = 100;
          
          setProgress(prev => ({
            ...prev,
            [file.name]: Math.round(uploadProgress)
          }));
        }
      }, 300);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Upload size={16} />
          Upload Files
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Add files to your storage or share them with team members.
          </DialogDescription>
        </DialogHeader>
        
        <div 
          className="grid gap-4 py-4"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {files.length === 0 ? (
            <div 
              className="border-2 border-dashed border-neutral-200 rounded-lg p-12 text-center cursor-pointer hover:bg-neutral-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">Drag files here</h3>
              <p className="text-sm text-neutral-500 mb-4">or click to browse</p>
              <Button
                type="button"
                disabled={uploading}
              >
                Select Files
              </Button>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                ref={fileInputRef}
                disabled={uploading}
              />
            </div>
          ) : (
            <div>
              <div className="mb-4">
                {files.map((file, index) => (
                  <FileItem
                    key={`${file.name}-${index}`}
                    file={file}
                    progress={progress[file.name] || 0}
                    onRemove={() => handleFileRemove(index)}
                  />
                ))}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="destination">Destination Folder</Label>
                <Select
                  value={destination}
                  onValueChange={setDestination}
                  disabled={uploading}
                >
                  <SelectTrigger id="destination">
                    <SelectValue placeholder="Select folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client-files">Client Files</SelectItem>
                    <SelectItem value="firm-documents">Firm Documents</SelectItem>
                    <SelectItem value="financial-reports">Financial Reports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          {files.length > 0 && (
            <div className="flex w-full justify-between items-center">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                Add More
              </Button>
              <Button 
                type="button"
                disabled={uploading || files.length === 0}
                onClick={handleUpload}
              >
                {uploading ? 'Uploading...' : 'Upload Files'}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploader;