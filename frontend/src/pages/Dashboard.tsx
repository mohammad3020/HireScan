import { 
  Briefcase, 
  Users, 
  Upload, 
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// Mock data
const kpiData = {
  totalJobs: 12,
  totalCandidates: 156,
  activeBatches: 3,
  averageScore: 78.5,
};

const recentActivity = [
  { id: 1, type: 'upload', message: 'New batch uploaded: 25 resumes', time: '2 minutes ago' },
  { id: 2, type: 'parsed', message: 'Resume parsing completed for John Doe', time: '15 minutes ago' },
  { id: 3, type: 'scored', message: 'Candidates scored for Software Engineer position', time: '1 hour ago' },
  { id: 4, type: 'ranked', message: 'Ranking refreshed for Product Manager role', time: '2 hours ago' },
];

const scoreDistribution = [
  { score: '0-20', count: 5 },
  { score: '21-40', count: 12 },
  { score: '41-60', count: 28 },
  { score: '61-80', count: 45 },
  { score: '81-100', count: 66 },
];

const candidateTrend = [
  { month: 'Jan', candidates: 45 },
  { month: 'Feb', candidates: 52 },
  { month: 'Mar', candidates: 48 },
  { month: 'Apr', candidates: 61 },
  { month: 'May', candidates: 55 },
  { month: 'Jun', candidates: 68 },
];

export const Dashboard = () => {
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
            </div>
            <div className="p-3 bg-secondary/20 rounded-xl">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Batches</p>
              <p className="text-3xl font-bold text-primary mt-2">{kpiData.activeBatches}</p>
            </div>
            <div className="p-3 bg-secondary/20 rounded-xl">
              <Upload className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Score</p>
              <p className="text-3xl font-bold text-primary mt-2">{kpiData.averageScore}%</p>
            </div>
            <div className="p-3 bg-secondary/20 rounded-xl">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
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

        {/* Candidate Trend */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Candidate Trend</h2>
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
                stroke="#F1C40F" 
                strokeWidth={3}
                dot={{ fill: '#F1C40F', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
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

