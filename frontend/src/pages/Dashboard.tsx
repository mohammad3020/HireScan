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
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-700 mt-1">Welcome back! Here's what's happening with your recruiting.</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader className="h-8 w-8 animate-spin text-gray-800" />
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
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-700 mt-1">Welcome back! Here's what's happening with your recruiting.</p>
        </div>
        <div className="card p-6 bg-red-100/80 backdrop-blur-md border border-red-300/60">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-700" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error loading dashboard</p>
              <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
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
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-700 mt-1">Welcome back! Here's what's happening with your recruiting.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Total Jobs</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{kpiData.total_jobs}</p>
              <p className="text-xs text-gray-600 mt-1">{kpiData.active_jobs} active</p>
            </div>
            <div className="p-3 bg-white/40 backdrop-blur-md rounded-xl border border-white/50">
              <Briefcase className="h-6 w-6 text-gray-800" />
            </div>
          </div>
        </div>

        <div className="card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Total Candidates</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{kpiData.total_candidates}</p>
              <p className="text-xs text-gray-600 mt-1">Across all positions</p>
            </div>
            <div className="p-3 bg-white/40 backdrop-blur-md rounded-xl border border-white/50">
              <Users className="h-6 w-6 text-gray-800" />
            </div>
          </div>
        </div>

        <div className="card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Active Jobs</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{kpiData.active_jobs}</p>
              <p className="text-xs text-gray-600 mt-1">Currently open</p>
            </div>
            <div className="p-3 bg-white/40 backdrop-blur-md rounded-xl border border-white/50">
              <FileText className="h-6 w-6 text-gray-800" />
            </div>
          </div>
        </div>

        <div className="card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Avg. Score</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{kpiData.average_score}%</p>
              <p className="text-xs text-gray-600 mt-1">All candidates</p>
            </div>
            <div className="p-3 bg-white/40 backdrop-blur-md rounded-xl border border-white/50">
              <TrendingUp className="h-6 w-6 text-gray-800" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Score Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="score" stroke="rgba(31,41,55,0.7)" />
              <YAxis stroke="rgba(31,41,55,0.7)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.4)', 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: '8px',
                  color: '#1f2937'
                }} 
              />
              <Bar dataKey="count" fill="rgba(31, 41, 55, 0.7)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Candidates by Status */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Candidates by Status</h2>
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
            <div className="flex items-center justify-center h-[300px] text-gray-600">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-gray-700">No candidate data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs by Department */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Jobs by Department</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={jobsByDepartment}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="name" stroke="rgba(31,41,55,0.7)" />
              <YAxis stroke="rgba(31,41,55,0.7)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.4)', 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: '8px',
                  color: '#1f2937'
                }} 
              />
              <Bar dataKey="job_count" fill="rgba(241, 196, 15, 0.9)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Candidates per Job */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Candidates per Job</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={candidatesPerJob}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="name" stroke="rgba(31,41,55,0.7)" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="rgba(31,41,55,0.7)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.4)', 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: '8px',
                  color: '#1f2937'
                }} 
              />
              <Bar dataKey="candidates" fill="rgba(16, 185, 129, 0.9)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Candidate Trend */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Candidate Trend (by Job Creation Month)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={candidateTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis dataKey="month" stroke="rgba(31,41,55,0.7)" />
            <YAxis stroke="rgba(31,41,55,0.7)" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.4)', 
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '8px',
                color: '#1f2937'
              }} 
            />
            <Line 
              type="monotone" 
              dataKey="candidates" 
              stroke="rgba(59, 130, 246, 1)" 
              strokeWidth={3}
              dot={{ fill: 'rgba(59, 130, 246, 1)', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4 p-4 bg-white/30 backdrop-blur-md rounded-lg hover:bg-white/40 transition-colors border border-white/40">
              <div className="p-2 bg-white/40 backdrop-blur-md rounded-lg border border-white/50">
                {activity.type === 'upload' && <Upload className="h-4 w-4 text-gray-800" />}
                {activity.type === 'parsed' && <CheckCircle className="h-4 w-4 text-green-700" />}
                {activity.type === 'scored' && <TrendingUp className="h-4 w-4 text-gray-800" />}
                {activity.type === 'ranked' && <Users className="h-4 w-4 text-gray-800" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{activity.message}</p>
                <p className="text-xs text-gray-600 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
