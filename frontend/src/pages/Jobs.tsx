import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Briefcase } from 'lucide-react';

// Mock data
const mockJobs = [
  {
    id: 1,
    title: 'Senior Software Engineer',
    department: 'Engineering',
    candidates: 24,
    averageScore: 82.5,
    status: 'active',
    created_at: '2024-01-15',
  },
  {
    id: 2,
    title: 'Product Manager',
    department: 'Product',
    candidates: 18,
    averageScore: 75.3,
    status: 'active',
    created_at: '2024-01-20',
  },
  {
    id: 3,
    title: 'UX Designer',
    department: 'Design',
    candidates: 32,
    averageScore: 88.1,
    status: 'active',
    created_at: '2024-02-01',
  },
  {
    id: 4,
    title: 'Data Scientist',
    department: 'Engineering',
    candidates: 15,
    averageScore: 79.4,
    status: 'active',
    created_at: '2024-02-10',
  },
];

export const Jobs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');

  const filteredJobs = mockJobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || job.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const departments = ['all', ...Array.from(new Set(mockJobs.map((j) => j.department)))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Descriptions</h1>
          <p className="text-gray-600 mt-1">Manage your job postings and requirements</p>
        </div>
        <Link
          to="/jobs/new"
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Job
        </Link>
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
              className="input-field pl-10 appearance-none bg-white"
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
      <div className="card overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredJobs.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No jobs found</p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      <span className="badge-success">
                        {job.status}
                      </span>
                    </div>
                    <div className="ml-11 flex items-center space-x-4 text-sm text-gray-600">
                      <span className="font-medium">{job.department}</span>
                      <span className="text-gray-300">•</span>
                      <span>{job.candidates} candidates</span>
                      <span className="text-gray-300">•</span>
                      <span>Avg. Score: <span className="font-semibold text-primary">{job.averageScore}%</span></span>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-500">Created: {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="h-5 w-5" />
                    </Link>
                    <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

