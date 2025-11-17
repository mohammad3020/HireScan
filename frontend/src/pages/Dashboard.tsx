import { useMemo } from 'react';
import { 
  Briefcase, 
  Users, 
  Upload, 
  TrendingUp,
  CheckCircle,
  FileText,
  Loader,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useDashboard } from '../api/dashboard';

const COLORS = ['#0B1E39', '#F1C40F', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6'];

export const Dashboard = () => {
  const { data: dashboardData, isLoading, error, isError } = useDashboard();

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your recruiting.</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError || error || !dashboardData) {
    const errorMessage = (error as any)?.userMessage || 
                        (error instanceof Error ? error.message : '') ||
                        'Unknown error';
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your recruiting.</p>
        </div>
        <div className="card p-6 bg-red-50 border border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error loading dashboard</p>
              <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 btn-primary text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Extract data from API response
  const kpiData = dashboardData.kpis;
  const scoreDistribution = dashboardData.score_distribution || [];
  const candidatesByStatus = dashboardData.candidates_by_status || [];
  const jobsByDepartment = dashboardData.jobs_by_department || [];
  const candidateTrend = dashboardData.candidate_trend || [];
  const candidatesPerJob = dashboardData.candidates_per_job || [];
  const recentActivity = dashboardData.recent_activity || [];

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
              <p className="text-3xl font-bold text-primary mt-2">{kpiData.total_jobs}</p>
              <p className="text-xs text-gray-500 mt-1">{kpiData.active_jobs} active</p>
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
              <p className="text-3xl font-bold text-primary mt-2">{kpiData.total_candidates}</p>
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
              <p className="text-3xl font-bold text-primary mt-2">{kpiData.active_jobs}</p>
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
              <p className="text-3xl font-bold text-primary mt-2">{kpiData.average_score}%</p>
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
          {candidatesByStatus && candidatesByStatus.length > 0 && candidatesByStatus.some(item => item.value > 0) ? (
            <div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={candidatesByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
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
              {/* Custom Legend */}
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {candidatesByStatus.map((entry, index) => (
                  <div key={`legend-${index}`} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-gray-700">
                      {entry.name} ({entry.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No candidate data available</p>
              </div>
            </div>
          )}
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
              <Bar dataKey="job_count" fill="#F1C40F" radius={[8, 8, 0, 0]} />
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
