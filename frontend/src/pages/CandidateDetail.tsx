import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Wallet,
  Loader,
  AlertCircle,
  Star,
  Tag,
  ChevronDown,
  X,
} from 'lucide-react';
import { useCandidate, useAddNote, useDeleteNote, useUpdateJobScoreCategory } from '../api/candidates';
import type { TimelineEvent } from '../api/candidates';
import { useCandidatesStore } from '../store/candidates';

const scoreClasses = (value: number) => {
  if (value >= 90) return 'border-blue-300 bg-blue-50 text-blue-700';
  if (value >= 80) return 'border-green-300 bg-green-50 text-green-700';
  if (value >= 70) return 'border-yellow-300 bg-yellow-50 text-yellow-700';
  if (value >= 50) return 'border-orange-300 bg-orange-50 text-orange-700';
  return 'border-red-300 bg-red-50 text-red-700';
};

const ScoreBadge = ({ value }: { value?: number | null }) => {
  const isNumber = typeof value === 'number' && !Number.isNaN(value);
  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold backdrop-blur-md ${
        isNumber ? scoreClasses(value as number) : 'border-gray-300/60 bg-gray-100/80 text-gray-600'
      }`}
    >
      {isNumber ? Math.round(value as number) : '--'}
    </div>
  );
};

const parseDurationValue = (value: unknown): number | undefined => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
};

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '--';
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)} ms`;
  }
  if (seconds < 60) {
    const display = seconds >= 10 ? Math.round(seconds) : parseFloat(seconds.toFixed(1));
    return `${display} s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds - minutes * 60;
  const secondsDisplay =
    remainingSeconds >= 10 ? Math.round(remainingSeconds) : parseFloat(remainingSeconds.toFixed(1));
  return `${minutes}m ${secondsDisplay}s`;
};

// Helper function to check if a value is truly empty (null, undefined, empty string, empty array, empty object)
const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
};

type CandidateCategory =
  | 'shortlisted'
  | 'rejected'
  | 'interview_scheduled'
  | 'interviewed'
  | 'offer_sent'
  | 'hired';

const STATE_OPTIONS: Array<{ value: CandidateCategory; label: string; badgeClass: string }> = [
  { value: 'shortlisted', label: 'Shortlisted', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'interview_scheduled', label: 'Interview Scheduled', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'interviewed', label: 'Interviewed', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'offer_sent', label: 'Offer Sent', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'hired', label: 'Hired', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'rejected', label: 'Rejected', badgeClass: 'bg-red-50 text-red-600 border-red-200' },
];

export const CandidateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const candidateId = id ? Number(id) : 0;
  
  const [newNote, setNewNote] = useState('');
  const { data: candidate, isLoading, error } = useCandidate(candidateId);
  const addNote = useAddNote();
  const deleteNote = useDeleteNote();
  const updateCategory = useUpdateJobScoreCategory();
  const { favorites, setFavorite } = useCandidatesStore();

  // Scroll to section when hash is present in URL
  useEffect(() => {
    if (location.hash) {
      const elementId = location.hash.substring(1); // Remove the #
      const element = document.getElementById(elementId);
      if (element) {
        // Small delay to ensure the page has loaded
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location.hash, candidate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error || !candidate) {
    return (
      <div className="space-y-6">
        <div className="card p-6 bg-red-50 border border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">Error loading candidate</p>
              <p className="text-xs text-red-600 mt-1">
                {error instanceof Error ? error.message : 'Candidate not found'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/review')}
            className="mt-4 btn-outline"
          >
            Back to Review
          </button>
        </div>
      </div>
    );
  }

  const resume = candidate.resumes?.[0];
  const parsedResume = resume?.parsed_data;
  const extractedData = parsedResume?.extracted_resume_data;
  const personalInfo = extractedData?.personal_info;
  const educationEntries = extractedData?.education || [];
  const experienceEntries = extractedData?.experience || [];
  // Handle skills as string arrays (new format) or objects (legacy format)
  const technicalSkillsRaw = extractedData?.skills?.technical || [];
  const softSkillsRaw = extractedData?.skills?.soft || [];
  const mentionedSkills = extractedData?.skills?.skills_mentioned_in_job_title || [];
  
  // Normalize technical skills: if string array, use as is; if object array, extract names
  const technicalSkills = technicalSkillsRaw.map((skill: any) => 
    typeof skill === 'string' ? skill : (skill?.name || skill?.toString())
  ).filter(Boolean);
  
  // Normalize soft skills: if string array, use as is; if object, extract name
  const softSkills = softSkillsRaw.map((skill: any) => 
    typeof skill === 'string' ? skill : (skill?.name || skill?.toString())
  ).filter(Boolean);
  const projects = extractedData?.projects || [];
  const awards = extractedData?.awards || [];
  const languages = extractedData?.languages || [];
  // Handle courses and certifications as objects (with all fields)
  const courses = extractedData?.courses || [];
  const certifications = extractedData?.certifications || [];
  const publications = extractedData?.publications || [];
  const otherSections = extractedData?.other_sections || {};
  const extractionNotes = extractedData?.extraction_notes || {};
  const interests = extractedData?.interests || {};
  // Try to get scoring_results from parsedResume.scoring_results first, then from parsed_data
  const scoringResults = parsedResume?.scoring_results || parsedResume?.parsed_data?.scoring_results || {};
  const finalScores = scoringResults?.final_scores || {};
  const scoringDetails = scoringResults;
  // Try to get interpretation from scoring_results.interpretation first (as per parse_resume.md),
  // then from parsedResume.interpretation, then from parsed_data.interpretation
  const interpretation = scoringResults?.interpretation || 
                        parsedResume?.interpretation || 
                        parsedResume?.parsed_data?.interpretation || {};
  const auditTrail = parsedResume?.audit_trail || parsedResume?.parsed_data?.audit_trail || {};
  const timelineEvents: TimelineEvent[] = candidate.timeline_events ?? [];
  const uploadEvent = timelineEvents.find((event) => event.event_type === 'uploaded');
  const parsedEvent = timelineEvents.find((event) => event.event_type === 'parsed');
  const scoredEvent = timelineEvents.find((event) => event.event_type === 'scored');
  const uploadDuration = parseDurationValue(uploadEvent?.metadata?.duration_seconds);
  const parseDurationSeconds = parseDurationValue(parsedEvent?.metadata?.duration_seconds);
  const scoringDurationSeconds = parseDurationValue(scoredEvent?.metadata?.duration_seconds);
  const processingDuration =
    (parseDurationSeconds ?? 0) + (scoringDurationSeconds ?? 0);
  const timelineHighlights = [
    uploadDuration ? { label: 'Upload Duration', value: formatDuration(uploadDuration) } : null,
    processingDuration > 0 ? { label: 'Parse & Scoring', value: formatDuration(processingDuration) } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
  const shouldShowTimelineCard = timelineEvents.length > 0 || timelineHighlights.length > 0;
  const isFavorite = candidateId ? !!favorites[candidateId] : false;
  
  // Get category from first job_score (from backend)
  const jobScore = candidate?.job_scores?.[0];
  const backendCategory = jobScore?.category as CandidateCategory | undefined;
  const fallbackState: CandidateCategory =
    candidate?.job_scores?.some((score) => score.auto_rejected) ? 'rejected' : 'shortlisted';
  const candidateState: CandidateCategory = backendCategory || fallbackState;
  const selectedStateOption =
    STATE_OPTIONS.find((option) => option.value === candidateState) || STATE_OPTIONS[0];

  // Parse rejection reason to determine which section it relates to
  const getRejectionBadgeInfo = () => {
    if (!jobScore?.auto_rejected || !jobScore?.rejection_reason) return null;
    
    const reason = jobScore.rejection_reason.toLowerCase();
    
    if (reason.includes('experience') || reason.includes('years of experience')) {
      return { section: 'experience', text: 'Auto Rejected: Experience' };
    }
    if (reason.includes('age')) {
      return { section: 'age', text: 'Auto Rejected: Age' };
    }
    if (reason.includes('military')) {
      return { section: 'military', text: 'Auto Rejected: Military Status' };
    }
    if (reason.includes('education level') || reason.includes('education')) {
      return { section: 'education', text: 'Auto Rejected: Education' };
    }
    if (reason.includes('major')) {
      return { section: 'education', text: 'Auto Rejected: Education Major' };
    }
    if (reason.includes('university')) {
      return { section: 'education', text: 'Auto Rejected: University' };
    }
    if (reason.includes('gender')) {
      return { section: 'gender', text: 'Auto Rejected: Gender' };
    }
    
    return { section: 'general', text: 'Auto Rejected' };
  };

  const rejectionBadgeInfo = getRejectionBadgeInfo();

  const formatDate = (value?: string | null) => {
    if (!value) return null;
    // Handle date strings that might not be valid Date objects
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        // If not a valid date, return the string as is
        return value;
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });
    } catch {
      return value;
    }
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth?: string | null): number | null => {
    if (!dateOfBirth) return null;
    try {
      // Try to parse various date formats
      const date = new Date(dateOfBirth);
      if (Number.isNaN(date.getTime())) {
        // Try parsing Persian/Jalali dates or other formats
        const yearMatch = dateOfBirth.match(/\d{4}/);
        if (yearMatch) {
          const year = parseInt(yearMatch[0]);
          const currentYear = new Date().getFullYear();
          // If it's a 4-digit year, assume it's a birth year
          if (year > 1300 && year < 1500) {
            // Likely Persian year (1300-1500 range)
            return currentYear - year;
          } else if (year > 1900 && year < 2100) {
            // Likely Gregorian year
            return currentYear - year;
          }
        }
        return null;
      }
      const today = new Date();
      let age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

  // Extract gender from parsed_data if available
  const extractGender = (): string | null => {
    if (!parsedResume?.parsed_data) return null;
    try {
      const parsedData = parsedResume.parsed_data;
      // Check in personal_info
      const personalInfo = parsedData?.personal_info || parsedData?.extracted_resume_data?.personal_info;
      if (personalInfo?.gender) {
        return personalInfo.gender;
      }
      // Check in root level
      if (parsedData?.gender) {
        return parsedData.gender;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleAddNote = async () => {
    if (newNote.trim() && candidateId) {
      try {
        await addNote.mutateAsync({
          candidateId,
          content: newNote.trim(),
        });
        setNewNote('');
      } catch (error) {
        console.error('Failed to add note:', error);
        alert('Failed to add note. Please try again.');
      }
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!candidateId || !window.confirm('Are you sure you want to delete this note?')) {
      return;
    }
    try {
      await deleteNote.mutateAsync({
        candidateId,
        noteId,
      });
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note. Please try again.');
    }
  };

  const handleStateChange = async (value: CandidateCategory) => {
    if (!candidateId || !jobScore) return;
    
    try {
      await updateCategory.mutateAsync({
        jobScoreId: jobScore.id,
        category: value,
      });
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const toggleFavorite = () => {
    if (!candidateId) return;
    setFavorite(candidateId, !isFavorite);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Link
            to="/review"
            className="p-2 text-gray-700 hover:text-gray-900 hover:bg-white/20 backdrop-blur-md rounded-lg transition-colors border border-transparent hover:border-white/30"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold text-gray-800 truncate">{candidate.name}</h1>
              {rejectionBadgeInfo && (
                // Show badge in header only if the related section doesn't exist
                (rejectionBadgeInfo.section === 'experience' && experienceEntries.length === 0) ||
                (rejectionBadgeInfo.section === 'education' && educationEntries.length === 0) ||
                rejectionBadgeInfo.section === 'general'
              ) && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/60 bg-red-100/80 backdrop-blur-md px-3 py-1 text-sm font-semibold text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  {rejectionBadgeInfo.text}
                </span>
              )}
            </div>
            <p className="text-gray-700 mt-1">Candidate Profile & Details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFavorite}
            className={`rounded-full border p-2 transition backdrop-blur-md ${
              isFavorite
                ? 'border-yellow-500/60 bg-yellow-200/80 text-yellow-800 hover:bg-yellow-300/90'
                : 'border-white/40 bg-white/20 text-gray-600 hover:border-yellow-400/60 hover:bg-yellow-100/60 hover:text-yellow-700'
            }`}
            aria-label="Toggle favorite"
          >
            <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <select
              value={candidateState}
              onChange={(e) => handleStateChange(e.target.value as CandidateCategory)}
              className={`appearance-none rounded-full border py-2 pl-10 pr-8 text-sm font-medium transition ${selectedStateOption.badgeClass}`}
            >
              {STATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a
                    href={`mailto:${personalInfo?.email || candidate.email}`}
                    className="text-sm font-medium text-gray-800 hover:text-primary"
                  >
                    {personalInfo?.email || candidate.email}
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-sm font-medium text-gray-800">
                    {personalInfo?.phone || candidate.phone || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Education */}
          {educationEntries?.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Education</h2>
                {rejectionBadgeInfo?.section === 'education' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {rejectionBadgeInfo.text}
                  </span>
                )}
              </div>
              <div className="space-y-6">
                {educationEntries.map((edu: any, index: number) => (
                  <div key={`education-${index}`} className="border-l-4 border-secondary pl-4">
                    <div className="flex flex-col gap-1">
                      {!isEmpty(edu.degree ?? edu.title) && (
                        <h3 className="text-lg font-semibold text-gray-800">{edu.degree ?? edu.title}</h3>
                      )}
                      {!isEmpty(edu.institution ?? edu.school) && (
                        <p className="text-sm font-medium text-gray-600">{edu.institution ?? edu.school}</p>
                      )}
                      {!isEmpty(edu.field || edu.major) && (
                        <p className="text-sm text-gray-600">{edu.field ?? edu.major}</p>
                      )}
                      {!isEmpty(edu.institution_category) && (
                        <p className="text-xs text-gray-500 italic">{edu.institution_category}</p>
                      )}
                      {(formatDate(edu.start_date) || formatDate(edu.end_date) || edu.graduation_year) && (
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(edu.start_date) || ''}{' '}
                          {formatDate(edu.start_date) && formatDate(edu.end_date) && '- '}
                          {formatDate(edu.end_date) || (edu.graduation_year ? `Graduated ${edu.graduation_year}` : 'Present')}
                          {!formatDate(edu.end_date) && edu.graduation_year && formatDate(edu.start_date) && ` (${edu.graduation_year})`}
                        </p>
                      )}
                      {!isEmpty(edu.gpa) && (
                        <p className="text-sm text-gray-500">GPA: {edu.gpa}</p>
                      )}
                      {!isEmpty(edu.description) && <p className="text-sm text-gray-600 mt-2">{edu.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {experienceEntries.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Work Experience</h2>
                {rejectionBadgeInfo?.section === 'experience' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {rejectionBadgeInfo.text}
                  </span>
                )}
              </div>
              <div className="space-y-8">
                {(() => {
                  // Group experiences by normalized job_title (case-insensitive, trimmed)
                  // This ensures identical job titles are grouped together
                  const groupedByTitle: Record<string, { title: string; experiences: any[] }> = {};
                  
                  experienceEntries.forEach((exp: any) => {
                    const originalTitle = (exp.job_title || exp.role || 'Other').trim();
                    // Normalize title for grouping (lowercase, trimmed)
                    const normalizedTitle = originalTitle.toLowerCase().trim();
                    
                    if (!groupedByTitle[normalizedTitle]) {
                      groupedByTitle[normalizedTitle] = {
                        title: originalTitle, // Keep original title for display
                        experiences: []
                      };
                    }
                    groupedByTitle[normalizedTitle].experiences.push(exp);
                  });

                  return Object.values(groupedByTitle).map((group, groupIndex) => {
                    const { title: jobTitle, experiences } = group;
                    const displayTitle = !isEmpty(jobTitle) && jobTitle !== 'Other' ? jobTitle : null;
                    
                    return (
                      <div key={`${jobTitle}-${groupIndex}`} className="space-y-4">
                        {displayTitle && (
                          <h3 className="text-xl font-bold text-gray-800 border-b-2 border-primary pb-2">
                            {displayTitle}
                          </h3>
                        )}
                        <div className="space-y-4 pl-4">
                          {experiences.map((exp: any, expIndex: number) => (
                            <div key={exp.id || `exp-${groupIndex}-${expIndex}`} className="border-l-4 border-secondary pl-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  {!isEmpty(exp.company) && (
                                    <p className="text-sm font-medium text-gray-600">{exp.company}</p>
                                  )}
                                  {(exp.start_date || exp.end_date) && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      {formatDate(exp.start_date) || ''}{' '}
                                      {formatDate(exp.start_date) && formatDate(exp.end_date) && '- '}
                                      {exp.is_currently_employed || exp.is_current
                                        ? 'Present'
                                        : formatDate(exp.end_date) || 'Present'}
                                      {!isEmpty(exp.duration) && ` (${exp.duration})`}
                                    </p>
                                  )}
                                  {!isEmpty(exp.location) && (
                                    <p className="text-sm text-gray-500">{exp.location}</p>
                                  )}
                                  {!isEmpty(exp.reasoning) && (
                                    <p className="text-sm text-gray-600 mt-2">{exp.reasoning}</p>
                                  )}
                                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                                    <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                                      {exp.responsibilities.map((resp: string, idx: number) => (
                                        <li key={idx}>{resp}</li>
                                      ))}
                                    </ul>
                                  )}
                                  {exp.extracted_skills && exp.extracted_skills.length > 0 && (
                                    <div className="mt-3">
                                      <p className="text-xs font-semibold text-gray-500 mb-1">Skills Extracted:</p>
                                      <div className="flex flex-wrap gap-2">
                                        {exp.extracted_skills.map((skill: string, idx: number) => (
                                          <span
                                            key={idx}
                                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100"
                                          >
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Skills */}
          {(technicalSkills.length > 0 || softSkills.length > 0 || mentionedSkills.length > 0) && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Skills</h2>
              {technicalSkills.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Technical Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {technicalSkills.map((skill: string, idx: number) => (
                      <span
                        key={`technical-${idx}-${skill}`}
                        className="px-3 py-1 bg-primary text-white rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {softSkills.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Soft Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {softSkills.map((skill: string, idx: number) => (
                      <span
                        key={`soft-${idx}-${skill}`}
                        className="px-3 py-1 bg-secondary text-gray-800 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {mentionedSkills.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Mentioned in Roles</h3>
                  <div className="flex flex-wrap gap-2">
                    {mentionedSkills.map((skill: string) => (
                      <span key={skill} className="px-3 py-1 bg-white/40 backdrop-blur-md text-gray-800 rounded-full text-sm font-medium border border-white/50">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Projects</h2>
              <div className="space-y-4">
                {projects.map((project: any) => (
                  <div key={project.id} className="border-l-4 border-secondary pl-4">
                    {!isEmpty(project.name) && (
                      <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
                    )}
                    {!isEmpty(project.role) && <p className="text-sm text-gray-600">Role: {project.role}</p>}
                    {!isEmpty(project.date) && <p className="text-sm text-gray-500">{project.date}</p>}
                    {project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Technologies:</p>
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {!isEmpty(project.description) && <p className="text-sm text-gray-600 mt-2">{project.description}</p>}
                    {!isEmpty(project.link) && (
                      <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-1 block">
                        View Project
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Awards */}
          {awards.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Awards & Honors</h2>
              <div className="space-y-3">
                {awards.map((award: any) => (
                  <div key={award.id} className="flex items-start space-x-3">
                    <div className="flex-1">
                      {!isEmpty(award.title) && (
                        <h3 className="text-sm font-semibold text-gray-800">{award.title}</h3>
                      )}
                      {!isEmpty(award.issuer) && <p className="text-xs text-gray-600">{award.issuer}</p>}
                      {!isEmpty(award.rank) && <p className="text-xs text-gray-500">{award.rank}</p>}
                      {!isEmpty(award.date) && <p className="text-xs text-gray-500">{award.date}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Languages</h2>
              <div className="space-y-4">
                {languages.map((lang: any) => (
                  <div key={lang.id} className="border-l-4 border-indigo-200 pl-4">
                    {!isEmpty(lang.language) && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900">{lang.language}</span>
                        {!isEmpty(lang.proficiency) && (
                          <span className="text-xs text-gray-600 bg-indigo-50 px-2 py-1 rounded-full">
                            {lang.proficiency}
                          </span>
                        )}
                      </div>
                    )}
                    {lang.skills && typeof lang.skills === 'object' && Object.keys(lang.skills).length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Skills:</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          {lang.skills.speaking && (
                            <div>Speaking: <span className="font-medium">{lang.skills.speaking}</span></div>
                          )}
                          {lang.skills.writing && (
                            <div>Writing: <span className="font-medium">{lang.skills.writing}</span></div>
                          )}
                          {lang.skills.listening && (
                            <div>Listening: <span className="font-medium">{lang.skills.listening}</span></div>
                          )}
                          {lang.skills.reading && (
                            <div>Reading: <span className="font-medium">{lang.skills.reading}</span></div>
                          )}
                        </div>
                      </div>
                    )}
                    {lang.certificates && Array.isArray(lang.certificates) && lang.certificates.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Certificates:</p>
                        <div className="space-y-1">
                          {lang.certificates.map((cert: any, idx: number) => (
                            <div key={idx} className="text-xs text-gray-700 bg-white/40 backdrop-blur-md p-2 rounded border border-white/50">
                              {cert.test && <span className="font-medium">{cert.test}</span>}
                              {cert.score && cert.test && ' - '}
                              {cert.score && <span>Score: {cert.score}</span>}
                              {cert.date && (cert.test || cert.score) && ' • '}
                              {cert.date && <span>{cert.date}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Publications */}
          {publications.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Publications</h2>
              <div className="space-y-4">
                {publications.map((pub: any) => (
                  <div key={pub.id} className="border-l-4 border-purple-200 pl-4">
                    {!isEmpty(pub.title) && (
                      <h3 className="text-sm font-semibold text-gray-900">{pub.title}</h3>
                    )}
                    {pub.authors && Array.isArray(pub.authors) && pub.authors.length > 0 && (
                      <p className="text-xs text-gray-600 mt-1">Authors: {pub.authors.join(', ')}</p>
                    )}
                    {(!isEmpty(pub.venue) || !isEmpty(pub.year)) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {pub.venue && pub.venue}
                        {pub.venue && pub.year && ', '}
                        {pub.year && pub.year}
                      </p>
                    )}
                    {!isEmpty(pub.volume_pages) && (
                      <p className="text-xs text-gray-500 mt-1">{pub.volume_pages}</p>
                    )}
                    {!isEmpty(pub.doi) && (
                      <p className="text-xs text-gray-500 mt-1">DOI: {pub.doi}</p>
                    )}
                    {!isEmpty(pub.citations) && (
                      <p className="text-xs text-gray-500 mt-1">Citations: {pub.citations}</p>
                    )}
                    {!isEmpty(pub.link) && (
                      <a
                        href={pub.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-1 block"
                      >
                        View Publication
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(courses.length > 0 || certifications.length > 0) && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Learning & Certifications</h2>
              {courses.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Courses</h3>
                  <div className="space-y-4">
                    {courses.map((course: any, idx: number) => {
                      const courseName = typeof course === 'string' ? course : course?.name;
                      if (isEmpty(courseName)) return null;
                      return (
                        <div key={`course-${idx}`} className="border-l-4 border-blue-200 pl-4">
                          <h4 className="text-sm font-semibold text-gray-900">{courseName}</h4>
                          {!isEmpty(course.provider) && (
                            <p className="text-xs text-gray-600 mt-1">Provider: {course.provider}</p>
                          )}
                          {(!isEmpty(course.completion_date) || !isEmpty(course.duration)) && (
                            <p className="text-xs text-gray-500 mt-1">
                              {course.completion_date && `Completed: ${course.completion_date}`}
                              {course.completion_date && course.duration && ' • '}
                              {course.duration && `Duration: ${course.duration}`}
                            </p>
                          )}
                          {!isEmpty(course.instructor) && (
                            <p className="text-xs text-gray-500 mt-1">Instructor: {course.instructor}</p>
                          )}
                          {!isEmpty(course.verification_link) && (
                            <a
                              href={course.verification_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline mt-1 block"
                            >
                              View Certificate
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {certifications.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Certifications</h3>
                  <div className="space-y-4">
                    {certifications.map((cert: any, idx: number) => {
                      const certName = typeof cert === 'string' ? cert : cert?.name;
                      if (isEmpty(certName)) return null;
                      return (
                        <div key={`cert-${idx}`} className="border-l-4 border-green-200 pl-4">
                          <h4 className="text-sm font-semibold text-gray-900">{certName}</h4>
                          {!isEmpty(cert.issuer) && (
                            <p className="text-xs text-gray-600 mt-1">Issuer: {cert.issuer}</p>
                          )}
                          {!isEmpty(cert.date) && (
                            <p className="text-xs text-gray-500 mt-1">Date: {cert.date}</p>
                          )}
                          {!isEmpty(cert.description) && (
                            <p className="text-xs text-gray-600 mt-1">{cert.description}</p>
                          )}
                          {!isEmpty(cert.verification_link) && (
                            <a
                              href={cert.verification_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline mt-1 block"
                            >
                              Verify Certificate
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Other Sections */}
          {otherSections && Object.keys(otherSections).length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
              <div className="space-y-4">
                {otherSections.professional_summary && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Professional Summary</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{otherSections.professional_summary}</p>
                  </div>
                )}
                {otherSections.career_objectives && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Career Objectives</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{otherSections.career_objectives}</p>
                  </div>
                )}
                {otherSections.references && Array.isArray(otherSections.references) && otherSections.references.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">References</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {otherSections.references.map((ref: string, idx: number) => (
                        <li key={idx}>{ref}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {otherSections.custom_sections && Array.isArray(otherSections.custom_sections) && otherSections.custom_sections.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Custom Sections</h3>
                    <div className="space-y-3">
                      {otherSections.custom_sections.map((section: any, idx: number) => (
                        <div key={idx} className="border-l-4 border-white/40 pl-4">
                          {section.title && (
                            <h4 className="text-sm font-semibold text-gray-800 mb-1">{section.title}</h4>
                          )}
                          {section.content && (
                            <p className="text-sm text-gray-700">{section.content}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interests */}
          {interests && Object.keys(interests).length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Interests & Activities</h2>
              <div className="space-y-4">
                {Object.entries(interests).map(([key, value]) => {
                  if (!value || (Array.isArray(value) && value.length === 0)) {
                    return null;
                  }
                  return (
                    <div key={key}>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 capitalize">
                        {key.replace(/_/g, ' ')}
                      </h3>
                      {Array.isArray(value) ? (
                        <div className="flex flex-wrap gap-2">
                          {value.map((item: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-100"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : typeof value === 'object' ? (
                        <div className="text-sm text-gray-600 space-y-1">
                          {Object.entries(value as Record<string, any>).map(([subKey, subValue]) => (
                            <div key={subKey}>
                              <span className="font-medium">{subKey}:</span> {String(subValue)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">{String(value)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {extractionNotes && Object.keys(extractionNotes).length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Extraction Notes</h2>
              <div className="space-y-3 text-sm text-gray-700">
                {Object.entries(extractionNotes).map(([key, value]) => {
                  if (!value || (Array.isArray(value) && value.length === 0)) {
                    return null;
                  }
                  return (
                    <div key={key}>
                      <p className="text-xs uppercase text-gray-500 mb-1">{key.replace(/_/g, ' ')}</p>
                      {Array.isArray(value) ? (
                        <ul className="list-disc list-inside space-y-1">
                          {value.map((item, idx) => (
                            <li key={`${key}-${idx}`}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>{String(value)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline */}
          {shouldShowTimelineCard && (
            <div className="card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Timeline</h2>
              </div>
              {timelineHighlights.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {timelineHighlights.map((highlight) => (
                    <div key={highlight.label} className="card p-4">
                      <p className="text-xs font-semibold uppercase text-gray-600">{highlight.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-gray-800">{highlight.value}</p>
                    </div>
                  ))}
                </div>
              )}
              {timelineEvents.length > 0 && (
                <div className="space-y-4">
                  {timelineEvents.map((event) => {
                    const eventDuration = parseDurationValue(event.metadata?.duration_seconds);
                    return (
                      <div key={event.id} className="flex items-start space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{event.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(event.created_at).toLocaleString()}
                          </p>
                          {typeof eventDuration === 'number' && (
                            <p className="text-xs text-gray-400 mt-1">Duration: {formatDuration(eventDuration)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Scoring Summary */}
          {(finalScores && Object.keys(finalScores).length > 0) && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Score Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                {finalScores.experience_depth_score !== undefined && finalScores.experience_depth_score !== null && (
                  <div className="text-center">
                    <p className="text-xs uppercase text-gray-500 mb-2">Experience Depth</p>
                    <ScoreBadge value={finalScores.experience_depth_score} />
                  </div>
                )}
                {finalScores.education_level_score !== undefined && finalScores.education_level_score !== null && (
                  <div className="text-center">
                    <p className="text-xs uppercase text-gray-500 mb-2">Education Level</p>
                    <ScoreBadge value={finalScores.education_level_score} />
                  </div>
                )}
                {finalScores.overall_weighted_score !== undefined && finalScores.overall_weighted_score !== null && (
                  <div className="text-center">
                    <p className="text-xs uppercase text-gray-500 mb-2">Overall Score</p>
                    <ScoreBadge value={finalScores.overall_weighted_score} />
                  </div>
                )}
                {finalScores.seniority_match_score !== undefined && finalScores.seniority_match_score !== null && (
                  <div className="text-center">
                    <p className="text-xs uppercase text-gray-500 mb-2">Seniority Match</p>
                    <ScoreBadge value={finalScores.seniority_match_score} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              {(rejectionBadgeInfo?.section === 'age' || 
                rejectionBadgeInfo?.section === 'military' || 
                rejectionBadgeInfo?.section === 'gender') && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {rejectionBadgeInfo.text}
                </span>
              )}
            </div>
            <dl className="space-y-3 text-sm text-gray-700">
              {personalInfo?.date_of_birth && (
                <div className="flex justify-between items-start">
                  <dt className="font-medium text-gray-600 min-w-[140px]">تاریخ تولد</dt>
                  <dd className="text-right flex-1">{personalInfo.date_of_birth}</dd>
                </div>
              )}
              {(() => {
                const age = calculateAge(personalInfo?.date_of_birth);
                return age !== null ? (
                  <div className="flex justify-between items-start">
                    <dt className="font-medium text-gray-600 min-w-[140px]">سن</dt>
                    <dd className="text-right flex-1">{age} سال</dd>
                  </div>
                ) : null;
              })()}
              {(() => {
                const gender = extractGender();
                return gender ? (
                  <div className="flex justify-between items-start">
                    <dt className="font-medium text-gray-600 min-w-[140px]">جنسیت</dt>
                    <dd className="text-right flex-1">
                      {gender === 'male' ? 'مرد' : gender === 'female' ? 'زن' : gender}
                    </dd>
                  </div>
                ) : null;
              })()}
              {personalInfo?.military_service && (
                <div className="flex justify-between items-start">
                  <dt className="font-medium text-gray-600 min-w-[140px]">وضعیت سربازی</dt>
                  <dd className="text-right flex-1">{personalInfo.military_service}</dd>
                </div>
              )}
              {personalInfo?.marital_status && (
                <div className="flex justify-between items-start">
                  <dt className="font-medium text-gray-600 min-w-[140px]">وضعیت تأهل</dt>
                  <dd className="text-right flex-1">{personalInfo.marital_status}</dd>
                </div>
              )}
              {personalInfo?.address && (
                <div className="flex justify-between items-start">
                  <dt className="font-medium text-gray-600 min-w-[140px]">آدرس</dt>
                  <dd className="text-right flex-1 max-w-xs break-words">{personalInfo.address}</dd>
                </div>
              )}
            </dl>
          </div>

          {interpretation && Object.keys(interpretation).length > 0 && (
            <div id={parsedResume?.ai_review ? 'ai-review-interpretation' : 'ai-review'} className="card p-6 space-y-5 scroll-mt-24">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900">AI Review</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {interpretation.seniority_fit_analysis && (
                  <>
                    <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
                      <Sparkles className="h-4 w-4" />
                      {interpretation.seniority_fit_analysis.fit_level || 'Unknown'} Fit
                    </span>
                    {interpretation.seniority_fit_analysis.overqualified && (
                      <span className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                        Overqualified
                      </span>
                    )}
                    {interpretation.seniority_fit_analysis.underqualified && (
                      <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                        Underqualified
                      </span>
                    )}
                  </>
                )}
              </div>
              {interpretation.seniority_fit_analysis?.explanation && (
                <p className="text-sm text-gray-700 leading-6 card p-4">
                  {interpretation.seniority_fit_analysis.explanation}
                </p>
              )}
              {(() => {
                // Support both nested structure (analysis.strengths) and flat structure (strengths)
                const strengths = interpretation.analysis?.strengths || interpretation.strengths || [];
                if (strengths.length === 0) return null;
                
                return (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-800">Strengths</p>
                    <div className="space-y-3">
                      {strengths.map((item: any, idx: number) => {
                        // Handle both object format (new) and string format (legacy)
                        if (typeof item === 'string') {
                          return (
                            <span
                              key={`strength-${idx}`}
                              className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-100 mr-2 mb-2"
                            >
                              {item}
                            </span>
                          );
                        }
                        // Object format with title, evidence, impact_level
                        return (
                          <div
                            key={`strength-${idx}`}
                            className="rounded-lg bg-emerald-50 border border-emerald-100 p-3"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-emerald-900">{item.title || 'Strength'}</h4>
                              {item.impact_level && (
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  item.impact_level === 'high' ? 'bg-emerald-200 text-emerald-800' :
                                  item.impact_level === 'medium' ? 'bg-emerald-100 text-emerald-700' :
                                  'bg-emerald-50 text-emerald-600'
                                }`}>
                                  {item.impact_level}
                                </span>
                              )}
                            </div>
                            {item.evidence && (
                              <p className="text-xs text-emerald-700 mt-1">{item.evidence}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              {(() => {
                // Support both nested structure (analysis.weaknesses) and flat structure (weaknesses)
                const weaknesses = interpretation.analysis?.weaknesses || interpretation.weaknesses || [];
                if (weaknesses.length === 0) return null;
                
                return (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-800">Weaknesses</p>
                    <div className="space-y-3">
                      {weaknesses.map((item: any, idx: number) => {
                        // Handle both object format (new) and string format (legacy)
                        if (typeof item === 'string') {
                          return (
                            <span
                              key={`weakness-${idx}`}
                              className="inline-block rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 border border-rose-100 mr-2 mb-2"
                            >
                              {item}
                            </span>
                          );
                        }
                        // Object format with title, observation, suggestion, priority
                        return (
                          <div
                            key={`weakness-${idx}`}
                            className="rounded-lg bg-rose-50 border border-rose-100 p-3"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-rose-900">{item.title || 'Weakness'}</h4>
                              {item.priority && (
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  item.priority === 'high' ? 'bg-rose-200 text-rose-800' :
                                  item.priority === 'medium' ? 'bg-rose-100 text-rose-700' :
                                  'bg-rose-50 text-rose-600'
                                }`}>
                                  {item.priority}
                                </span>
                              )}
                            </div>
                            {item.observation && (
                              <p className="text-xs text-rose-700 mt-1 mb-1">
                                <span className="font-medium">Observation:</span> {item.observation}
                              </p>
                            )}
                            {item.suggestion && (
                              <p className="text-xs text-rose-600 mt-1">
                                <span className="font-medium">Suggestion:</span> {item.suggestion}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              {(() => {
                // Support both nested structure (overall_analysis.narrative) and flat structure (overall_assessment)
                const narrative = interpretation.overall_analysis?.narrative || interpretation.overall_assessment;
                if (!narrative) return null;
                
                return (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-800">Overall Analysis</p>
                    <p className="text-sm text-gray-700 leading-6 card p-4">
                      {narrative}
                    </p>
                  </div>
                );
              })()}
              {interpretation.recommendations && interpretation.recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-800">Recommendations</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {interpretation.recommendations.map((item, idx) => (
                      <li key={`recommendation-${idx}`} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Audit Trail */}
          {auditTrail && Object.keys(auditTrail).length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Audit Trail</h2>
              <div className="space-y-4 text-sm text-gray-700">
                {auditTrail.data_completeness && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Data Completeness</h3>
                    <div className="bg-white/40 backdrop-blur-md p-3 rounded-lg space-y-1 border border-white/50">
                      {auditTrail.data_completeness.positions_complete !== undefined && (
                        <p className="text-xs">
                          Positions: {auditTrail.data_completeness.positions_complete} / {auditTrail.data_completeness.positions_total || 'N/A'}
                        </p>
                      )}
                      {auditTrail.data_completeness.education_complete !== undefined && (
                        <p className="text-xs">
                          Education: {auditTrail.data_completeness.education_complete} / {auditTrail.data_completeness.education_total || 'N/A'}
                        </p>
                      )}
                      {auditTrail.data_completeness.missing_fields && Array.isArray(auditTrail.data_completeness.missing_fields) && auditTrail.data_completeness.missing_fields.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-gray-600 mb-1">Missing Fields:</p>
                          <div className="flex flex-wrap gap-1">
                            {auditTrail.data_completeness.missing_fields.map((field: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded text-xs border border-yellow-200">
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {auditTrail.assumptions_made && Array.isArray(auditTrail.assumptions_made) && auditTrail.assumptions_made.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Assumptions Made</h3>
                    <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                      {auditTrail.assumptions_made.map((assumption: string, idx: number) => (
                        <li key={idx}>{assumption}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {auditTrail.edge_cases && Array.isArray(auditTrail.edge_cases) && auditTrail.edge_cases.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Edge Cases</h3>
                    <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                      {auditTrail.edge_cases.map((edgeCase: string, idx: number) => (
                        <li key={idx}>{edgeCase}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {auditTrail.warnings && Array.isArray(auditTrail.warnings) && auditTrail.warnings.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Warnings</h3>
                    <div className="space-y-1">
                      {auditTrail.warnings.map((warning: string, idx: number) => (
                        <div key={idx} className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                          {warning}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div id="notes" className="card p-6 scroll-mt-24">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Notes</h2>

            {candidate.notes && candidate.notes.length > 0 && (
              <div className="space-y-4 mb-4">
                {candidate.notes.map((note: any) => (
                  <div key={note.id} className="card p-4 relative group">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-gray-800">{note.user_email || 'Unknown User'}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-600">
                          {new Date(note.created_at).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={deleteNote.isPending}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete note"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{note.content}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNote();
                  }
                }}
                placeholder="Add a note..."
                className="input-field flex-1"
                disabled={addNote.isPending}
              />
              <button
                onClick={handleAddNote}
                disabled={addNote.isPending || !newNote.trim()}
                className="px-3 py-2 text-sm btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addNote.isPending ? <Loader className="h-4 w-4 animate-spin" /> : 'Add'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

