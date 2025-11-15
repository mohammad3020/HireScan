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
    candidates: 20,
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
    candidates: 20,
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
    candidates: 20,
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
    candidates: 20,
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
  {
    id: 5,
    title: 'DevOps Engineer',
    department: 'Engineering',
    candidates: 20,
    averageScore: 81.2,
    status: 'active',
    created_at: '2024-02-15',
    location: 'Tehran, Hybrid',
    employmentType: 'Full-time',
    experienceLevel: 'Mid-level',
    description:
      'Build and maintain cloud infrastructure, CI/CD pipelines, and monitoring systems. Ensure high availability and scalability of our platform.',
    salary: {
      min: 28,
      max: 42,
      currency: 'Million Toman',
      period: 'Month',
    },
    experienceMinYears: 3,
    experienceMinYearsAutoReject: true,
    requirements: [
      '3+ years of DevOps or infrastructure engineering experience',
      'Expertise with AWS, Docker, and Kubernetes',
      'Experience with CI/CD tools (Jenkins, GitLab CI)',
      'Strong scripting skills (Bash, Python)',
    ],
    responsibilities: [
      'Design and implement cloud infrastructure',
      'Maintain and optimize CI/CD pipelines',
      'Monitor system performance and troubleshoot issues',
      'Automate deployment and scaling processes',
    ],
    requiredSkills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform'],
    demographicRequirements: {
      ageRange: {
        min: 26,
        max: 38,
        autoReject: true,
      },
      gender: 'any',
      genderAutoReject: false,
      militaryStatus: 'completed_or_full_exempt',
      militaryAutoReject: true,
      educationLevel: 'bachelor',
      educationLevelAutoReject: true,
      educationMajor: 'computer_science',
      educationMajorAutoReject: false,
      preferredUniversitiesEnabled: false,
      preferredUniversitiesAutoReject: false,
      preferredUniversities: [],
    },
  },
  {
    id: 6,
    title: 'Frontend Developer',
    department: 'Engineering',
    candidates: 20,
    averageScore: 76.8,
    status: 'active',
    created_at: '2024-02-20',
    location: 'Remote',
    employmentType: 'Full-time',
    experienceLevel: 'Junior',
    description:
      'Build responsive and interactive user interfaces using modern frontend technologies. Collaborate with designers and backend developers.',
    salary: {
      min: 18,
      max: 28,
      currency: 'Million Toman',
      period: 'Month',
    },
    experienceMinYears: 2,
    experienceMinYearsAutoReject: false,
    requirements: [
      '2+ years of frontend development experience',
      'Proficiency in React, JavaScript, and CSS',
      'Experience with state management libraries',
      'Understanding of responsive design principles',
    ],
    responsibilities: [
      'Develop and maintain frontend applications',
      'Implement responsive designs',
      'Optimize application performance',
      'Collaborate with design and backend teams',
    ],
    requiredSkills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'Redux'],
    demographicRequirements: {
      ageRange: {
        min: 22,
        max: 32,
        autoReject: false,
      },
      gender: 'any',
      genderAutoReject: false,
      militaryStatus: 'any',
      militaryAutoReject: false,
      educationLevel: 'bachelor',
      educationLevelAutoReject: false,
      educationMajor: 'computer_science',
      educationMajorAutoReject: false,
      preferredUniversitiesEnabled: false,
      preferredUniversitiesAutoReject: false,
      preferredUniversities: [],
    },
  },
  {
    id: 7,
    title: 'Backend Developer',
    department: 'Engineering',
    candidates: 20,
    averageScore: 79.5,
    status: 'active',
    created_at: '2024-03-01',
    location: 'Tehran, On-site',
    employmentType: 'Full-time',
    experienceLevel: 'Mid-level',
    description:
      'Design and develop scalable backend services and APIs. Work with databases, microservices, and cloud infrastructure.',
    salary: {
      min: 25,
      max: 38,
      currency: 'Million Toman',
      period: 'Month',
    },
    experienceMinYears: 3,
    experienceMinYearsAutoReject: true,
    requirements: [
      '3+ years of backend development experience',
      'Expertise in Node.js, Python, or Java',
      'Experience with databases (PostgreSQL, MongoDB)',
      'Understanding of RESTful APIs and microservices',
    ],
    responsibilities: [
      'Design and implement backend services',
      'Develop RESTful APIs',
      'Optimize database queries and performance',
      'Ensure code quality and security',
    ],
    requiredSkills: ['Node.js', 'Python', 'PostgreSQL', 'REST APIs', 'Microservices'],
    demographicRequirements: {
      ageRange: {
        min: 25,
        max: 36,
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
      preferredUniversitiesEnabled: false,
      preferredUniversitiesAutoReject: false,
      preferredUniversities: [],
    },
  },
  {
    id: 8,
    title: 'Marketing Manager',
    department: 'Marketing',
    candidates: 20,
    averageScore: 73.4,
    status: 'active',
    created_at: '2024-03-05',
    location: 'Tehran, Hybrid',
    employmentType: 'Full-time',
    experienceLevel: 'Senior',
    description:
      'Lead marketing campaigns and strategies to drive brand awareness and customer acquisition. Manage marketing team and budget.',
    salary: {
      min: 22,
      max: 32,
      currency: 'Million Toman',
      period: 'Month',
    },
    experienceMinYears: 5,
    experienceMinYearsAutoReject: false,
    requirements: [
      '5+ years of marketing experience',
      'Experience with digital marketing channels',
      'Strong analytical and communication skills',
      'Proven track record of successful campaigns',
    ],
    responsibilities: [
      'Develop and execute marketing strategies',
      'Manage marketing campaigns and budget',
      'Analyze market trends and customer behavior',
      'Lead and mentor marketing team',
    ],
    requiredSkills: ['Digital Marketing', 'SEO', 'Content Marketing', 'Analytics', 'Campaign Management'],
    demographicRequirements: {
      ageRange: {
        min: 28,
        max: 42,
        autoReject: false,
      },
      gender: 'any',
      genderAutoReject: false,
      militaryStatus: 'any',
      militaryAutoReject: false,
      educationLevel: 'bachelor',
      educationLevelAutoReject: false,
      educationMajor: 'marketing',
      educationMajorAutoReject: false,
      preferredUniversitiesEnabled: false,
      preferredUniversitiesAutoReject: false,
      preferredUniversities: [],
    },
  },
  {
    id: 9,
    title: 'Sales Representative',
    department: 'Sales',
    candidates: 20,
    averageScore: 70.6,
    status: 'active',
    created_at: '2024-03-10',
    location: 'Tehran, On-site',
    employmentType: 'Full-time',
    experienceLevel: 'Junior',
    description:
      'Build relationships with clients and drive sales. Identify new business opportunities and achieve sales targets.',
    salary: {
      min: 15,
      max: 25,
      currency: 'Million Toman',
      period: 'Month',
    },
    experienceMinYears: 1,
    experienceMinYearsAutoReject: false,
    requirements: [
      '1+ years of sales experience',
      'Excellent communication and negotiation skills',
      'Ability to build and maintain client relationships',
      'Goal-oriented and self-motivated',
    ],
    responsibilities: [
      'Identify and pursue sales opportunities',
      'Build relationships with potential clients',
      'Present products and services',
      'Achieve monthly sales targets',
    ],
    requiredSkills: ['Sales', 'Customer Relations', 'Negotiation', 'CRM', 'Communication'],
    demographicRequirements: {
      ageRange: {
        min: 23,
        max: 35,
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
    id: 10,
    title: 'QA Engineer',
    department: 'Engineering',
    candidates: 20,
    averageScore: 74.9,
    status: 'active',
    created_at: '2024-03-15',
    location: 'Remote',
    employmentType: 'Full-time',
    experienceLevel: 'Mid-level',
    description:
      'Ensure software quality through comprehensive testing. Design test cases, execute tests, and collaborate with development teams.',
    salary: {
      min: 20,
      max: 30,
      currency: 'Million Toman',
      period: 'Month',
    },
    experienceMinYears: 3,
    experienceMinYearsAutoReject: false,
    requirements: [
      '3+ years of QA/testing experience',
      'Knowledge of testing methodologies and tools',
      'Experience with automated testing frameworks',
      'Strong attention to detail',
    ],
    responsibilities: [
      'Design and execute test cases',
      'Identify and report bugs',
      'Collaborate with development teams',
      'Maintain test documentation',
    ],
    requiredSkills: ['Testing', 'Selenium', 'Jest', 'Test Automation', 'Bug Tracking'],
    demographicRequirements: {
      ageRange: {
        min: 24,
        max: 34,
        autoReject: false,
      },
      gender: 'any',
      genderAutoReject: false,
      militaryStatus: 'any',
      militaryAutoReject: false,
      educationLevel: 'bachelor',
      educationLevelAutoReject: false,
      educationMajor: 'computer_science',
      educationMajorAutoReject: false,
      preferredUniversitiesEnabled: false,
      preferredUniversitiesAutoReject: false,
      preferredUniversities: [],
    },
  },
];

