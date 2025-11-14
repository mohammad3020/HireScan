import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Clock,
  Calendar,
  Users,
  ShieldAlert,
  Upload,
  Edit,
  FileText,
  UserCheck,
} from 'lucide-react';
import { mockJobs } from './jobsData';
import { Upload as UploadPage } from './Upload';
import { ReviewCandidatesTab } from './ReviewCandidatesTab';

const formatAutoReject = (enabled: boolean) => (enabled ? 'Auto reject' : 'Manual review');

const badgeClass = (enabled: boolean) =>
  enabled ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-200';

const formatEducationLevel = {
  diploma: 'Diploma',
  bachelor: "Bachelor's",
  master: "Master's",
  doctorate: 'Doctorate',
  postdoctoral: 'Postdoctoral',
  any: 'Any',
} as const;

const formatEducationMajor = {
  computer_science: 'Computer Science',
  software_engineering: 'Software Engineering',
  electrical_engineering: 'Electrical Engineering',
  mechanical_engineering: 'Mechanical Engineering',
  business_administration: 'Business Administration',
  finance: 'Finance',
  marketing: 'Marketing',
  design: 'Design',
  other: 'Other',
  '': 'Not specified',
} as const;

const formatGender = {
  male: 'Male',
  female: 'Female',
  any: 'Any',
} as const;

const formatMilitary = {
  completed_or_full_exempt: 'Completed / Full Exempt',
  educational_exempt: 'Educational Exempt',
  any: 'Any',
} as const;

type TabType = 'details' | 'upload' | 'review';

export const JobProfile = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const job = mockJobs.find((position) => position.id === Number(id));

  // Get active tab from URL or default to 'details'
  const activeTab = (searchParams.get('tab') || 'details') as TabType;
  const setActiveTab = (tab: TabType) => {
    const params = new URLSearchParams();
    params.set('tab', tab);
    if (tab === 'upload' || tab === 'review') {
      params.set('jobId', id || '');
    }
    setSearchParams(params);
  };

  // Ensure jobId is in query params when upload or review tab is active
  useEffect(() => {
    if ((activeTab === 'upload' || activeTab === 'review') && id) {
      const currentJobId = searchParams.get('jobId');
      if (currentJobId !== id) {
        const params = new URLSearchParams(searchParams);
        params.set('jobId', id);
        setSearchParams(params, { replace: true });
      }
    }
  }, [activeTab, id, searchParams, setSearchParams]);

  if (!job) {
    return (
      <div className="space-y-6">
        <Link
          to="/jobs"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to job positions
        </Link>
        <div className="card p-12 text-center">
          <Briefcase className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-lg font-semibold text-gray-800">Job not found</p>
          <p className="mt-2 text-sm text-gray-500">
            The job you are looking for might have been removed or is unavailable.
          </p>
        </div>
      </div>
    );
  }

  const demographic = job.demographicRequirements;

  const DetailsContent = () => (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Role Summary</h2>
          <p className="text-sm leading-6 text-gray-700">{job.description}</p>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Demographic Requirements</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Age Range</span>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${badgeClass(
                    demographic.ageRange.autoReject
                  )}`}
                >
                  {formatAutoReject(demographic.ageRange.autoReject)}
                </span>
              </div>
              <p className="text-sm text-gray-800">
                {demographic.ageRange.min ?? '—'} - {demographic.ageRange.max ?? '—'} years old
              </p>
            </div>

            <div className="space-y-2 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Gender</span>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${badgeClass(
                    demographic.genderAutoReject
                  )}`}
                >
                  {formatAutoReject(demographic.genderAutoReject)}
                </span>
              </div>
              <p className="text-sm text-gray-800">{formatGender[demographic.gender]}</p>
            </div>

            <div className="space-y-2 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Military Status</span>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${badgeClass(
                    demographic.militaryAutoReject
                  )}`}
                >
                  {formatAutoReject(demographic.militaryAutoReject)}
                </span>
              </div>
              <p className="text-sm text-gray-800">
                {formatMilitary[demographic.militaryStatus]}
              </p>
            </div>

            <div className="space-y-2 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Education Level</span>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${badgeClass(
                    demographic.educationLevelAutoReject
                  )}`}
                >
                  {formatAutoReject(demographic.educationLevelAutoReject)}
                </span>
              </div>
              <p className="text-sm text-gray-800">
                {formatEducationLevel[demographic.educationLevel]}
              </p>
            </div>

            <div className="space-y-2 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">University Major</span>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${badgeClass(
                    demographic.educationMajorAutoReject
                  )}`}
                >
                  {formatAutoReject(demographic.educationMajorAutoReject)}
                </span>
              </div>
              <p className="text-sm text-gray-800">
                {formatEducationMajor[demographic.educationMajor]}
              </p>
            </div>

            <div className="space-y-2 rounded-xl border border-gray-200 p-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Preferred Universities</span>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${badgeClass(
                    demographic.preferredUniversitiesAutoReject
                  )}`}
                >
                  {formatAutoReject(demographic.preferredUniversitiesAutoReject)}
                </span>
              </div>
              {demographic.preferredUniversitiesEnabled &&
              demographic.preferredUniversities.length ? (
                <div className="flex flex-wrap gap-2">
                  {demographic.preferredUniversities.map((university) => (
                    <span
                      key={university}
                      className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
                    >
                      {university}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No preferred universities specified. All accredited programs welcomed.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Key Responsibilities</h2>
          <ul className="space-y-3 text-sm text-gray-700">
            {job.responsibilities.map((item) => (
              <li key={item} className="flex items-start">
                <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Requirements</h2>
          <ul className="space-y-3 text-sm text-gray-700">
            {job.requirements.map((item) => (
              <li key={item} className="flex items-start">
                <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Experience & Skills</h2>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${badgeClass(
                job.experienceMinYearsAutoReject
              )}`}
            >
              <ShieldAlert className="mr-1 h-3 w-3" />
              {formatAutoReject(job.experienceMinYearsAutoReject)}
            </span>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <span className="font-medium text-gray-600">Minimum Years of Experience:</span>{' '}
            <span className="text-gray-900">{job.experienceMinYears}+ years</span>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-800">Required Skills</h3>
            {job.requiredSkills.length ? (
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No specific skills listed.</p>
            )}
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="card space-y-4 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Role Details</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>Salary Range</span>
              <span className="font-medium text-gray-900">
                {job.salary.min} - {job.salary.max} {job.salary.currency} / {job.salary.period}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Employment Type</span>
              <span className="font-medium text-gray-900">{job.employmentType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Experience Level</span>
              <span className="font-medium text-gray-900">{job.experienceLevel}</span>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );

  return (
    <div className="space-y-6">
      <Link
        to="/jobs"
        className="inline-flex items-center text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to job positions
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Briefcase className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="font-medium text-primary">{job.department}</span>
              <span className="flex items-center text-gray-500">
                <MapPin className="mr-1 h-4 w-4" />
                {job.location}
              </span>
              <span className="flex items-center text-gray-500">
                <Clock className="mr-1 h-4 w-4" />
                {job.employmentType}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/jobs/${job.id}`}
            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit job"
          >
            <Edit className="h-5 w-5" />
          </Link>
          <div className="flex flex-col items-end space-y-3 text-sm text-gray-600">
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
              {job.status.toUpperCase()}
            </span>
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Users className="mr-1 h-4 w-4 text-gray-400" />
                {job.candidates} applicants
              </span>
              <span className="flex items-center">
                <Calendar className="mr-1 h-4 w-4 text-gray-400" />
                Posted {new Date(job.created_at).toLocaleDateString()}
              </span>
              <span className="text-primary font-semibold">Avg. Score: {job.averageScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'details'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Details
            </div>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'upload'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Resumes
            </div>
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'review'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Review Candidates
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'details' && <DetailsContent />}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <UploadPage />
          </div>
        )}
        {activeTab === 'review' && job && (
          <ReviewCandidatesTab jobId={job.id} />
        )}
      </div>
    </div>
  );
};
