import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Loader, File } from 'lucide-react';

// Mock data
const mockBatch = {
  id: 1,
  status: 'processing',
  total_files: 25,
  processed_files: 18,
  created_at: '2024-01-15T10:30:00Z',
  file_items: [
    { id: 1, file: 'resume1.pdf', status: 'completed', candidate: { name: 'John Doe' } },
    { id: 2, file: 'resume2.pdf', status: 'completed', candidate: { name: 'Jane Smith' } },
    { id: 3, file: 'resume3.pdf', status: 'processing', candidate: null },
    { id: 4, file: 'resume4.pdf', status: 'pending', candidate: null },
    { id: 5, file: 'resume5.pdf', status: 'failed', error_message: 'Invalid file format', candidate: null },
  ],
};

export const Processing = () => {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(mockBatch);
  const [progress, setProgress] = useState(72);

  // Simulate progress updates
  useEffect(() => {
    if (batch.status === 'processing') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setBatch({ ...batch, status: 'completed', processed_files: batch.total_files });
            return 100;
          }
          return prev + 2;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [batch.status]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'processing':
        return <Loader className="h-5 w-5 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/upload"
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Processing Batch #{batchId}</h1>
          <p className="text-gray-600 mt-1">Resume parsing in progress</p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Processing Status</h2>
            <p className="text-sm text-gray-600 mt-1">
              {batch.processed_files} of {batch.total_files} files processed
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            batch.status === 'completed' ? 'bg-green-100 text-green-800' :
            batch.status === 'processing' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div
            className="bg-secondary h-4 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 text-center">{progress}% Complete</p>
      </div>

      {/* Files List */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">File Processing Details</h2>
        </div>
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {batch.file_items.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center space-x-4 flex-1">
                <div className={`p-2 rounded-lg ${getStatusColor(item.status)}`}>
                  {getStatusIcon(item.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.file}</p>
                  {item.candidate && (
                    <p className="text-xs text-gray-500">Candidate: {item.candidate.name}</p>
                  )}
                  {item.error_message && (
                    <p className="text-xs text-red-600 mt-1">{item.error_message}</p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {batch.status === 'completed' && (
        <div className="flex items-center justify-end space-x-4">
          <Link
            to="/review"
            className="btn-primary"
          >
            View Results
          </Link>
        </div>
      )}
    </div>
  );
};

