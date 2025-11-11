import { ChangeEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

// Mock departments
const departments = [
  { id: 1, name: 'Engineering' },
  { id: 2, name: 'Product' },
  { id: 3, name: 'Design' },
  { id: 4, name: 'Marketing' },
  { id: 5, name: 'Sales' },
];

const genderOptions = [
  { value: '', label: 'Select gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'any', label: 'Any' },
];

const militaryStatusOptions = [
  { value: 'completed_or_full_exempt', label: 'Completed / Full Exempt' },
  { value: 'educational_exempt', label: 'Educational Exempt' },
  { value: 'any', label: 'Any' },
];

const educationLevelOptions = [
  { value: '', label: 'Select level' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelor', label: "Bachelor's" },
  { value: 'master', label: "Master's" },
  { value: 'doctorate', label: 'Doctorate' },
  { value: 'postdoctoral', label: 'Postdoctoral' },
  { value: 'any', label: 'Any' },
];

const employmentTypeOptions = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' },
];

const experienceLevelOptions = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'management', label: 'Management' },
];

const educationMajorOptions = [
  { value: '', label: 'Select major' },
  { value: 'computer_science', label: 'Computer Science' },
  { value: 'software_engineering', label: 'Software Engineering' },
  { value: 'electrical_engineering', label: 'Electrical Engineering' },
  { value: 'mechanical_engineering', label: 'Mechanical Engineering' },
  { value: 'business_administration', label: 'Business Administration' },
  { value: 'finance', label: 'Finance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'design', label: 'Design' },
  { value: 'other', label: 'Other' },
];

const universityOptions = [
  'University of Tehran',
  'Sharif University of Technology',
  'Amirkabir University of Technology',
  'Shahid Beheshti University',
  'Iran University of Science and Technology',
  'Tehran University of Medical Sciences',
  'Ferdowsi University of Mashhad',
  'Isfahan University of Technology',
  'Allameh Tabataba\'i University',
  'Tabriz University',
];

const SALARY_MIN_BOUND = 0;
const SALARY_MAX_BOUND = 200;
const SALARY_STEP = 1;
const SALARY_MIN_GAP = 1;

export const JobForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: isEdit ? 'Senior Software Engineer' : '',
    description: isEdit ? 'We are looking for an experienced software engineer...' : '',
    department: '',
    location: '',
    employment_type: '',
    experience_level: '',
    salary_min: '30',
    salary_max: '80',
    required_skills: [] as string[],
    experience_min_years: '',
    experience_min_years_auto_reject: false,
    demographic_requirements: {
      gender: '',
      gender_auto_reject: false,
      military_status: '',
      military_auto_reject: false,
      education_level: '',
      education_level_auto_reject: false,
      education_major: '',
      education_major_auto_reject: false,
      preferred_universities_enabled: false,
      preferred_universities_auto_reject: false,
      preferred_universities: [] as string[],
      age_range: {
        min: '',
        max: '',
        auto_reject: false,
      },
    },
  });

  const [skillInput, setSkillInput] = useState('');
  const [salaryRange, setSalaryRange] = useState({
    min: Number.isNaN(Number(formData.salary_min)) ? 30 : Number(formData.salary_min),
    max: Number.isNaN(Number(formData.salary_max)) ? 80 : Number(formData.salary_max),
  });

  const handleMilitaryStatusChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      demographic_requirements: {
        ...prev.demographic_requirements,
        military_status: value,
      },
    }));
  };

  const togglePreferredUniversity = (university: string) => {
    setFormData((prev) => {
      const current = prev.demographic_requirements.preferred_universities;
      const exists = current.includes(university);
      return {
        ...prev,
        demographic_requirements: {
          ...prev.demographic_requirements,
          preferred_universities: exists
            ? current.filter((item) => item !== university)
            : [...current, university],
        },
      };
    });
  };

  const clampSalary = (value: number) =>
    Math.min(Math.max(value, SALARY_MIN_BOUND), SALARY_MAX_BOUND);

  const applySalaryChange = (type: 'min' | 'max', rawValue: number) => {
    const safeValue = Number.isNaN(rawValue) ? SALARY_MIN_BOUND : rawValue;
    const value = clampSalary(safeValue);

    setSalaryRange((prevRange) => {
      let nextRange = prevRange;

      if (type === 'min') {
        const adjustedMin = Math.min(value, prevRange.max - SALARY_MIN_GAP);
        nextRange = {
          min: clampSalary(Math.min(adjustedMin, prevRange.max)),
          max: prevRange.max,
        };
      } else {
        const adjustedMax = Math.max(value, prevRange.min + SALARY_MIN_GAP);
        nextRange = {
          min: prevRange.min,
          max: clampSalary(Math.max(adjustedMax, prevRange.min)),
        };
      }

      setFormData((prevData) => ({
        ...prevData,
        salary_min: nextRange.min.toString(),
        salary_max: nextRange.max.toString(),
      }));

      return nextRange;
    });
  };

  const handleSalarySliderChange =
    (type: 'min' | 'max') => (event: ChangeEvent<HTMLInputElement>) => {
      applySalaryChange(type, Number(event.target.value));
    };

  const handleSalaryInputChange =
    (type: 'min' | 'max') => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value === '' ? SALARY_MIN_BOUND : Number(event.target.value);
      applySalaryChange(type, value);
    };

  const salaryTrackPositions = {
    start: ((salaryRange.min - SALARY_MIN_BOUND) / (SALARY_MAX_BOUND - SALARY_MIN_BOUND)) * 100,
    end: ((salaryRange.max - SALARY_MIN_BOUND) / (SALARY_MAX_BOUND - SALARY_MIN_BOUND)) * 100,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock save
    console.log('Saving job:', formData);
    navigate('/jobs');
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.required_skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        required_skills: [...formData.required_skills, skillInput.trim()],
      });
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      required_skills: formData.required_skills.filter((s) => s !== skill),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/jobs')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Job' : 'Create New Job'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Update job description and requirements' : 'Add a new job posting'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {/* Job Overview */}
        <div className="rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Overview</h2>
          <div className="space-y-5">
            <div className="max-w-2xl">
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                placeholder="e.g. Senior Frontend Developer"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-6 max-w-3xl">
              <div className="max-w-xs md:max-w-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="max-w-xs md:max-w-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Tehran, Remote"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-6 max-w-3xl">
              <div className="max-w-xs md:max-w-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                <select
                  value={formData.employment_type}
                  onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                  className="input-field"
                >
                  {employmentTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="max-w-xs md:max-w-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                <select
                  value={formData.experience_level}
                  onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                  className="input-field"
                >
                  {experienceLevelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="max-w-xs space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <label className="block text-sm font-medium text-gray-700">
                  Minimum Years of Experience
                </label>
                <label className="inline-flex items-center text-xs text-gray-600">
                  <input
                    type="checkbox"
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={formData.experience_min_years_auto_reject}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        experience_min_years_auto_reject: e.target.checked,
                      })
                    }
                  />
                  Auto reject if not
                </label>
              </div>
              <input
                type="number"
                value={formData.experience_min_years}
                onChange={(e) => setFormData({ ...formData, experience_min_years: e.target.value })}
                className="input-field"
                min={0}
                placeholder="e.g. 3"
              />
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-6">
            <div className="w-full max-w-2xl rounded-2xl border border-blue-300 bg-blue-50/40 p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    Salary Range (Million Toman/Month)
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="range-slider">
                    <div className="range-slider__track" />
                    <div
                      className="range-slider__range"
                      style={{
                        left: `${salaryTrackPositions.start}%`,
                        right: `${100 - salaryTrackPositions.end}%`,
                      }}
                    />
                    <input
                      type="range"
                      min={SALARY_MIN_BOUND}
                      max={SALARY_MAX_BOUND}
                      step={SALARY_STEP}
                      value={salaryRange.min}
                      onChange={handleSalarySliderChange('min')}
                      className="range-slider__input"
                    />
                    <input
                      type="range"
                      min={SALARY_MIN_BOUND}
                      max={SALARY_MAX_BOUND}
                      step={SALARY_STEP}
                      value={salaryRange.max}
                      onChange={handleSalarySliderChange('max')}
                      className="range-slider__input"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0</span>
                    <span>100</span>
                    <span>200+</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="max-w-xs space-y-2">
                    <span className="text-sm font-semibold text-gray-700">Minimum</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={salaryRange.min}
                        min={SALARY_MIN_BOUND}
                        max={SALARY_MAX_BOUND}
                        onChange={handleSalaryInputChange('min')}
                        className="input-field max-w-[120px]"
                      />
                      <span className="text-sm font-medium text-gray-500">M</span>
                    </div>
                  </div>
                  <div className="max-w-xs space-y-2">
                    <span className="text-sm font-semibold text-gray-700">Maximum</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={salaryRange.max}
                        min={SALARY_MIN_BOUND}
                        max={SALARY_MAX_BOUND}
                        onChange={handleSalaryInputChange('max')}
                        className="input-field max-w-[120px]"
                      />
                      <span className="text-sm font-medium text-gray-500">M</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-blue-100 px-4 py-3 text-center text-sm font-medium text-blue-900">
                  Range: {salaryRange.min} - {salaryRange.max} Million Toman
                </div>
            </div>
          </div>
        </div>

        {/* Required Skills */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h2>
          <div className="space-y-4">
            <div className="flex w-full max-w-lg">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Add a skill and press Enter"
                className="input-field w-full rounded-r-none"
              />
              <button
                type="button"
                onClick={addSkill}
                className="btn-secondary rounded-l-none whitespace-nowrap"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.required_skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-3 py-1 bg-primary text-white rounded-full text-sm"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-2 hover:text-gray-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Demographic Requirements */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Demographic Requirements</h2>
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <label className="block text-sm font-medium text-gray-700">Age Range</label>
                <label className="inline-flex items-center text-xs text-gray-600">
                  <input
                    type="checkbox"
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={formData.demographic_requirements.age_range.auto_reject}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        demographic_requirements: {
                          ...formData.demographic_requirements,
                          age_range: {
                            ...formData.demographic_requirements.age_range,
                            auto_reject: e.target.checked,
                          },
                        },
                      })
                    }
                  />
                  Auto reject candidates outside this range
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="number"
                  placeholder="Min"
                  value={formData.demographic_requirements.age_range.min}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      demographic_requirements: {
                        ...formData.demographic_requirements,
                        age_range: {
                          ...formData.demographic_requirements.age_range,
                          min: e.target.value,
                        },
                      },
                    })
                  }
                  className="input-field max-w-[120px]"
                  min={0}
                />
                <span className="text-sm text-gray-500">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={formData.demographic_requirements.age_range.max}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      demographic_requirements: {
                        ...formData.demographic_requirements,
                        age_range: {
                          ...formData.demographic_requirements.age_range,
                          max: e.target.value,
                        },
                      },
                    })
                  }
                  className="input-field max-w-[120px]"
                  min={0}
                />
                <span className="text-sm text-gray-500">years old</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <label className="inline-flex items-center text-xs text-gray-600">
                  <input
                    type="checkbox"
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={formData.demographic_requirements.gender_auto_reject}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        demographic_requirements: {
                          ...formData.demographic_requirements,
                          gender_auto_reject: e.target.checked,
                        },
                      })
                    }
                  />
                  Auto reject if not
                </label>
              </div>
              <select
                className="input-field max-w-[200px]"
                value={formData.demographic_requirements.gender}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    demographic_requirements: {
                      ...formData.demographic_requirements,
                      gender: e.target.value,
                    },
                  })
                }
              >
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <label className="block text-sm font-medium text-gray-700">
                  Military Status
                </label>
                <label className="inline-flex items-center text-xs text-gray-600">
                  <input
                    type="checkbox"
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={formData.demographic_requirements.military_auto_reject}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        demographic_requirements: {
                          ...formData.demographic_requirements,
                          military_auto_reject: e.target.checked,
                        },
                      })
                    }
                  />
                  Auto reject if not
                </label>
              </div>
              <div className="space-y-3 rounded-lg border border-gray-200 p-4 max-w-3xl">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {militaryStatusOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center rounded-md border px-3 py-2 text-sm transition hover:border-primary/60 ${
                        formData.demographic_requirements.military_status === option.value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="military-status"
                        value={option.value}
                        checked={formData.demographic_requirements.military_status === option.value}
                        onChange={() => handleMilitaryStatusChange(option.value)}
                        className="mr-3 h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-4 mb-2">
                <label className="block text-sm font-medium text-gray-700">Minimum Educational Level</label>
                <label className="inline-flex items-center text-xs text-gray-600">
                  <input
                    type="checkbox"
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={formData.demographic_requirements.education_level_auto_reject}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        demographic_requirements: {
                          ...formData.demographic_requirements,
                          education_level_auto_reject: e.target.checked,
                        },
                      })
                    }
                  />
                  Auto reject if not
                </label>
              </div>
              <select
                className="input-field max-w-[240px]"
                value={formData.demographic_requirements.education_level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    demographic_requirements: {
                      ...formData.demographic_requirements,
                      education_level: e.target.value,
                    },
                  })
                }
              >
                {educationLevelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-4 mb-2">
                <label className="block text-sm font-medium text-gray-700">University Major</label>
                <label className="inline-flex items-center text-xs text-gray-600">
                  <input
                    type="checkbox"
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={formData.demographic_requirements.education_major_auto_reject}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        demographic_requirements: {
                          ...formData.demographic_requirements,
                          education_major_auto_reject: e.target.checked,
                        },
                      })
                    }
                  />
                  Auto reject if not
                </label>
              </div>
              <select
                className="input-field max-w-[240px]"
                value={formData.demographic_requirements.education_major}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    demographic_requirements: {
                      ...formData.demographic_requirements,
                      education_major: e.target.value,
                    },
                  })
                }
              >
                {educationMajorOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <label className="block text-sm font-medium text-gray-700">Target Universities</label>
                <label className="inline-flex items-center text-xs text-gray-600">
                  <input
                    type="checkbox"
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={formData.demographic_requirements.preferred_universities_auto_reject}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        demographic_requirements: {
                          ...formData.demographic_requirements,
                          preferred_universities_auto_reject: e.target.checked,
                        },
                      })
                    }
                  />
                  Auto reject if not
                </label>
              </div>
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mr-3 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={formData.demographic_requirements.preferred_universities_enabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      demographic_requirements: {
                        ...formData.demographic_requirements,
                        preferred_universities_enabled: e.target.checked,
                        preferred_universities: e.target.checked
                          ? formData.demographic_requirements.preferred_universities
                          : [],
                      },
                    })
                  }
                />
                Enable preferred universities
              </label>

              {formData.demographic_requirements.preferred_universities_enabled && (
                <div className="rounded-lg border border-gray-200 p-4 max-w-3xl">
                  <p className="mb-3 text-xs text-gray-500">
                    Select one or more universities that you prefer candidates to have attended.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {universityOptions.map((university) => {
                      const isSelected = formData.demographic_requirements.preferred_universities.includes(university);
                      return (
                        <label
                          key={university}
                          className={`flex items-center rounded-md border px-3 py-2 text-sm transition hover:border-primary/60 ${isSelected ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-700'}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePreferredUniversity(university)}
                            className="mr-3 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          {university}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="max-w-3xl border-t border-gray-200 pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="input-field"
                required
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/jobs')}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center"
            >
              <Save className="h-5 w-5 mr-2" />
              {isEdit ? 'Update Job' : 'Create Job'}
            </button>
        </div>
      </form>
    </div>
  );
};

