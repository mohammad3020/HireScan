import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, Download, User, TrendingUp, XCircle } from 'lucide-react';

// Mock data
const mockCandidates = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    score: 92.5,
    rank: 1,
    auto_rejected: false,
    job_title: 'Senior Software Engineer',
    skills: ['React', 'TypeScript', 'Node.js'],
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    score: 88.3,
    rank: 2,
    auto_rejected: false,
    job_title: 'Senior Software Engineer',
    skills: ['Python', 'Django', 'PostgreSQL'],
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    score: 45.2,
    rank: null,
    auto_rejected: true,
    rejection_reason: 'Insufficient experience: 1.5 years (required: 3)',
    job_title: 'Senior Software Engineer',
    skills: ['JavaScript', 'HTML', 'CSS'],
  },
  {
    id: 4,
    name: 'Alice Williams',
    email: 'alice.williams@example.com',
    score: 85.7,
    rank: 3,
    auto_rejected: false,
    job_title: 'Senior Software Engineer',
    skills: ['Java', 'Spring Boot', 'Microservices'],
  },
];

export const Review = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'accepted' | 'rejected'>('all');
  const [selectedJob, setSelectedJob] = useState('1');

  const filteredCandidates = mockCandidates.filter((candidate) => {
    const matchesSearch =
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'accepted' && !candidate.auto_rejected) ||
      (filterStatus === 'rejected' && candidate.auto_rejected);
    return matchesSearch && matchesFilter;
  });

  const acceptedCandidates = filteredCandidates.filter((c) => !c.auto_rejected);
  const rejectedCandidates = filteredCandidates.filter((c) => c.auto_rejected);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Review Candidates</h1>
          <p className="text-gray-600 mt-1">Review and manage candidate rankings</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="input-field"
          >
            <option value="1">Senior Software Engineer</option>
            <option value="2">Product Manager</option>
            <option value="3">UX Designer</option>
          </select>
          <button className="btn-secondary flex items-center">
            <RefreshCw className="h-5 w-5 mr-2" />
            Refresh Ranking
          </button>
          <button className="btn-primary flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Candidates</p>
              <p className="text-3xl font-bold text-primary mt-2">{filteredCandidates.length}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl">
              <User className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Accepted</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{acceptedCandidates.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Auto-Rejected</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{rejectedCandidates.length}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('accepted')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'accepted'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => setFilterStatus('rejected')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="card overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredCandidates.length === 0 ? (
            <div className="p-12 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No candidates found</p>
            </div>
          ) : (
            filteredCandidates.map((candidate) => (
              <Link
                key={candidate.id}
                to={`/candidates/${candidate.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`p-3 rounded-xl ${
                      candidate.auto_rejected ? 'bg-red-100' : 'bg-primary/10'
                    }`}>
                      <User className={`h-6 w-6 ${
                        candidate.auto_rejected ? 'text-red-600' : 'text-primary'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                        {candidate.rank && (
                          <span className="badge bg-secondary/20 text-primary border border-secondary/30">
                            Rank #{candidate.rank}
                          </span>
                        )}
                        {candidate.auto_rejected && (
                          <span className="badge-error">
                            Auto-Rejected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{candidate.email}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm font-medium text-primary">
                          Score: {candidate.score}%
                        </span>
                        <span className="text-sm text-gray-300">•</span>
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      {candidate.rejection_reason && (
                        <p className="text-sm text-red-600 mt-2">{candidate.rejection_reason}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

