import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Download,
  User,
  TrendingUp,
  ArrowUpDown,
  StickyNote,
  Sparkles,
  Star,
} from 'lucide-react';

type CandidateStatus = 'qualified' | 'in_process' | 'new';

type Candidate = {
  id: number;
  jobId: number;
  name: string;
  email: string;
  score: number;
  experienceScore: number;
  educationScore: number;
  rank: number;
  status: CandidateStatus;
  experienceYears: number;
  skillset: string;
  skills: string[];
  notes: string;
  aiSummary: string;
  isFavorite: boolean;
};

const mockCandidates: Candidate[] = [
  {
    id: 1,
    jobId: 1,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    score: 92,
    experienceScore: 90,
    educationScore: 88,
    rank: 1,
    status: 'qualified',
    experienceYears: 7,
    skillset: 'Frontend Engineering',
    skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
    notes: 'Great cultural fit. Strong leadership qualities.',
    aiSummary: 'High match: exceeds role requirements with strong frontend expertise.',
    isFavorite: true,
  },
  {
    id: 2,
    jobId: 1,
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    score: 88,
    experienceScore: 84,
    educationScore: 86,
    rank: 2,
    status: 'qualified',
    experienceYears: 5,
    skillset: 'Fullstack Development',
    skills: ['React', 'Python', 'Docker'],
    notes: 'Needs deeper knowledge in DevOps practices.',
    aiSummary: 'Good match: strong technical base, minor gaps in ops.',
    isFavorite: false,
  },
  {
    id: 3,
    jobId: 1,
    name: 'Emma Williams',
    email: 'emma.williams@example.com',
    score: 85,
    experienceScore: 81,
    educationScore: 90,
    rank: 3,
    status: 'in_process',
    experienceYears: 6,
    skillset: 'Frontend Engineering',
    skills: ['Vue', 'JavaScript', 'GraphQL'],
    notes: 'Portfolio is impressive. Schedule system design interview.',
    aiSummary: 'Excellent design thinking, quick learner.',
    isFavorite: true,
  },
  {
    id: 4,
    jobId: 1,
    name: 'David Martinez',
    email: 'david.martinez@example.com',
    score: 78,
    experienceScore: 80,
    educationScore: 75,
    rank: 4,
    status: 'in_process',
    experienceYears: 4,
    skillset: 'Backend Engineering',
    skills: ['Angular', 'TypeScript', 'MongoDB'],
    notes: 'Needs mentoring plan. Has strong backend fundamentals.',
    aiSummary: 'Solid backend engineer with growth potential.',
    isFavorite: false,
  },
  {
    id: 5,
    jobId: 1,
    name: 'Lisa Anderson',
    email: 'lisa.anderson@example.com',
    score: 75,
    experienceScore: 72,
    educationScore: 78,
    rank: 5,
    status: 'new',
    experienceYears: 3,
    skillset: 'Frontend Engineering',
    skills: ['React', 'JavaScript', 'CSS'],
    notes: 'Junior but motivated. Consider for internship track.',
    aiSummary: 'Average match: junior candidate, high enthusiasm.',
    isFavorite: false,
  },
  {
    id: 6,
    jobId: 1,
    name: 'James Wilson',
    email: 'james.wilson@example.com',
    score: 72,
    experienceScore: 70,
    educationScore: 74,
    rank: 6,
    status: 'new',
    experienceYears: 5,
    skillset: 'Frontend Engineering',
    skills: ['React', 'Redux', 'Jest'],
    notes: 'Ask for more testing examples.',
    aiSummary: 'Good testing knowledge, needs broader architecture exposure.',
    isFavorite: false,
  },
];

const jobOptions = [
  {
    id: 1,
    title: 'Senior Software Engineer',
    stats: {
      totalResumes: 52,
      qualified: 18,
      inProcess: 22,
      avgScore: 78.5,
    },
  },
  {
    id: 2,
    title: 'Product Manager',
    stats: {
      totalResumes: 34,
      qualified: 12,
      inProcess: 10,
      avgScore: 74.2,
    },
  },
  {
    id: 3,
    title: 'UX Designer',
    stats: {
      totalResumes: 27,
      qualified: 9,
      inProcess: 8,
      avgScore: 81.1,
    },
  },
];

type SortKey = 'name' | 'score' | 'experienceYears' | 'skills';
type SortKeyExtended = SortKey | 'experienceScore' | 'educationScore' | 'index';
type ActiveBucket = 'all' | 'shortlisted' | 'favorite';

const scoreClasses = (value: number) => {
  if (value >= 90) return 'border-blue-300 bg-blue-50 text-blue-700';
  if (value >= 80) return 'border-green-300 bg-green-50 text-green-700';
  if (value >= 70) return 'border-yellow-300 bg-yellow-50 text-yellow-700';
  if (value >= 50) return 'border-orange-300 bg-orange-50 text-orange-700';
  return 'border-red-300 bg-red-50 text-red-700';
};

const ScoreBadge = ({ value }: { value: number }) => (
  <div
    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold ${scoreClasses(
      value
    )}`}
  >
    {value}
  </div>
);

export const Review = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(jobOptions[0].id);
  const [sortKey, setSortKey] = useState<SortKeyExtended>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [openNotesId, setOpenNotesId] = useState<number | null>(null);
  const [openAiId, setOpenAiId] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<Record<number, boolean>>(
    () =>
      mockCandidates.reduce<Record<number, boolean>>((acc, candidate) => {
        acc[candidate.id] = candidate.isFavorite;
        return acc;
      }, {})
  );
  const [activeBucket, setActiveBucket] = useState<ActiveBucket>('all');

  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenNotesId(null);
      setOpenAiId(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const job = jobOptions.find((option) => option.id === selectedJob) ?? jobOptions[0];
  const jobCandidates = useMemo(
    () => mockCandidates.filter((candidate) => candidate.jobId === selectedJob),
    [selectedJob]
  );

  const totalResumes = jobCandidates.length;

  const shortListedCount = useMemo(
    () => jobCandidates.filter((candidate) => candidate.status === 'qualified').length,
    [jobCandidates]
  );

  const favoriteCount = useMemo(
    () => jobCandidates.filter((candidate) => favorites[candidate.id]).length,
    [jobCandidates, favorites]
  );

  const handleSort = (key: SortKeyExtended) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection(key === 'name' ? 'asc' : 'desc');
    }
  };

  const searchedCandidates = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return jobCandidates;

    return jobCandidates.filter((candidate) => {
      return (
        candidate.name.toLowerCase().includes(term) ||
        candidate.email.toLowerCase().includes(term) ||
        candidate.skillset.toLowerCase().includes(term) ||
        candidate.skills.some((skill) => skill.toLowerCase().includes(term))
      );
    });
  }, [jobCandidates, searchTerm]);

  const bucketFilteredCandidates = useMemo(() => {
    switch (activeBucket) {
      case 'shortlisted':
        return searchedCandidates.filter((candidate) => candidate.status === 'qualified');
      case 'favorite':
        return searchedCandidates.filter((candidate) => favorites[candidate.id]);
      default:
        return searchedCandidates;
    }
  }, [searchedCandidates, activeBucket, favorites]);

  const sortedCandidates = useMemo(() => {
    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...bucketFilteredCandidates].sort((a, b) => {
      if (sortKey === 'name') {
        return a.name.localeCompare(b.name) * dir;
      }
      if (sortKey === 'skills') {
        return (a.skills.length - b.skills.length) * dir;
      }
      return ((a as any)[sortKey] - (b as any)[sortKey]) * dir;
    });
  }, [bucketFilteredCandidates, sortKey, sortDirection]);

  const SortableHeader = ({
    label,
    columnKey,
  }: {
    label: string;
    columnKey: SortKeyExtended;
  }) => (
    <button
      type="button"
      onClick={() => handleSort(columnKey)}
      className="group inline-flex items-center space-x-1 text-sm font-semibold text-gray-600 hover:text-primary"
    >
      <span>{label}</span>
      <ArrowUpDown
        className={`h-4 w-4 transition ${
          sortKey === columnKey ? 'text-primary' : 'text-gray-300 group-hover:text-gray-400'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review Candidates Dashboard</h1>
        <p className="mt-1 text-gray-600">
          Monitor candidate progress, compare scores, and take quick actions for each applicant.
        </p>
      </div>
      {/* Header */}
      <div className="card border border-gray-200 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Job Position
            </label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(Number(e.target.value))}
              className="input-field h-12 w-full md:w-96 text-base font-medium text-gray-800"
            >
              {jobOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3"></div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div
            onClick={() => setActiveBucket('all')}
            className={`cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 transition ${
              activeBucket === 'all' ? 'ring-2 ring-primary/40' : ''
            }`}
          >
            <p className="text-xs font-medium uppercase text-gray-500">Total Resumes</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{totalResumes}</p>
          </div>
          <div
            onClick={() => setActiveBucket('shortlisted')}
            className={`cursor-pointer rounded-2xl border border-green-200 bg-green-50 p-4 transition ${
              activeBucket === 'shortlisted' ? 'ring-2 ring-green-300' : ''
            }`}
          >
            <p className="text-xs font-medium uppercase text-gray-500">Short Listed</p>
            <p className="mt-2 text-2xl font-semibold text-green-700">{shortListedCount}</p>
          </div>
          <div
            onClick={() => setActiveBucket('favorite')}
            className={`cursor-pointer rounded-2xl border border-blue-200 bg-blue-50 p-4 transition ${
              activeBucket === 'favorite' ? 'ring-2 ring-blue-300' : ''
            }`}
          >
            <p className="text-xs font-medium uppercase text-gray-500">Favorite</p>
            <p className="mt-2 text-2xl font-semibold text-blue-700">{favoriteCount}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-gray-500">Avg. Score</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{job.stats.avgScore}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 pr-4"
          />
        </div>
      </div>

      {/* Candidates Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4">
                  <SortableHeader label="Applicant" columnKey="name" />
                </th>
                <th className="px-6 py-4">
                  <SortableHeader label="Overall Score" columnKey="score" />
                </th>
                <th className="px-6 py-4">
                  <SortableHeader label="Experience Score" columnKey="experienceScore" />
                </th>
                <th className="px-6 py-4">
                  <SortableHeader label="Education Score" columnKey="educationScore" />
                </th>
                <th className="px-4 py-4">
                  <SortableHeader label="Skills" columnKey="skills" />
                </th>
                <th className="px-4 py-4 text-center" />
                <th className="px-3 py-4 text-center" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {sortedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                    No candidates found for this job.
                  </td>
                </tr>
              ) : (
                sortedCandidates.map((candidate, index) => (
                  <tr key={candidate.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-400">{index + 1}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFavorites((prev) => ({
                              ...prev,
                              [candidate.id]: !prev[candidate.id],
                            }));
                          }}
                          className={`rounded-full border p-1 transition ${favorites[candidate.id]
                            ? 'border-yellow-300 bg-yellow-100 text-yellow-500 hover:bg-yellow-200'
                            : 'border-gray-200 bg-white text-gray-400 hover:border-yellow-200 hover:bg-yellow-50 hover:text-yellow-500'}`}
                        >
                          <Star className={`h-3.5 w-3.5 ${favorites[candidate.id] ? 'fill-current' : ''}`} />
                        </button>
                        <Link to={`/candidates/${candidate.id}`} className="hover:text-primary">
                          {candidate.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <ScoreBadge value={candidate.score} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <ScoreBadge value={candidate.experienceScore} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <ScoreBadge value={candidate.educationScore} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {candidate.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="relative flex justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenNotesId((prev) => {
                              const next = prev === candidate.id ? null : candidate.id;
                              if (next !== null) {
                                setOpenAiId(null);
                              }
                              return next;
                            });
                          }}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                        >
                        <StickyNote className="h-4 w-4" />
                      </button>
                        {openNotesId === candidate.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 bottom-full z-20 mb-2 w-56 rounded-lg border border-yellow-200 bg-white p-3 text-left text-xs text-gray-700 shadow-lg"
                          >
                            <div className="mb-1 text-xs font-semibold text-yellow-700">Notes</div>
                            <p className="text-sm leading-5">{candidate.notes}</p>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="relative flex justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenAiId((prev) => {
                              const next = prev === candidate.id ? null : candidate.id;
                              if (next !== null) {
                                setOpenNotesId(null);
                              }
                              return next;
                            });
                          }}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-purple-300 bg-purple-50 text-purple-600 hover:bg-purple-100"
                        >
                        <Sparkles className="h-4 w-4" />
                      </button>
                        {openAiId === candidate.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 bottom-full z-20 mb-2 w-56 rounded-lg border border-purple-200 bg-white p-3 text-left text-xs text-gray-700 shadow-lg"
                          >
                            <div className="mb-1 text-xs font-semibold text-purple-700">
                              AI Review
                            </div>
                            <p className="text-sm leading-5">{candidate.aiSummary}</p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-3">
        <button className="btn-outline flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Ranking
        </button>
        <button className="btn-primary flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>
    </div>
  );
};

