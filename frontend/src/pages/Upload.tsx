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

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(validateFile);
    
    if (validFiles.length !== droppedFiles.length) {
      alert('برخی فایل‌ها رد شدند. فقط فایل‌های PDF، DOC و DOCX مجاز هستند.');
    }

    if (validFiles.length === 0) return;

    // اضافه کردن فایل‌ها
    const newFiles = validFiles.map((file) => {
      const fileWithStatus = file as FileWithPreview;
      fileWithStatus.status = 'pending';
      return fileWithStatus;
    });

    setFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > 50) {
        alert('حداکثر 50 فایل مجاز است. لطفا رزومه‌ها را 50 تا 50 تا آپلود کنید.');
        return prev;
      }
      return combined;
    });
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(validateFile);
    
    if (validFiles.length !== selectedFiles.length) {
      alert('برخی فایل‌ها رد شدند. فقط فایل‌های PDF، DOC و DOCX مجاز هستند.');
    }

    if (validFiles.length === 0) return;

    // اضافه کردن فایل‌ها
    const newFiles = validFiles.map((file) => {
      const fileWithStatus = file as FileWithPreview;
      fileWithStatus.status = 'pending';
      return fileWithStatus;
    });

    setFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > 50) {
        alert('حداکثر 50 فایل مجاز است. لطفا رزومه‌ها را 50 تا 50 تا آپلود کنید.');
        return prev;
      }
      return combined;
    });

    // Reset input
    e.target.value = '';
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

      // Update files to show they're being processed
      setFiles((prev) => {
        prev.forEach((file) => {
          (file as any).status = 'processing';
        });
        return [...prev];
      });

      // Show success message
      setUploadSuccess(
        result.message || `Uploaded ${files.length} files. Processing started.`
      );

      // Navigate to processing page if batch_id exists
      if (result.batch_id) {
        setTimeout(() => {
          const url = jobId 
            ? `/processing/${result.batch_id}?jobId=${jobId}`
            : `/processing/${result.batch_id}`;
          navigate(url);
        }, 1500);
      } else {
        setUploadError('Batch ID not returned. Please check the upload status.');
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
        <h1 className="text-3xl font-bold text-gray-800">Upload Resumes</h1>
        <p className="text-gray-700 mt-1">Upload resumes in batch (PDF, DOC, DOCX - Max 50 files)</p>
      </div>

      {/* Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-card p-12 text-center transition-colors backdrop-blur-md ${
          isDragging
            ? 'border-secondary/60 bg-secondary/20 backdrop-blur-lg'
            : 'border-white/40 bg-white/30 hover:border-white/60 hover:bg-white/40'
        }`}
      >
        <UploadIcon className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-secondary' : 'text-gray-700'}`} />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {isDragging ? 'Drop files here' : 'Drag and drop files here'}
        </h3>
        <p className="text-gray-700 mb-4">or</p>
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
        <p className="text-sm text-gray-600 mt-4">
          Supported formats: PDF, DOC, DOCX (Max 50 files)
        </p>
      </div>

      {/* Success/Error Messages */}
      {uploadSuccess && (
        <div className="card p-4 bg-green-100/80 backdrop-blur-md border border-green-300/60">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-700" />
            <p className="text-sm font-medium text-green-800">{uploadSuccess}</p>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="card p-4 bg-red-100/80 backdrop-blur-md border border-red-300/60">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-700" />
            <p className="text-sm font-medium text-red-800">{uploadError}</p>
          </div>
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="card">
          <div className="p-6 border-b border-white/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Selected Files ({files.length}/50)
                </h2>
                {jobId && (
                  <p className="text-sm text-gray-600 mt-1">
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
          <div className="divide-y divide-white/20 max-h-96 overflow-y-auto">
            {files.map((file, index) => (
              <div key={index} className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="p-2 bg-white/40 backdrop-blur-md rounded-lg border border-white/50">
                    <FileIcon className="h-5 w-5 text-gray-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-600">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* نمایش وضعیت آپلود */}
                    {file.status === 'pending' && (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100/80 backdrop-blur-md text-yellow-800 rounded-full border border-yellow-300/50">
                        در انتظار
                      </span>
                    )}
                    {file.status === 'processing' && (
                      <div className="flex items-center space-x-2">
                        <Loader className="h-4 w-4 text-blue-700 animate-spin" />
                        <span className="text-xs text-blue-700">در حال پردازش...</span>
                      </div>
                    )}
                    {file.status === 'completed' && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-700" />
                        <span className="text-xs text-green-700">تکمیل شد</span>
                      </div>
                    )}
                    {file.status === 'failed' && (
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-700" />
                        <span className="text-xs text-red-700">ناموفق</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-4 p-2 text-gray-600 hover:text-red-700 hover:bg-red-100/60 backdrop-blur-md rounded-lg transition-colors border border-transparent hover:border-red-300/50"
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

