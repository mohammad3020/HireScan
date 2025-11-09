import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Linkedin, Github, Plus, Calendar } from 'lucide-react';

// Mock data
const mockCandidate = {
  id: 1,
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  linkedin_url: 'https://linkedin.com/in/johndoe',
  github_url: 'https://github.com/johndoe',
  created_at: '2024-01-15T10:30:00Z',
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
        ],
      },
    },
  ],
  notes: [
    {
      id: 1,
      user_username: 'admin',
      content: 'Strong candidate with excellent technical skills. Recommended for interview.',
      created_at: '2024-01-16T14:20:00Z',
    },
    {
      id: 2,
      user_username: 'hr_manager',
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
      rank: 1,
      auto_rejected: false,
      scored_at: '2024-01-15T11:00:00Z',
    },
  ],
};

export const CandidateDetail = () => {
  useParams(); // id available but not used in mock
  const [newNote, setNewNote] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const candidate = mockCandidate;

  const handleAddNote = () => {
    if (newNote.trim()) {
      // Mock add note
      console.log('Adding note:', newNote);
      setNewNote('');
      setShowNoteForm(false);
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
              {candidate.github_url && (
                <div className="flex items-center space-x-3">
                  <Github className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">GitHub</p>
                    <a
                      href={candidate.github_url}
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
          {/* Job Scores */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Scores</h2>
            <div className="space-y-4">
              {candidate.job_scores.map((score) => (
                <div key={score.id} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{score.job_title}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">{score.score}%</span>
                    {score.rank && (
                      <span className="px-2 py-1 text-xs font-medium bg-secondary text-primary rounded-full">
                        Rank #{score.rank}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
              <button
                onClick={() => setShowNoteForm(!showNoteForm)}
                className="p-2 text-primary hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {showNoteForm && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  rows={3}
                  className="input-field"
                />
                <div className="flex items-center justify-end space-x-2 mt-2">
                  <button
                    onClick={() => {
                      setShowNoteForm(false);
                      setNewNote('');
                    }}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNote}
                    className="px-3 py-1 text-sm btn-primary"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {candidate.notes.map((note) => (
                <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">{note.user_username}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(note.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

