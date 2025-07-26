import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Download, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import ProgressTracker, { ProgressStep } from "@/components/ui/progress-tracker";

interface UploadResponse {
  id: string;
  filename: string;
  status: 'processing' | 'completed' | 'error';
  message?: string;
}

const TaxUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const initializeProgressSteps = () => {
    return [
      {
        id: 'upload',
        title: 'File Upload',
        description: 'Uploading tax return document...',
        status: 'pending' as const,
        progress: 0
      },
      {
        id: 'processing',
        title: 'Document Processing',
        description: 'Extracting tax form information...',
        status: 'pending' as const,
        progress: 0
      },
      {
        id: 'analysis',
        title: 'Tax Analysis',
        description: 'Analyzing tax data and generating organizer...',
        status: 'pending' as const,
        progress: 0
      },
      {
        id: 'complete',
        title: 'Complete',
        description: 'Tax organizer ready for download',
        status: 'pending' as const,
        progress: 0
      }
    ];
  };

  const updateProgress = (stepIndex: number, progress: number, status: 'pending' | 'active' | 'completed' | 'error' = 'active') => {
    setProgressSteps(prev => prev.map((step, index) => 
      index === stepIndex 
        ? { ...step, progress, status }
        : index < stepIndex 
        ? { ...step, status: 'completed' }
        : step
    ));
    setCurrentStep(stepIndex);
    setOverallProgress((stepIndex * 25) + (progress * 0.25));
  };

  const simulateUploadProgress = async () => {
    // Simulate file upload progress
    for (let i = 0; i <= 100; i += 10) {
      updateProgress(0, i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    updateProgress(0, 100, 'completed');
    
    // Simulate document processing
    updateProgress(1, 0);
    for (let i = 0; i <= 100; i += 20) {
      updateProgress(1, i);
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    updateProgress(1, 100, 'completed');
    
    // Simulate tax analysis
    updateProgress(2, 0);
    for (let i = 0; i <= 100; i += 15) {
      updateProgress(2, i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    updateProgress(2, 100, 'completed');
    
    // Complete
    updateProgress(3, 100, 'completed');
    setOverallProgress(100);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({
          title: "Invalid File Type",
          description: "Please select a PDF file.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setUploadResult(null);
      setProgressSteps([]);
      setOverallProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const steps = initializeProgressSteps();
    setProgressSteps(steps);
    setCurrentStep(0);
    setOverallProgress(0);
    
    // Start progress simulation
    const progressPromise = simulateUploadProgress();
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('taxReturn', file);
    formData.append('clientId', '1'); // Default for demo
    formData.append('firmId', '1');   // Default for demo
    formData.append('taxYear', new Date().getFullYear().toString());
    formData.append('clientName', "Tax Client");
    formData.append('filingStatus', "Unknown");

    try {
      const response = await fetch('/api/tax-organizer/extract', {
        method: 'POST',
        body: formData, // Send as FormData, not JSON
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Wait for progress animation to complete
      await progressPromise;
      
      setUploadResult(result);
      
      toast({
        title: "Upload Successful",
        description: "Your tax return has been processed successfully!",
      });
    } catch (error) {
      // Mark current step as error
      setProgressSteps(prev => prev.map((step, index) => 
        index === currentStep ? { ...step, status: 'error' } : step
      ));
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (type: 'professional-report' | 'csv-checklist' | 'enhanced') => {
    if (!uploadResult?.id) return;

    try {
      const response = await fetch(`/api/tax-return/organizer/${uploadResult.id}/${type}`);
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Set filename based on type
      const extension = type === 'csv-checklist' ? 'csv' : 'md';
      a.download = `${uploadResult.filename.replace('.pdf', '')}_${type}.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Started",
        description: `Your ${type.replace('-', ' ')} is downloading.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the report.",
        variant: "destructive",
      });
    }
  };

  const resetUpload = () => {
    setFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">Tax Return Document Extractor</h1>
          <p className="text-neutral-600">
            Upload a prior year tax return PDF to automatically generate a customized tax organizer 
            with specific vendor names and document requirements for your client.
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Tax Return PDF
            </CardTitle>
            <CardDescription>
              Select a PDF file of a completed tax return (Form 1040 and supporting schedules)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="tax-file" className="cursor-pointer">
                <Input
                  id="tax-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
                  <p className="text-sm text-neutral-600">
                    {file ? file.name : "Click to select a PDF file or drag and drop"}
                  </p>
                </div>
              </Label>
            </div>
            
            {file && (
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <Badge variant="secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-primary hover:bg-primary-dark"
                  >
                    {uploading ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Extract Data
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetUpload}>
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Tracker */}
        {progressSteps.length > 0 && (
          <div className="mb-6">
            <ProgressTracker 
              steps={progressSteps}
              currentStep={currentStep}
              overallProgress={overallProgress}
            />
          </div>
        )}

        {/* Results Section */}
        {uploadResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {uploadResult.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : uploadResult.status === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600 animate-spin" />
                )}
                Processing Results
              </CardTitle>
              <CardDescription>
                {uploadResult.status === 'completed' && "Your tax organizer has been generated successfully!"}
                {uploadResult.status === 'processing' && "Analyzing your tax return and generating reports..."}
                {uploadResult.status === 'error' && "There was an error processing your file."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadResult.status === 'completed' && (
                <div className="space-y-4">
                  <p className="text-sm text-neutral-600 mb-4">
                    Choose from the following professional output formats:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() => handleDownload('professional-report')}
                    >
                      <Download className="h-5 w-5" />
                      <div className="text-center">
                        <div className="font-medium">Professional Report</div>
                        <div className="text-xs text-neutral-500">Complete markdown format</div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() => handleDownload('csv-checklist')}
                    >
                      <Download className="h-5 w-5" />
                      <div className="text-center">
                        <div className="font-medium">CSV Checklist</div>
                        <div className="text-xs text-neutral-500">Spreadsheet format</div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() => handleDownload('enhanced')}
                    >
                      <Download className="h-5 w-5" />
                      <div className="text-center">
                        <div className="font-medium">Enhanced Report</div>
                        <div className="text-xs text-neutral-500">Detailed analysis</div>
                      </div>
                    </Button>
                  </div>
                </div>
              )}
              
              {uploadResult.message && (
                <div className="mt-4 p-3 bg-neutral-100 rounded-lg">
                  <p className="text-sm text-neutral-700">{uploadResult.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</div>
              <div>
                <h4 className="font-medium">Upload Tax Return</h4>
                <p className="text-sm text-neutral-600">Upload the client's prior year tax return PDF</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</div>
              <div>
                <h4 className="font-medium">Automatic Analysis</h4>
                <p className="text-sm text-neutral-600">Our system extracts vendor names, forms, and financial details</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</div>
              <div>
                <h4 className="font-medium">Generate Organizer</h4>
                <p className="text-sm text-neutral-600">Receive customized tax organizer with specific document requirements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaxUpload;