import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ArrowUpDown,
  StickyNote,
  Sparkles,
  Star,
} from 'lucide-react';
import { mockCandidates } from './Review';

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

type SortKeyExtended = 'name' | 'score' | 'experienceYears' | 'skills' | 'experienceScore' | 'educationScore' | 'index';
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

interface ReviewCandidatesTabProps {
  jobId: number;
}

export const ReviewCandidatesTab = ({ jobId }: ReviewCandidatesTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
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

  const jobCandidates = useMemo(
    () => mockCandidates.filter((candidate) => candidate.jobId === jobId),
    [jobId]
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

  const avgScore = useMemo(() => {
    if (jobCandidates.length === 0) return 0;
    const sum = jobCandidates.reduce((acc, c) => acc + c.score, 0);
    return Math.round((sum / jobCandidates.length) * 10) / 10;
  }, [jobCandidates]);

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
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
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
          <p className="mt-2 text-2xl font-semibold text-gray-900">{avgScore}</p>
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
    </div>
  );
};

