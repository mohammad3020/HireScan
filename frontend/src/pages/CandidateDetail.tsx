import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Linkedin, Calendar, Sparkles, Wallet, Loader, AlertCircle } from 'lucide-react';
import { useCandidate, useAddNote } from '../api/candidates';

// Mock data
const mockCandidate = {
  id: 1,
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  linkedin_url: 'https://linkedin.com/in/johndoe',
  created_at: '2024-01-15T10:30:00Z',
  ai_review:
    'AI summary: Strong alignment with senior engineering responsibilities, excels in mentoring and scalable architecture. Suggested focus for interview: distributed systems and leadership scenarios.',
  expected_salary: '45 Million Toman / Month',
  basic_information: {
    age: 29,
    location: 'Tehran, Iran',
    gender: 'Male',
    military_status: 'Completed',
  },
  resumes: [
    {
      id: 1,
      file: 'resume.pdf',
      uploaded_at: '2024-01-15T10:30:00Z',
      parsed_data: {
        id: 1,
        parsed_data: {
          summary: 'Experienced software engineer with 5+ years in full-stack development.',
          education: [
            {
              institution: 'MIT',
              degree: 'Bachelor of Science',
              field: 'Computer Science',
              end_date: '2018-05',
            },
            {
              institution: 'Stanford University',
              degree: 'Master of Science',
              field: 'Software Engineering',
              end_date: '2020-06',
            },
          ],
        },
        experiences: [
          {
            id: 1,
            company: 'Tech Corp',
            role: 'Senior Software Engineer',
            start_date: '2020-01',
            end_date: null,
            is_current: true,
            description: 'Leading development of microservices architecture.',
          },
          {
            id: 2,
            company: 'StartupXYZ',
            role: 'Software Engineer',
            start_date: '2018-06',
            end_date: '2019-12',
            is_current: false,
            description: 'Developed React-based web applications.',
          },
        ],
        skills: [
          { id: 1, name: 'React', category: 'Frontend', proficiency: 'expert' },
          { id: 2, name: 'TypeScript', category: 'Programming', proficiency: 'advanced' },
          { id: 3, name: 'Node.js', category: 'Backend', proficiency: 'advanced' },
          { id: 4, name: 'PostgreSQL', category: 'Database', proficiency: 'intermediate' },
          { id: 5, name: 'AWS', category: 'Cloud', proficiency: 'advanced' },
        ],
        additional_info: {
          achievements: ['Winner – 2023 National Hackathon', 'Published open-source library “stream-wizard”'],
          articles: ['Scaling Microservices with Event Driven Design – Medium', 'Mentoring Junior Engineers Effectively – Dev.to'],
        },
      },
    },
  ],
  notes: [
    {
      id: 1,
      user_email: 'admin@example.com',
      content: 'Strong candidate with excellent technical skills. Recommended for interview.',
      created_at: '2024-01-16T14:20:00Z',
    },
    {
      id: 2,
      user_email: 'hr_manager@example.com',
      content: 'Follow up on availability for next week.',
      created_at: '2024-01-17T09:15:00Z',
    },
  ],
  timeline_events: [
    {
      id: 1,
      event_type: 'uploaded',
      description: 'Resume uploaded',
      created_at: '2024-01-15T10:30:00Z',
    },
    {
      id: 2,
      event_type: 'parsed',
      description: 'Resume parsed successfully',
      created_at: '2024-01-15T10:32:00Z',
    },
    {
      id: 3,
      event_type: 'scored',
      description: 'Scored 92.5 for Senior Software Engineer position',
      created_at: '2024-01-15T11:00:00Z',
    },
  ],
  job_scores: [
    {
      id: 1,
      job_title: 'Senior Software Engineer',
      score: 92.5,
      experience_score: 89,
      education_score: 87,
      rank: 1,
      auto_rejected: false,
      scored_at: '2024-01-15T11:00:00Z',
    },
  ],
};

const scoreClasses = (value: number) => {
  if (value >= 90) return 'border-blue-300 bg-blue-50 text-blue-700';
  if (value >= 80) return 'border-green-300 bg-green-50 text-green-700';
  if (value >= 70) return 'border-yellow-300 bg-yellow-50 text-yellow-700';
  if (value >= 50) return 'border-orange-300 bg-orange-50 text-orange-700';
  return 'border-red-300 bg-red-50 text-red-700';
};

const ScoreBadge = ({ value }: { value: number }) => (
  <div
    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold ${scoreClasses(
      value
    )}`}
  >
    {Math.round(value)}
  </div>
);

export const CandidateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const candidateId = id ? Number(id) : 0;
  
  const [newNote, setNewNote] = useState('');
  const { data: candidate, isLoading, error } = useCandidate(candidateId);
  const addNote = useAddNote();

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
  const educationEntries = parsedResume?.educations || [];
  const experienceEntries = parsedResume?.experiences || [];
  const technicalSkills = parsedResume?.technical_skills || [];
  const softSkills = parsedResume?.soft_skills || [];
  const projects = parsedResume?.projects || [];
  const awards = parsedResume?.awards || [];
  const languages = parsedResume?.languages || [];
  const courses = parsedResume?.courses || [];
  const publications = parsedResume?.publications || [];

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/review"
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{candidate.name}</h1>
          <p className="text-gray-600 mt-1">Candidate Profile & Details</p>
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
                  <a href={`mailto:${candidate.email}`} className="text-sm font-medium text-gray-900">
                    {candidate.email}
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{candidate.phone}</p>
                </div>
              </div>
              {candidate.linkedin_url && (
                <div className="flex items-center space-x-3">
                  <Linkedin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">LinkedIn</p>
                    <a
                      href={candidate.linkedin_url}
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
          {(technicalSkills.length > 0 || softSkills.length > 0) && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
              {technicalSkills.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Technical Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {technicalSkills.map((skill: any) => (
                      <span
                        key={skill.id}
                        className="px-3 py-1 bg-primary text-white rounded-full text-sm font-medium"
                      >
                        {skill.name}
                        {skill.level && (
                          <span className="ml-2 text-xs opacity-75">({skill.level})</span>
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
                        key={skill.id}
                        className="px-3 py-1 bg-secondary text-gray-900 rounded-full text-sm font-medium"
                      >
                        {skill.name}
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
          {/* Basic Information */}
          {parsedResume && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <dl className="space-y-2 text-sm text-gray-700">
                {parsedResume.date_of_birth && (
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-600">Date of Birth</dt>
                    <dd>{parsedResume.date_of_birth}</dd>
                  </div>
                )}
                {parsedResume.address && (
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-600">Address</dt>
                    <dd className="text-right max-w-xs">{parsedResume.address}</dd>
                  </div>
                )}
                {parsedResume.marital_status && (
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-600">Marital Status</dt>
                    <dd>{parsedResume.marital_status}</dd>
                  </div>
                )}
                {parsedResume.military_service && (
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-600">Military Status</dt>
                    <dd>{parsedResume.military_service}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Job Scores */}
          {candidate.job_scores && candidate.job_scores.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Scores</h2>
              <div className="space-y-4">
                {candidate.job_scores.map((score: any) => (
                  <div key={score.id} className="p-4 bg-gray-50 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{score.job_title || 'Unknown Job'}</p>
                      {score.rank && (
                        <span className="px-2 py-1 text-xs font-medium bg-secondary text-primary rounded-full">
                          Rank #{score.rank}
                        </span>
                      )}
                      {score.auto_rejected && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                          Auto-Rejected
                        </span>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs uppercase text-gray-500 mb-2">Overall Score</p>
                      <ScoreBadge value={score.score} />
                    </div>
                    {(score.experience_score !== null && score.experience_score !== undefined) || 
                     (score.education_score !== null && score.education_score !== undefined) ? (
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                        {score.experience_score !== null && score.experience_score !== undefined && (
                          <div className="text-center">
                            <p className="text-xs uppercase text-gray-500 mb-1">Experience</p>
                            <ScoreBadge value={score.experience_score} />
                          </div>
                        )}
                        {score.education_score !== null && score.education_score !== undefined && (
                          <div className="text-center">
                            <p className="text-xs uppercase text-gray-500 mb-1">Education</p>
                            <ScoreBadge value={score.education_score} />
                          </div>
                        )}
                      </div>
                    ) : null}
                    {score.rejection_reason && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs font-medium text-red-700 mb-1">Rejection Reason:</p>
                        <p className="text-xs text-gray-600">{score.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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

