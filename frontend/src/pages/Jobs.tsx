import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Briefcase, X } from 'lucide-react';
import { useJobs, useDeleteJob, useDepartments, useCreateDepartment, type Job } from '../api/jobs';

export const Jobs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newDepartmentDescription, setNewDepartmentDescription] = useState('');
  
  const { data: jobsResponse, isLoading, error, isError } = useJobs(
    filterDepartment !== 'all' ? { search: searchTerm } : { search: searchTerm }
  );
  const { data: departmentsData, isLoading: isLoadingDepartments, isError: isDepartmentsError } = useDepartments();
  const deleteJobMutation = useDeleteJob();
  const createDepartmentMutation = useCreateDepartment();

  const jobs = jobsResponse?.results || jobsResponse || [];
  
  const filteredJobs = jobs.filter((job: Job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || 
      (filterDepartment && job.department?.toString() === filterDepartment) ||
      job.department_name?.toLowerCase() === filterDepartment.toLowerCase();
    return matchesSearch && matchesDepartment;
  });

  // Ensure departmentsData is an array before mapping
  const departmentsArray = Array.isArray(departmentsData) ? departmentsData : [];
  const departments = ['all', ...(departmentsArray.map(d => d.name) || [])];

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await deleteJobMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete job:', error);
        alert('Failed to delete job. Please try again.');
      }
    }
  };

  const handleCreateDepartment = async () => {
    if (!newDepartmentName.trim()) {
      alert('Department name is required');
      return;
    }

    try {
      await createDepartmentMutation.mutateAsync({
        name: newDepartmentName.trim(),
        description: newDepartmentDescription.trim() || undefined,
      });
      // Reset form and close modal
      setNewDepartmentName('');
      setNewDepartmentDescription('');
      setIsDepartmentModalOpen(false);
    } catch (error: any) {
      console.error('Failed to create department:', error);
      const errorMessage = error?.response?.data?.name?.[0] || 
                         error?.response?.data?.detail || 
                         error?.message || 
                         'Failed to create department. Please try again.';
      alert(errorMessage);
    }
  };

  if (isLoading || isLoadingDepartments) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Job Positions</h1>
            <p className="text-gray-700 mt-1">Manage your job postings and requirements</p>
          </div>
        </div>
        <div className="card p-12 text-center">
          <p className="text-gray-700">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (isError || isDepartmentsError || error) {
    const errorMessage = (error as any)?.userMessage || 
                        (error instanceof Error ? error.message : '') ||
                        'Error loading jobs. Please try again.';
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Job Positions</h1>
            <p className="text-gray-700 mt-1">Manage your job postings and requirements</p>
          </div>
        </div>
        <div className="card p-12 text-center bg-red-100/80 backdrop-blur-md border border-red-300/60">
          <p className="text-red-800 mb-4">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Job Positions</h1>
          <p className="text-gray-700 mt-1">Manage your job postings and requirements</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDepartmentModalOpen(true)}
            className="btn-outline flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Department
          </button>
          <Link
            to="/jobs/new"
            className="btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Job
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="input-field pl-10 appearance-none"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredJobs.length === 0 ? (
          <div className="col-span-full">
            <div className="card p-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-700">No jobs found</p>
            </div>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              className="card p-6 card-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/40 backdrop-blur-md border border-white/50">
                    <Briefcase className="h-6 w-6 text-gray-800" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
                    <p className="text-sm text-gray-600">{job.department_name || 'No Department'}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Link
                    to={`/jobs/${job.id}`}
                    className="p-2 text-gray-700 hover:text-gray-900 focus:outline-none transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={(e) => handleDelete(job.id, e)}
                    className="p-2 text-gray-700 hover:text-red-700 focus:outline-none transition-colors"
                    disabled={deleteJobMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center space-x-4 text-sm text-gray-700">
                <span className="flex items-center space-x-1">
                  <span className="h-2 w-2 rounded-full bg-gray-600" />
                  <span>{job.location || 'N/A'}</span>
                </span>
                <span className="flex items-center rounded-full bg-green-100/80 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-green-800 border border-green-300/60">
                  Active
                </span>
              </div>

              <div className="mt-6">
                <Link
                  to={`/jobs/${job.id}/profile`}
                  className="block w-full rounded-lg border border-white/50 backdrop-blur-md bg-white/30 px-4 py-2 text-center text-sm font-medium text-gray-800 transition hover:bg-white/40 hover:border-white/60"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Department Modal */}
      {isDepartmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <h2 className="text-xl font-semibold text-gray-800">Create New Department</h2>
              <button
                onClick={() => {
                  setIsDepartmentModalOpen(false);
                  setNewDepartmentName('');
                  setNewDepartmentDescription('');
                }}
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="department-name" className="block text-sm font-medium text-gray-800 mb-2">
                  Department Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="department-name"
                  type="text"
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  placeholder="Enter department name"
                  className="input-field w-full"
                  autoFocus
                />
              </div>
              
              <div>
                <label htmlFor="department-description" className="block text-sm font-medium text-gray-800 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="department-description"
                  value={newDepartmentDescription}
                  onChange={(e) => setNewDepartmentDescription(e.target.value)}
                  placeholder="Enter department description"
                  rows={4}
                  className="input-field w-full resize-none"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/20">
              <button
                onClick={() => {
                  setIsDepartmentModalOpen(false);
                  setNewDepartmentName('');
                  setNewDepartmentDescription('');
                }}
                className="btn-outline"
                disabled={createDepartmentMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDepartment}
                className="btn-primary"
                disabled={createDepartmentMutation.isPending || !newDepartmentName.trim()}
              >
                {createDepartmentMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

