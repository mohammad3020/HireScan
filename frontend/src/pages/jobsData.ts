export type JobPosition = {
  id: number;
  title: string;
  department: string;
  candidates: number;
  averageScore: number;
  status: 'active' | 'draft' | 'closed';
  created_at: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  description: string;
  salary: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  experienceMinYears: number;
  experienceMinYearsAutoReject: boolean;
  requirements: string[];
  responsibilities: string[];
  requiredSkills: string[];
  demographicRequirements: {
    ageRange: {
      min: number | null;
      max: number | null;
      autoReject: boolean;
    };
    gender: 'male' | 'female' | 'any';
    genderAutoReject: boolean;
    militaryStatus: 'completed_or_full_exempt' | 'educational_exempt' | 'any';
    militaryAutoReject: boolean;
    educationLevel:
      | 'diploma'
      | 'bachelor'
      | 'master'
      | 'doctorate'
      | 'postdoctoral'
      | 'any';
    educationLevelAutoReject: boolean;
    educationMajor:
      | 'computer_science'
      | 'software_engineering'
      | 'electrical_engineering'
      | 'mechanical_engineering'
      | 'business_administration'
      | 'finance'
      | 'marketing'
      | 'design'
      | 'other'
      | '';
    educationMajorAutoReject: boolean;
    preferredUniversitiesEnabled: boolean;
    preferredUniversitiesAutoReject: boolean;
    preferredUniversities: string[];
  };
};

export const mockJobs: JobPosition[] = [
  {
    id: 1,
    title: 'Senior Software Engineer',
    department: 'Engineering',
    candidates: 24,
    averageScore: 82.5,
    status: 'active',
    created_at: '2024-01-15',
    location: 'Tehran, Hybrid',
    employmentType: 'Full-time',
    experienceLevel: 'Senior',
    description:
      'Join our engineering team to design and build scalable microservices that power mission-critical applications. You will collaborate with cross-functional teams and mentor junior engineers.',
    salary: {
      min: 30,
      max: 45,
      currency: 'Million Toman',
      period: 'Month',
    },
    experienceMinYears: 5,
    experienceMinYearsAutoReject: true,
    requirements: [
      '5+ years of professional experience in software development',
      'Expertise with Node.js, TypeScript, and React',
      'Experience with microservices and event-driven architecture',
      'Strong understanding of CI/CD pipelines',
    ],
    responsibilities: [
      'Design, develop, and maintain backend services',
      'Collaborate with product and design to deliver features',
      'Ensure code quality through code reviews and testing',
      'Guide and mentor junior team members',
    ],
    requiredSkills: ['Node.js', 'TypeScript', 'React', 'Microservices', 'CI/CD'],
    demographicRequirements: {
      ageRange: {
        min: 27,
        max: 40,
        autoReject: true,
      },
      gender: 'any',
      genderAutoReject: false,
      militaryStatus: 'completed_or_full_exempt',
      militaryAutoReject: true,
      educationLevel: 'bachelor',
      educationLevelAutoReject: true,
      educationMajor: 'software_engineering',
      educationMajorAutoReject: false,
      preferredUniversitiesEnabled: true,
      preferredUniversitiesAutoReject: false,
      preferredUniversities: [
        'Sharif University of Technology',
        'Amirkabir University of Technology',
        'University of Tehran',
      ],
    },
  },
  {
    id: 2,
    title: 'Product Manager',
    department: 'Product',
    candidates: 18,
    averageScore: 75.3,
    status: 'active',
    created_at: '2024-01-20',
    location: 'Remote',
    employmentType: 'Full-time',
    experienceLevel: 'Mid-level',
    description:
      'Drive product strategy and roadmap for our customer-facing applications. Work closely with engineering, design, and stakeholders to deliver impactful solutions.',
    salary: {
      min: 25,
      max: 35,
      currency: 'Million Toman',
      period: 'Month',
    },
    experienceMinYears: 3,
    experienceMinYearsAutoReject: false,
    requirements: [
      '3+ years experience as a Product Manager',
      'Strong analytical and communication skills',
      'Experience working with agile teams',
      'Ability to translate customer needs into product features',
    ],
    responsibilities: [
      'Define product vision and strategy',
      'Prioritize features and manage the product backlog',
      'Coordinate cross-functional teams for product delivery',
      'Measure product performance and iterate based on feedback',
    ],
    requiredSkills: ['Roadmapping', 'Analytics', 'Stakeholder Management', 'Agile'],
    demographicRequirements: {
      ageRange: {
        min: 25,
        max: 38,
        autoReject: false,
      },
      gender: 'any',
      genderAutoReject: false,
      militaryStatus: 'any',
      militaryAutoReject: false,
      educationLevel: 'bachelor',
      educationLevelAutoReject: false,
      educationMajor: 'business_administration',
      educationMajorAutoReject: false,
      preferredUniversitiesEnabled: false,
      preferredUniversitiesAutoReject: false,
      preferredUniversities: [],
    },
  },
  {
    id: 3,
    title: 'UX Designer',
    department: 'Design',
    candidates: 32,
    averageScore: 88.1,
    status: 'active',
    created_at: '2024-02-01',
    location: 'Tehran, On-site',
    employmentType: 'Full-time',
    experienceLevel: 'Mid-level',
    description:
      'Create user-centered designs that deliver delightful experiences. You will craft user journeys, prototypes, and collaborate with product and engineering teams.',
    salary: {
      min: 20,
      max: 30,
      currency: 'Million Toman',
      period: 'Month',
    },
    experienceMinYears: 3,
    experienceMinYearsAutoReject: false,
    requirements: [
      '3+ years of experience in UX/UI design',
      'Proficiency in Figma or similar tools',
      'Experience conducting user research and usability testing',
      'Strong portfolio showcasing user-centered design',
    ],
    responsibilities: [
      'Design wireframes, prototypes, and high-fidelity visuals',
      'Conduct user research and synthesize insights',
      'Collaborate with engineers to ensure design feasibility',
      'Maintain and evolve the design system',
    ],
    requiredSkills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
    demographicRequirements: {
      ageRange: {
        min: 24,
        max: 35,
        autoReject: false,
      },
      gender: 'any',
      genderAutoReject: false,
      militaryStatus: 'any',
      militaryAutoReject: false,
      educationLevel: 'bachelor',
      educationLevelAutoReject: false,
      educationMajor: 'design',
      educationMajorAutoReject: false,
      preferredUniversitiesEnabled: false,
      preferredUniversitiesAutoReject: false,
      preferredUniversities: [],
    },
  },
  {
    id: 4,
    title: 'Data Scientist',
    department: 'Data',
    candidates: 15,
    averageScore: 79.4,
    status: 'active',
    created_at: '2024-02-10',
    location: 'Remote',
    employmentType: 'Contract',
    experienceLevel: 'Senior',
    description:
      'Analyze large datasets to unlock insights and build predictive models that drive strategic decisions for the business.',
    salary: {
      min: 35,
      max: 50,
      currency: 'Million Toman',
      period: 'Month',
    },
    experienceMinYears: 5,
    experienceMinYearsAutoReject: true,
    requirements: [
      '5+ years of experience in data science or analytics',
      'Expertise in Python, SQL, and machine learning frameworks',
      'Experience deploying models to production',
      'Strong statistical background and experimentation skills',
    ],
    responsibilities: [
      'Build predictive and classification models',
      'Collaborate with stakeholders to identify data opportunities',
      'Develop data pipelines and automated reporting',
      'Communicate findings and recommendations to leadership',
    ],
    requiredSkills: ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Data Pipelines'],
    demographicRequirements: {
      ageRange: {
        min: 28,
        max: 45,
        autoReject: true,
      },
      gender: 'any',
      genderAutoReject: false,
      militaryStatus: 'completed_or_full_exempt',
      militaryAutoReject: false,
      educationLevel: 'master',
      educationLevelAutoReject: true,
      educationMajor: 'computer_science',
      educationMajorAutoReject: false,
      preferredUniversitiesEnabled: true,
      preferredUniversitiesAutoReject: true,
      preferredUniversities: ['University of Tehran', 'Sharif University of Technology'],
    },
  },
];

