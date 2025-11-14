import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload as UploadIcon,
  X,
  File,
  CheckCircle,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { mockJobs } from './jobsData';

interface FileWithPreview extends File {
  preview?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

export const Upload = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Get jobId from query parameter, or default to first job
  const jobIdFromQuery = searchParams.get('jobId');
  const initialJobId = jobIdFromQuery ? Number(jobIdFromQuery) : (mockJobs[0]?.id ?? 0);
  const [selectedJobId, setSelectedJobId] = useState<number>(initialJobId);

  // Update selectedJobId when query parameter changes
  useEffect(() => {
    if (jobIdFromQuery) {
      const jobId = Number(jobIdFromQuery);
      if (!isNaN(jobId) && mockJobs.some(job => job.id === jobId)) {
        setSelectedJobId(jobId);
      }
    }
  }, [jobIdFromQuery]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFile = (file: File): boolean => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    return validTypes.includes(file.type) || validExtensions.includes(fileExtension);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(validateFile);
    
    if (validFiles.length !== droppedFiles.length) {
      alert('Some files were rejected. Only PDF, DOC, and DOCX files are allowed.');
    }

    const newFiles = validFiles.map((file) => ({
      ...file,
      status: 'pending' as const,
    }));

    setFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > 100) {
        alert('Maximum 100 files allowed. Only the first 100 will be processed.');
        return combined.slice(0, 100);
      }
      return combined;
    });
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(validateFile);
    
    if (validFiles.length !== selectedFiles.length) {
      alert('Some files were rejected. Only PDF, DOC, and DOCX files are allowed.');
    }

    const newFiles = validFiles.map((file) => ({
      ...file,
      status: 'pending' as const,
    }));

    setFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > 100) {
        alert('Maximum 100 files allowed. Only the first 100 will be processed.');
        return combined.slice(0, 100);
      }
      return combined;
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    
    // Mock upload - simulate processing
    setTimeout(() => {
      setUploading(false);
      // Navigate to processing status page
      navigate('/processing/1');
    }, 2000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Resumes</h1>
        <p className="text-gray-600 mt-1">Upload resumes in batch (PDF, DOC, DOCX - Max 100 files)</p>
      </div>

      {/* Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-card p-12 text-center transition-colors ${
          isDragging
            ? 'border-secondary bg-secondary/10'
            : 'border-gray-300 bg-white hover:border-primary hover:bg-gray-50'
        }`}
      >
        <UploadIcon className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-secondary' : 'text-gray-400'}`} />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isDragging ? 'Drop files here' : 'Drag and drop files here'}
        </h3>
        <p className="text-gray-600 mb-4">or</p>
        <label className="btn-primary inline-flex items-center cursor-pointer">
          <UploadIcon className="h-5 w-5 mr-2" />
          Select Files
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
        <p className="text-sm text-gray-500 mt-4">
          Supported formats: PDF, DOC, DOCX (Max 100 files)
        </p>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Selected Files ({files.length}/100)
              </h2>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload & Process'}
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {files.map((file, index) => (
              <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <File className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {file.status === 'pending' && (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Pending
                      </span>
                    )}
                    {file.status === 'processing' && (
                      <Loader className="h-4 w-4 text-blue-600 animate-spin" />
                    )}
                    {file.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {file.status === 'failed' && (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

