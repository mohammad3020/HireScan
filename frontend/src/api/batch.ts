import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';

export interface FileItem {
  id: number;
  batch: number;
  file: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string;
  candidate: any;
  created_at: string;
}

export interface BatchUpload {
  id: number;
  user: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_files: number;
  processed_files: number;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  file_items?: FileItem[];
}

export const useBatchUploads = () => {
  return useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      const response = await apiClient.get<BatchUpload[]>('/batch/batches/');
      return response.data;
    },
  });
};

export const useBatchUpload = (id: number) => {
  return useQuery({
    queryKey: ['batches', id],
    queryFn: async () => {
      const response = await apiClient.get<BatchUpload>(`/batch/batches/${id}/`);
      return response.data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      // Poll every 2 seconds if still processing
      const data = query.state.data;
      return data?.status === 'processing' ? 2000 : false;
    },
  });
};

export const useCreateBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<BatchUpload>('/batch/batches/', {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });
};

export const useUploadFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ batchId, files }: { batchId: number; files: File[] }) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await apiClient.post<FileItem[]>(
        `/batch/batches/${batchId}/upload_files/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batches', variables.batchId] });
    },
  });
};

export const useBatchStatus = (id: number) => {
  return useQuery({
    queryKey: ['batches', id, 'status'],
    queryFn: async () => {
      const response = await apiClient.get<BatchUpload>(`/batch/batches/${id}/status/`);
      return response.data;
    },
    enabled: !!id,
    refetchInterval: 2000, // Poll every 2 seconds
  });
};

