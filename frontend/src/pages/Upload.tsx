import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload as UploadIcon,
  X,
  File as FileIcon,
  CheckCircle,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { useUploadCV } from '../api/candidates';

interface FileWithPreview extends File {
  preview?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

export const Upload = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  
  const uploadCV = useUploadCV();
  
  // Get jobId from query parameter
  const jobId = searchParams.get('jobId') ? Number(searchParams.get('jobId')) : undefined;

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

    // Preserve File objects and add status property
    const newFiles = validFiles.map((file) => {
      // Add status property directly to the File object
      (file as any).status = 'pending';
      return file;
    });

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

    // Preserve File objects and add status property
    const newFiles = validFiles.map((file) => {
      // Add status property directly to the File object
      (file as any).status = 'pending';
      return file;
    });

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

    setUploadError(null);
    setUploadSuccess(null);
    
    // Update all files to processing status
    setFiles((prev) => {
      prev.forEach((file) => {
        (file as any).status = 'processing';
      });
      return [...prev];
    });

    try {
      // Ensure we're passing actual File objects
      // Now that File is not shadowed, we can use it properly
      const fileObjects = files.filter((f) => {
        // Check if it's a File object by checking for File properties and methods
        return f && 
               typeof f === 'object' && 
               f instanceof File;
      }) as File[];
      
      if (fileObjects.length === 0) {
        throw new Error('No valid file objects found');
      }

      console.log('Uploading files:', fileObjects.map(f => ({ name: f.name, size: f.size, type: f.type })));

      const result = await uploadCV.mutateAsync({
        files: fileObjects,
        jobId: jobId,
      });

      // Update files with results
      setFiles((prev) => {
        // Mark first N files as completed (where N = successful count)
        for (let i = 0; i < result.successful && i < prev.length; i++) {
          (prev[i] as any).status = 'completed';
        }
        // Mark remaining files as failed (if any)
        for (let i = result.successful; i < prev.length; i++) {
          (prev[i] as any).status = 'failed';
        }
        return [...prev];
      });

      // Show success message
      setUploadSuccess(
        `Successfully processed ${result.successful} out of ${files.length} files.` +
        (result.failed > 0 ? ` ${result.failed} files failed.` : '')
      );

      // If batch_id exists, navigate to processing page
      if (result.batch_id) {
        setTimeout(() => {
          navigate(`/processing/${result.batch_id}`);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(
        error.response?.data?.error || 
        error.message || 
        'Failed to upload files. Please try again.'
      );
      
      // Update all files to failed status
      setFiles((prev) => {
        prev.forEach((file) => {
          (file as any).status = 'failed';
        });
        return [...prev];
      });
    }
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

      {/* Success/Error Messages */}
      {uploadSuccess && (
        <div className="card p-4 bg-green-50 border border-green-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">{uploadSuccess}</p>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="card p-4 bg-red-50 border border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">{uploadError}</p>
          </div>
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Selected Files ({files.length}/100)
                </h2>
                {jobId && (
                  <p className="text-sm text-gray-500 mt-1">
                    Job ID: {jobId}
                  </p>
                )}
              </div>
              <button
                onClick={handleUpload}
                disabled={uploadCV.isPending}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadCV.isPending ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin inline" />
                    Uploading & Processing...
                  </>
                ) : (
                  'Upload & Process'
                )}
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {files.map((file, index) => (
              <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileIcon className="h-5 w-5 text-gray-600" />
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
                      <div className="flex items-center space-x-2">
                        <Loader className="h-4 w-4 text-blue-600 animate-spin" />
                        <span className="text-xs text-blue-600">Processing...</span>
                      </div>
                    )}
                    {file.status === 'completed' && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-xs text-green-600">Completed</span>
                      </div>
                    )}
                    {file.status === 'failed' && (
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="text-xs text-red-600">Failed</span>
                      </div>
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

