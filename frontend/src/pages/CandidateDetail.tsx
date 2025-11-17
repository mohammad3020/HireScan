import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Linkedin,
  Calendar,
  Sparkles,
  Wallet,
  Loader,
  AlertCircle,
  Star,
  Tag,
  ChevronDown,
} from 'lucide-react';
import { useCandidate, useAddNote } from '../api/candidates';
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
      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold ${
        isNumber ? scoreClasses(value as number) : 'border-gray-200 bg-gray-50 text-gray-500'
      }`}
    >
      {isNumber ? Math.round(value as number) : '--'}
    </div>
  );
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
  const candidateId = id ? Number(id) : 0;
  
  const [newNote, setNewNote] = useState('');
  const { data: candidate, isLoading, error } = useCandidate(candidateId);
  const addNote = useAddNote();
  const { favorites, categories, setFavorite, setCategory } = useCandidatesStore();

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
  const technicalSkills = extractedData?.skills?.technical || [];
  const softSkills = extractedData?.skills?.soft || [];
  const mentionedSkills = extractedData?.skills?.skills_mentioned_in_job_title || [];
  const projects = extractedData?.projects || [];
  const awards = extractedData?.awards || [];
  const languages = extractedData?.languages || [];
  const courses = extractedData?.courses || [];
  const certifications = extractedData?.certifications || [];
  const extractionNotes = extractedData?.extraction_notes || {};
  const interpretation = parsedResume?.interpretation;
  const auditTrail = parsedResume?.audit_trail;
  const finalScores = parsedResume?.scoring_results?.final_scores;
  const isFavorite = candidateId ? !!favorites[candidateId] : false;
  const fallbackState: CandidateCategory =
    candidate?.job_scores?.some((score) => score.auto_rejected) ? 'rejected' : 'shortlisted';
  const candidateState: CandidateCategory =
    (candidateId ? (categories[candidateId] as CandidateCategory) : null) || fallbackState;
  const selectedStateOption =
    STATE_OPTIONS.find((option) => option.value === candidateState) || STATE_OPTIONS[0];

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

  const handleStateChange = (value: CandidateCategory) => {
    if (!candidateId) return;
    setCategory(candidateId, value);
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
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900 truncate">{candidate.name}</h1>
            </div>
            <p className="text-gray-600 mt-1">Candidate Profile & Details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFavorite}
            className={`rounded-full border p-2 transition ${
              isFavorite
                ? 'border-yellow-300 bg-yellow-100 text-yellow-500 hover:bg-yellow-200'
                : 'border-gray-200 bg-white text-gray-400 hover:border-yellow-200 hover:bg-yellow-50 hover:text-yellow-500'
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
          {/* AI Review & Expected Salary */}
          {(parsedResume?.ai_review || parsedResume?.expected_salary) && (
            <div className="card p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900">AI Analysis</h2>
              </div>
              {parsedResume.ai_review && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">AI Review</p>
                  <p className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">{parsedResume.ai_review}</p>
                </div>
              )}
              {parsedResume.expected_salary && (
                <div className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Expected Salary</p>
                    <p className="text-sm text-gray-600">{parsedResume.expected_salary}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a
                    href={`mailto:${personalInfo?.email || candidate.email}`}
                    className="text-sm font-medium text-gray-900"
                  >
                    {personalInfo?.email || candidate.email}
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {personalInfo?.phone || candidate.phone || '—'}
                  </p>
                </div>
              </div>
              {(personalInfo?.links?.linkedin || candidate.linkedin_url) && (
                <div className="flex items-center space-x-3">
                  <Linkedin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">LinkedIn</p>
                    <a
                      href={personalInfo?.links?.linkedin || candidate.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      View Profile
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Education */}
          {educationEntries?.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Education</h2>
              <div className="space-y-6">
                {educationEntries.map((edu: any, index: number) => (
                  <div key={`education-${index}`} className="border-l-4 border-secondary pl-4">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-semibold text-gray-900">{edu.degree ?? edu.title}</h3>
                      <p className="text-sm font-medium text-gray-600">{edu.institution ?? edu.school}</p>
                      {(edu.field || edu.major) && (
                        <p className="text-sm text-gray-600">{edu.field ?? edu.major}</p>
                      )}
                      {(formatDate(edu.start_date) || formatDate(edu.end_date)) && (
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(edu.start_date) ?? '—'}{' '}
                          -{' '}
                          {formatDate(edu.end_date) ?? 'Present'}
                        </p>
                      )}
                      {edu.description && <p className="text-sm text-gray-600 mt-2">{edu.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {experienceEntries.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Experience</h2>
              <div className="space-y-6">
                {experienceEntries.map((exp: any) => (
                  <div key={exp.id} className="border-l-4 border-secondary pl-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{exp.job_title || exp.role || 'Unknown Position'}</h3>
                        <p className="text-sm font-medium text-gray-600">{exp.company || 'Unknown Company'}</p>
                        {(exp.start_date || exp.end_date) && (
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(exp.start_date) || '—'}{' '}
                            -{' '}
                            {exp.is_currently_employed || exp.is_current
                              ? 'Present'
                              : formatDate(exp.end_date) || 'Present'}
                            {exp.duration && ` (${exp.duration})`}
                          </p>
                        )}
                        {exp.location && (
                          <p className="text-sm text-gray-500">{exp.location}</p>
                        )}
                        {exp.reasoning && (
                          <p className="text-sm text-gray-600 mt-2">{exp.reasoning}</p>
                        )}
                        {exp.responsibilities && exp.responsibilities.length > 0 && (
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                            {exp.responsibilities.map((resp: string, idx: number) => (
                              <li key={idx}>{resp}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {(technicalSkills.length > 0 || softSkills.length > 0 || mentionedSkills.length > 0) && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
              {technicalSkills.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Technical Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {technicalSkills.map((skill: any) => (
                      <span
                        key={skill.id ?? `${skill.name}-${skill.category}`}
                        className="px-3 py-1 bg-primary text-white rounded-full text-sm font-medium"
                      >
                        {skill.name}
                        {skill.level && (
                          <span className="ml-2 text-xs opacity-75">({skill.level})</span>
                        )}
                        {skill.category && (
                          <span className="ml-2 text-xs opacity-75">{skill.category}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {softSkills.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Soft Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {softSkills.map((skill: any) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-secondary text-gray-900 rounded-full text-sm font-medium"
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
                      <span key={skill} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Projects</h2>
              <div className="space-y-4">
                {projects.map((project: any) => (
                  <div key={project.id} className="border-l-4 border-secondary pl-4">
                    <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                    {project.role && <p className="text-sm text-gray-600">Role: {project.role}</p>}
                    {project.date && <p className="text-sm text-gray-500">{project.date}</p>}
                    {project.description && <p className="text-sm text-gray-600 mt-2">{project.description}</p>}
                    {project.link && (
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Awards & Honors</h2>
              <div className="space-y-3">
                {awards.map((award: any) => (
                  <div key={award.id} className="flex items-start space-x-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900">{award.title}</h3>
                      {award.issuer && <p className="text-xs text-gray-600">{award.issuer}</p>}
                      {award.rank && <p className="text-xs text-gray-500">{award.rank}</p>}
                      {award.date && <p className="text-xs text-gray-500">{award.date}</p>}
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
              <div className="space-y-2">
                {languages.map((lang: any) => (
                  <div key={lang.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{lang.language}</span>
                    {lang.proficiency && (
                      <span className="text-xs text-gray-600">{lang.proficiency}</span>
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
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Courses</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {courses.map((course: any) => (
                      <li key={course.id} className="flex flex-col">
                        <span className="font-medium text-gray-900">{course.name}</span>
                        <span className="text-xs text-gray-500">
                          {[course.provider, course.completion_date].filter(Boolean).join(' • ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {certifications.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Certifications</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {certifications.map((cert: any) => (
                      <li key={cert.id} className="flex flex-col">
                        <span className="font-medium text-gray-900">{cert.name}</span>
                        <span className="text-xs text-gray-500">
                          {[cert.issuer, cert.date].filter(Boolean).join(' • ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
          {candidate.timeline_events && candidate.timeline_events.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-4">
                {candidate.timeline_events.map((event: any) => (
                  <div key={event.id} className="flex items-start space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{event.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Scoring Summary */}
          {finalScores && (
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
          {(personalInfo?.date_of_birth ||
            personalInfo?.address ||
            personalInfo?.marital_status ||
            personalInfo?.military_service) && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <dl className="space-y-2 text-sm text-gray-700">
                {personalInfo?.date_of_birth && (
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-600">Date of Birth</dt>
                    <dd>{personalInfo.date_of_birth}</dd>
                  </div>
                )}
                {personalInfo?.address && (
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-600">Address</dt>
                    <dd className="text-right max-w-xs">{personalInfo.address}</dd>
                  </div>
                )}
                {personalInfo?.marital_status && (
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-600">Marital Status</dt>
                    <dd>{personalInfo.marital_status}</dd>
                  </div>
                )}
                {personalInfo?.military_service && (
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-600">Military Status</dt>
                    <dd>{personalInfo.military_service}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {interpretation && (
            <div className="card p-6 space-y-5">
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
                <p className="text-sm text-gray-600 leading-6 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  {interpretation.seniority_fit_analysis.explanation}
                </p>
              )}
              {interpretation.strengths && interpretation.strengths.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-800">Strengths</p>
                  <div className="flex flex-wrap gap-2">
                    {interpretation.strengths.map((item, idx) => (
                      <span
                        key={`strength-${idx}`}
                        className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-100"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {interpretation.weaknesses && interpretation.weaknesses.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-800">Risks / Weaknesses</p>
                  <div className="flex flex-wrap gap-2">
                    {interpretation.weaknesses.map((item, idx) => (
                      <span
                        key={`weakness-${idx}`}
                        className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 border border-rose-100"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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

          {auditTrail && (
            <div className="card p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Audit Trail</h2>
              {auditTrail.data_completeness && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase text-gray-500">Positions Coverage</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">
                      {auditTrail.data_completeness.positions_complete}/
                      {auditTrail.data_completeness.positions_total}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase text-gray-500">Education Coverage</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">
                      {auditTrail.data_completeness.education_complete}/
                      {auditTrail.data_completeness.education_total}
                    </p>
                  </div>
                </div>
              )}
              {auditTrail.data_completeness?.missing_fields?.length ? (
                <div className="text-xs text-gray-600">
                  Missing fields: {auditTrail.data_completeness.missing_fields.join(', ')}
                </div>
              ) : null}
              {auditTrail.assumptions_made && auditTrail.assumptions_made.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-800">Assumptions</p>
                  <div className="flex flex-wrap gap-2">
                    {auditTrail.assumptions_made.map((item, idx) => (
                      <span
                        key={`assumption-${idx}`}
                        className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-100"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {auditTrail.edge_cases && auditTrail.edge_cases.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-800">Edge Cases</p>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {auditTrail.edge_cases.map((item, idx) => (
                      <li key={`edge-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {auditTrail.warnings && auditTrail.warnings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-red-600">Warnings</p>
                  <ul className="space-y-1 text-sm text-red-600">
                    {auditTrail.warnings.map((item, idx) => (
                      <li key={`warning-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>

            {candidate.notes && candidate.notes.length > 0 && (
              <div className="space-y-4 mb-4">
                {candidate.notes.map((note: any) => (
                  <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">{note.user_email || 'Unknown User'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(note.created_at).toLocaleDateString()}
                      </p>
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

