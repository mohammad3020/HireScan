import { useMemo } from 'react';
import { 
  Briefcase, 
  Users, 
  Upload, 
  TrendingUp,
  CheckCircle,
  FileText
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { mockJobs } from './jobsData';
import { mockCandidates } from './Review';

// Calculate KPI data from actual data
const calculateKPIs = () => {
  const totalJobs = mockJobs.length;
  const totalCandidates = mockCandidates.length;
  const activeJobs = mockJobs.filter(job => job.status === 'active').length;
  
  const allScores = mockCandidates.map(c => c.score);
  const averageScore = allScores.length > 0 
    ? Math.round((allScores.reduce((sum, score) => sum + score, 0) / allScores.length) * 10) / 10
    : 0;

  return {
    totalJobs,
    totalCandidates,
    activeJobs,
    averageScore,
  };
};

// Calculate score distribution
const calculateScoreDistribution = () => {
  const distribution = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0,
  };

  mockCandidates.forEach(candidate => {
    const score = candidate.score;
    if (score >= 81) distribution['81-100']++;
    else if (score >= 61) distribution['61-80']++;
    else if (score >= 41) distribution['41-60']++;
    else if (score >= 21) distribution['21-40']++;
    else distribution['0-20']++;
  });

  return Object.entries(distribution).map(([score, count]) => ({
    score,
    count,
  }));
};

// Calculate candidates by status
const calculateCandidatesByStatus = () => {
  const statusCounts = {
    qualified: 0,
    in_process: 0,
    new: 0,
  };

  mockCandidates.forEach(candidate => {
    statusCounts[candidate.status as keyof typeof statusCounts]++;
  });

  return [
    { name: 'Qualified', value: statusCounts.qualified, color: '#10B981' },
    { name: 'In Process', value: statusCounts.in_process, color: '#F59E0B' },
    { name: 'New', value: statusCounts.new, color: '#3B82F6' },
  ];
};

// Calculate jobs by department
const calculateJobsByDepartment = () => {
  const departmentCounts: Record<string, number> = {};
  
  mockJobs.forEach(job => {
    departmentCounts[job.department] = (departmentCounts[job.department] || 0) + 1;
  });

  return Object.entries(departmentCounts).map(([name, value]) => ({
    name,
    value,
  }));
};

// Calculate candidate trend (by month based on job creation dates)
const calculateCandidateTrend = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const trend: { month: string; candidates: number }[] = [];

  // Group candidates by their job's creation month
  months.forEach((month, index) => {
    const monthNum = index + 1;
    const candidates = mockCandidates.filter(candidate => {
      const job = mockJobs.find(j => j.id === candidate.jobId);
      if (!job) return false;
      const jobDate = new Date(job.created_at);
      return jobDate.getMonth() + 1 === monthNum;
    }).length;
    
    trend.push({ month, candidates });
  });

  return trend;
};

// Calculate candidates per job
const calculateCandidatesPerJob = () => {
  return mockJobs.map(job => {
    const candidates = mockCandidates.filter(c => c.jobId === job.id);
    const avgScore = candidates.length > 0
      ? Math.round((candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length) * 10) / 10
      : 0;
    
    return {
      name: job.title.length > 15 ? job.title.substring(0, 15) + '...' : job.title,
      candidates: candidates.length,
      avgScore,
    };
  });
};

// Generate recent activity based on actual data
const generateRecentActivity = () => {
  const activities = [];
  
  // Get most recent jobs
  const recentJobs = [...mockJobs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 2);

  recentJobs.forEach((job, index) => {
    const candidates = mockCandidates.filter(c => c.jobId === job.id);
    if (candidates.length > 0) {
      activities.push({
        id: index + 1,
        type: 'scored' as const,
        message: `${candidates.length} candidates scored for ${job.title}`,
        time: `${index + 1} hour${index > 0 ? 's' : ''} ago`,
      });
    }
  });

  // Add upload activity
  activities.push({
    id: activities.length + 1,
    type: 'upload' as const,
    message: `New batch uploaded: ${mockCandidates.length} resumes`,
    time: '2 hours ago',
  });

  // Add ranking activity
  const topJob = mockJobs.reduce((prev, current) => 
    (current.candidates > prev.candidates ? current : prev)
  );
  activities.push({
    id: activities.length + 1,
    type: 'ranked' as const,
    message: `Ranking refreshed for ${topJob.title}`,
    time: '3 hours ago',
  });

  return activities.sort((a, b) => {
    const timeA = parseInt(a.time);
    const timeB = parseInt(b.time);
    return timeA - timeB;
  });
};

const COLORS = ['#0B1E39', '#F1C40F', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6'];

export const Dashboard = () => {
  const kpiData = useMemo(() => calculateKPIs(), []);
  const scoreDistribution = useMemo(() => calculateScoreDistribution(), []);
  const candidatesByStatus = useMemo(() => calculateCandidatesByStatus(), []);
  const jobsByDepartment = useMemo(() => calculateJobsByDepartment(), []);
  const candidateTrend = useMemo(() => calculateCandidateTrend(), []);
  const candidatesPerJob = useMemo(() => calculateCandidatesPerJob(), []);
  const recentActivity = useMemo(() => generateRecentActivity(), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your recruiting.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Jobs</p>
              <p className="text-3xl font-bold text-primary mt-2">{kpiData.totalJobs}</p>
              <p className="text-xs text-gray-500 mt-1">{kpiData.activeJobs} active</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Candidates</p>
              <p className="text-3xl font-bold text-primary mt-2">{kpiData.totalCandidates}</p>
              <p className="text-xs text-gray-500 mt-1">Across all positions</p>
            </div>
            <div className="p-3 bg-secondary/20 rounded-xl">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Jobs</p>
              <p className="text-3xl font-bold text-primary mt-2">{kpiData.activeJobs}</p>
              <p className="text-xs text-gray-500 mt-1">Currently open</p>
            </div>
            <div className="p-3 bg-secondary/20 rounded-xl">
              <FileText className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Score</p>
              <p className="text-3xl font-bold text-primary mt-2">{kpiData.averageScore}%</p>
              <p className="text-xs text-gray-500 mt-1">All candidates</p>
            </div>
            <div className="p-3 bg-secondary/20 rounded-xl">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
              <XAxis dataKey="score" stroke="#6C757D" />
              <YAxis stroke="#6C757D" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E9ECEF',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="count" fill="#0B1E39" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Candidates by Status */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Candidates by Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={candidatesByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {candidatesByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs by Department */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Jobs by Department</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={jobsByDepartment}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
              <XAxis dataKey="name" stroke="#6C757D" />
              <YAxis stroke="#6C757D" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E9ECEF',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="value" fill="#F1C40F" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Candidates per Job */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Candidates per Job</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={candidatesPerJob}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
              <XAxis dataKey="name" stroke="#6C757D" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#6C757D" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E9ECEF',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="candidates" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Candidate Trend */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Candidate Trend (by Job Creation Month)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={candidateTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
            <XAxis dataKey="month" stroke="#6C757D" />
            <YAxis stroke="#6C757D" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #E9ECEF',
                borderRadius: '8px'
              }} 
            />
            <Line 
              type="monotone" 
              dataKey="candidates" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ fill: '#3B82F6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="p-2 bg-primary/10 rounded-lg">
                {activity.type === 'upload' && <Upload className="h-4 w-4 text-primary" />}
                {activity.type === 'parsed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                {activity.type === 'scored' && <TrendingUp className="h-4 w-4 text-primary" />}
                {activity.type === 'ranked' && <Users className="h-4 w-4 text-primary" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
