import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Linkedin, Calendar, Sparkles, Wallet } from 'lucide-react';

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
  useParams(); // id available but not used in mock
  const [newNote, setNewNote] = useState('');
  const candidate = mockCandidate;
  const resume = candidate.resumes?.[0];
  const parsedResume = resume?.parsed_data;
  const educationEntries =
    (parsedResume?.education as any[]) ??
    ((parsedResume as any)?.parsed_data?.education as any[]) ??
    [];
  const formatDate = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      // Mock add note
      console.log('Adding note:', newNote);
      setNewNote('');
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
          {candidate.resumes[0]?.parsed_data?.experiences && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Experience</h2>
              <div className="space-y-6">
                {candidate.resumes[0].parsed_data.experiences.map((exp: any) => (
                  <div key={exp.id} className="border-l-4 border-secondary pl-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{exp.role}</h3>
                        <p className="text-sm font-medium text-gray-600">{exp.company}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(exp.start_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                          })}{' '}
                          -{' '}
                          {exp.is_current
                            ? 'Present'
                            : new Date(exp.end_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                              })}
                        </p>
                        {exp.description && (
                          <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {candidate.resumes[0]?.parsed_data?.skills && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {candidate.resumes[0].parsed_data.skills.map((skill: any) => (
                  <span
                    key={skill.id}
                    className="px-3 py-1 bg-primary text-white rounded-full text-sm font-medium"
                  >
                    {skill.name}
                    {skill.proficiency && (
                      <span className="ml-2 text-xs opacity-75">({skill.proficiency})</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Other Highlights */}
          {candidate.resumes[0]?.parsed_data?.additional_info && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Other Highlights</h2>
              <div className="space-y-4">
                {candidate.resumes[0].parsed_data.additional_info.achievements?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Achievements</h3>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {candidate.resumes[0].parsed_data.additional_info.achievements.map((item: string, i: number) => (
                        <li key={`achievement-${i}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {candidate.resumes[0].parsed_data.additional_info.articles?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Articles & Publications</h3>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {candidate.resumes[0].parsed_data.additional_info.articles.map((item: string, i: number) => (
                        <li key={`article-${i}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-4">
              {candidate.timeline_events.map((event) => (
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <dl className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <dt className="font-medium text-gray-600">Age</dt>
                <dd>{candidate.basic_information.age}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-600">Location</dt>
                <dd>{candidate.basic_information.location}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-600">Gender</dt>
                <dd>{candidate.basic_information.gender}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-600">Military Status</dt>
                <dd>{candidate.basic_information.military_status}</dd>
              </div>
            </dl>
          </div>

          {/* Job Scores */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Scores</h2>
            <div className="space-y-4">
              {candidate.job_scores.map((score) => (
                <div key={score.id} className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{score.job_title}</p>
                    {score.rank && (
                      <span className="px-2 py-1 text-xs font-medium bg-secondary text-primary rounded-full">
                        Rank #{score.rank}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="space-y-2">
                      <p className="text-xs uppercase text-gray-500">Overall</p>
                      <ScoreBadge value={score.score} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase text-gray-500">Experience</p>
                      <ScoreBadge value={score.experience_score} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase text-gray-500">Education</p>
                      <ScoreBadge value={score.education_score} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Review */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">AI Review</h2>
            </div>
            <p className="text-sm leading-6 text-gray-700">{candidate.ai_review}</p>
          </div>

          {/* Salary Expectation */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-gray-900">Expected Salary</h2>
            </div>
            <p className="text-sm font-medium text-gray-800">{candidate.expected_salary}</p>
          </div>

          {/* Notes */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>

            <div className="space-y-4 mb-4">
              {candidate.notes.map((note) => (
                <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">{note.user_email}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(note.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700">{note.content}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="input-field flex-1"
              />
              <button
                onClick={handleAddNote}
                className="px-3 py-2 text-sm btn-primary"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

