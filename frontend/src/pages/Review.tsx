import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { mockJobs } from './jobsData';
import { useCandidatesStore } from '../store/candidates';
import {
  Search,
  RefreshCw,
  Download,
  User,
  TrendingUp,
  ArrowUpDown,
  StickyNote,
  Sparkles,
  Star,
  Tag,
  ChevronDown,
} from 'lucide-react';

type CandidateStatus = 'qualified' | 'in_process' | 'new';
type CandidateCategory = 'shortlisted' | 'rejected' | 'interview_scheduled' | 'interviewed' | 'offer_sent' | 'hired';

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
  auto_rejected: boolean;
  category: CandidateCategory;
};

// Simple seeded random function for consistent results
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Helper function to generate candidates for a job
const generateCandidatesForJob = (
  jobId: number,
  startId: number,
  jobRequirements: {
    experienceMinYears: number;
    experienceMinYearsAutoReject: boolean;
    ageRange: { min: number | null; max: number | null; autoReject: boolean };
    militaryAutoReject: boolean;
    educationLevelAutoReject: boolean;
    requiredSkills: string[];
  },
  names: string[],
  skillsets: string[],
  allSkills: string[][]
): Candidate[] => {
  const candidates: Candidate[] = [];
  let currentId = startId;
  let rank = 1;

  for (let i = 0; i < 20; i++) {
    const seed = jobId * 1000 + i;
    const name = names[i];
    if (!name) continue; // Skip if name is missing
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    const experienceYears = jobRequirements.experienceMinYears + Math.floor(seededRandom(seed) * 5) - 2;
    const minAge = jobRequirements.ageRange.min || 25;
    const maxAge = jobRequirements.ageRange.max || 40;
    const ageRange = maxAge - minAge;
    const age = minAge + Math.floor(seededRandom(seed + 1) * ageRange);
    
    // Determine if auto-rejected based on filters
    let auto_rejected = false;
    if (jobRequirements.experienceMinYearsAutoReject && experienceYears < jobRequirements.experienceMinYears) {
      auto_rejected = true;
    }
    if (jobRequirements.ageRange.autoReject) {
      if (jobRequirements.ageRange.min && age < jobRequirements.ageRange.min) auto_rejected = true;
      if (jobRequirements.ageRange.max && age > jobRequirements.ageRange.max) auto_rejected = true;
    }
    // Reject some based on military/education (simplified logic with seed)
    if (jobRequirements.militaryAutoReject && seededRandom(seed + 2) < 0.15) auto_rejected = true;
    if (jobRequirements.educationLevelAutoReject && seededRandom(seed + 3) < 0.1) auto_rejected = true;

    // Generate scores (higher for non-rejected candidates)
    const baseScore = auto_rejected ? 40 + seededRandom(seed + 4) * 30 : 60 + seededRandom(seed + 4) * 35;
    const experienceScore = auto_rejected ? 40 + seededRandom(seed + 5) * 30 : 60 + seededRandom(seed + 5) * 35;
    const educationScore = auto_rejected ? 40 + seededRandom(seed + 6) * 30 : 60 + seededRandom(seed + 6) * 35;
    
    const score = Math.round(baseScore);
    const expScore = Math.round(experienceScore);
    const eduScore = Math.round(educationScore);

    const status: CandidateStatus = auto_rejected ? 'new' : (score >= 80 ? 'qualified' : score >= 70 ? 'in_process' : 'new');
    const skills = allSkills[i] || jobRequirements.requiredSkills.slice(0, 3);
    const skillset = skillsets[i % skillsets.length];

    candidates.push({
      id: currentId++,
      jobId,
      name,
      email,
      score,
      experienceScore: expScore,
      educationScore: eduScore,
      rank: auto_rejected ? 0 : rank++,
      status,
      experienceYears: Math.max(1, experienceYears),
      skillset,
      skills,
      notes: auto_rejected ? 'Auto-rejected based on criteria.' : `Candidate ${i + 1} for job ${jobId}.`,
      aiSummary: auto_rejected 
        ? 'Does not meet minimum requirements.' 
        : `Match score: ${score}. ${score >= 80 ? 'Strong candidate' : score >= 70 ? 'Good candidate' : 'Average candidate'}.`,
      isFavorite: !auto_rejected && seededRandom(seed + 7) < 0.2,
      auto_rejected,
      category: auto_rejected ? 'rejected' : 'shortlisted',
    });
  }

  return candidates;
};

// Names pool for generating candidates
const candidateNames = [
  'Sarah Johnson', 'Michael Chen', 'Emma Williams', 'David Martinez', 'Lisa Anderson',
  'James Wilson', 'Olivia Brown', 'Daniel Garcia', 'Sophia Lee', 'Matthew Taylor',
  'Isabella Moore', 'Christopher White', 'Ava Harris', 'Andrew Clark', 'Mia Lewis',
  'Joshua Walker', 'Emily Hall', 'Ryan Young', 'Madison King', 'Nathan Wright',
  'Chloe Lopez', 'Tyler Hill', 'Grace Scott', 'Brandon Green', 'Lily Adams',
  'Justin Baker', 'Zoe Nelson', 'Kevin Carter', 'Hannah Mitchell', 'Jordan Perez',
  'Avery Roberts', 'Logan Turner', 'Samantha Phillips', 'Cameron Campbell', 'Natalie Parker',
  'Austin Evans', 'Lauren Edwards', 'Connor Collins', 'Brianna Stewart', 'Ethan Sanchez',
  'Victoria Morris', 'Noah Rogers', 'Alyssa Reed', 'Mason Cook', 'Kayla Morgan',
  'Lucas Bell', 'Alexis Murphy', 'Jack Bailey', 'Jasmine Rivera', 'Owen Cooper',
  'Maya Richardson', 'Dylan Cox', 'Sophie Howard', 'Carter Ward', 'Layla Torres',
  'Wyatt Peterson', 'Addison Gray', 'Grayson Ramirez', 'Brooklyn James', 'Levi Watson',
  'Savannah Brooks', 'Julian Kelly', 'Claire Sanders', 'Gabriel Price', 'Skylar Bennett',
  'Isaac Wood', 'Riley Barnes', 'Landon Ross', 'Peyton Henderson', 'Adrian Coleman',
  'Aubrey Jenkins', 'Colton Perry', 'Nora Powell', 'Dominic Long', 'Kylie Patterson',
  'Xavier Hughes', 'Piper Flores', 'Jaxon Washington', 'Willow Butler', 'Eli Simmons',
  'Quinn Foster', 'Aria Gonzales', 'Carson Bryant', 'Elena Alexander', 'Bentley Russell',
  'Nora Griffin', 'Maverick Diaz', 'Liliana Hayes', 'Axel Myers', 'Aurora Ford',
  'Kai Hamilton', 'Ivy Graham', 'Jasper Sullivan', 'Eliana Wallace', 'Silas Woods',
  'Nova Cole', 'Athena West', 'Phoenix Jordan', 'Luna Owens', 'River Reynolds',
  'Stella Fisher', 'Ocean Ellis', 'Aurora Harrison', 'Sage Gibson', 'Willow Mendoza',
];

export const mockCandidates: Candidate[] = [
  // Job 1: Senior Software Engineer (20 candidates)
  ...generateCandidatesForJob(
    1,
    1,
    {
      experienceMinYears: 5,
      experienceMinYearsAutoReject: true,
      ageRange: { min: 27, max: 40, autoReject: true },
      militaryAutoReject: true,
      educationLevelAutoReject: true,
      requiredSkills: ['Node.js', 'TypeScript', 'React', 'Microservices', 'CI/CD'],
    },
    candidateNames.slice(0, 20),
    ['Fullstack Development', 'Backend Engineering', 'Frontend Engineering', 'DevOps'],
    [
      ['Node.js', 'TypeScript', 'React', 'AWS'],
      ['React', 'Python', 'Docker', 'Kubernetes'],
      ['Vue', 'JavaScript', 'GraphQL', 'MongoDB'],
      ['Angular', 'TypeScript', 'PostgreSQL', 'Redis'],
      ['React', 'JavaScript', 'CSS', 'HTML'],
      ['React', 'Redux', 'Jest', 'Webpack'],
      ['Node.js', 'Express', 'MongoDB', 'Docker'],
      ['TypeScript', 'React', 'Next.js', 'Tailwind'],
      ['Python', 'Django', 'PostgreSQL', 'Celery'],
      ['Java', 'Spring Boot', 'MySQL', 'Redis'],
      ['Node.js', 'TypeScript', 'GraphQL', 'Apollo'],
      ['React', 'TypeScript', 'Material-UI', 'Redux'],
      ['Vue', 'Nuxt', 'TypeScript', 'Vuetify'],
      ['Angular', 'RxJS', 'NgRx', 'Firebase'],
      ['Node.js', 'Express', 'TypeScript', 'Prisma'],
      ['React', 'Next.js', 'TypeScript', 'tRPC'],
      ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
      ['Java', 'Spring', 'Hibernate', 'Kafka'],
      ['Node.js', 'NestJS', 'TypeORM', 'Redis'],
      ['React', 'TypeScript', 'Storybook', 'Testing Library'],
    ]
  ),
  // Job 2: Product Manager (20 candidates)
  ...generateCandidatesForJob(
    2,
    21,
    {
      experienceMinYears: 3,
      experienceMinYearsAutoReject: false,
      ageRange: { min: 25, max: 38, autoReject: false },
      militaryAutoReject: false,
      educationLevelAutoReject: false,
      requiredSkills: ['Roadmapping', 'Analytics', 'Stakeholder Management', 'Agile'],
    },
    candidateNames.slice(20, 40),
    ['Product Management', 'Business Analysis', 'Strategy', 'Project Management'],
    [
      ['Roadmapping', 'Analytics', 'Stakeholder Management', 'Agile'],
      ['Product Strategy', 'Data Analysis', 'User Research', 'Jira'],
      ['Roadmapping', 'A/B Testing', 'User Stories', 'Scrum'],
      ['Product Vision', 'Metrics', 'Cross-functional', 'Kanban'],
      ['Roadmapping', 'Analytics', 'Prioritization', 'Agile'],
      ['Product Strategy', 'Market Research', 'Stakeholder Management', 'Scrum'],
      ['Roadmapping', 'Analytics', 'User Research', 'Agile'],
      ['Product Management', 'Data Analysis', 'Stakeholder Management', 'Jira'],
      ['Roadmapping', 'Metrics', 'User Stories', 'Scrum'],
      ['Product Strategy', 'Analytics', 'Prioritization', 'Agile'],
      ['Roadmapping', 'A/B Testing', 'Stakeholder Management', 'Kanban'],
      ['Product Vision', 'Data Analysis', 'User Research', 'Scrum'],
      ['Roadmapping', 'Analytics', 'Cross-functional', 'Agile'],
      ['Product Strategy', 'Metrics', 'Stakeholder Management', 'Jira'],
      ['Roadmapping', 'User Research', 'Prioritization', 'Scrum'],
      ['Product Management', 'Analytics', 'A/B Testing', 'Agile'],
      ['Roadmapping', 'Data Analysis', 'User Stories', 'Kanban'],
      ['Product Vision', 'Analytics', 'Stakeholder Management', 'Scrum'],
      ['Roadmapping', 'Metrics', 'User Research', 'Agile'],
      ['Product Strategy', 'Analytics', 'Prioritization', 'Jira'],
    ]
  ),
  // Job 3: UX Designer (20 candidates)
  ...generateCandidatesForJob(
    3,
    41,
    {
      experienceMinYears: 3,
      experienceMinYearsAutoReject: false,
      ageRange: { min: 24, max: 35, autoReject: false },
      militaryAutoReject: false,
      educationLevelAutoReject: false,
      requiredSkills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
    },
    candidateNames.slice(40, 60),
    ['UX Design', 'UI Design', 'Product Design', 'Interaction Design'],
    [
      ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
      ['Sketch', 'User Testing', 'Wireframing', 'Design Thinking'],
      ['Figma', 'User Research', 'Prototyping', 'Material Design'],
      ['Adobe XD', 'User Interviews', 'Prototyping', 'Design Systems'],
      ['Figma', 'User Research', 'Framer', 'Atomic Design'],
      ['Sketch', 'User Testing', 'Prototyping', 'Design Systems'],
      ['Figma', 'User Research', 'InVision', 'Design Tokens'],
      ['Adobe XD', 'User Interviews', 'Prototyping', 'Design Systems'],
      ['Figma', 'User Research', 'Principle', 'Material Design'],
      ['Sketch', 'User Testing', 'Prototyping', 'Design Thinking'],
      ['Figma', 'User Research', 'Framer', 'Design Systems'],
      ['Adobe XD', 'User Interviews', 'Prototyping', 'Atomic Design'],
      ['Figma', 'User Research', 'InVision', 'Design Systems'],
      ['Sketch', 'User Testing', 'Prototyping', 'Design Tokens'],
      ['Figma', 'User Research', 'Principle', 'Design Systems'],
      ['Adobe XD', 'User Interviews', 'Prototyping', 'Material Design'],
      ['Figma', 'User Research', 'Framer', 'Design Thinking'],
      ['Sketch', 'User Testing', 'Prototyping', 'Design Systems'],
      ['Figma', 'User Research', 'InVision', 'Atomic Design'],
      ['Adobe XD', 'User Interviews', 'Prototyping', 'Design Systems'],
    ]
  ),
  // Job 4: Data Scientist (20 candidates)
  ...generateCandidatesForJob(
    4,
    61,
    {
      experienceMinYears: 5,
      experienceMinYearsAutoReject: true,
      ageRange: { min: 28, max: 45, autoReject: true },
      militaryAutoReject: false,
      educationLevelAutoReject: true,
      requiredSkills: ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Data Pipelines'],
    },
    candidateNames.slice(60, 80),
    ['Data Science', 'Machine Learning', 'Analytics', 'Data Engineering'],
    [
      ['Python', 'SQL', 'Machine Learning', 'Statistics'],
      ['Python', 'R', 'Deep Learning', 'Data Pipelines'],
      ['Python', 'SQL', 'TensorFlow', 'Statistics'],
      ['Python', 'Pandas', 'Scikit-learn', 'Data Pipelines'],
      ['Python', 'SQL', 'PyTorch', 'Statistics'],
      ['Python', 'R', 'Machine Learning', 'Data Pipelines'],
      ['Python', 'SQL', 'XGBoost', 'Statistics'],
      ['Python', 'Pandas', 'Deep Learning', 'Data Pipelines'],
      ['Python', 'SQL', 'Keras', 'Statistics'],
      ['Python', 'R', 'Scikit-learn', 'Data Pipelines'],
      ['Python', 'SQL', 'Machine Learning', 'Statistics'],
      ['Python', 'Pandas', 'TensorFlow', 'Data Pipelines'],
      ['Python', 'SQL', 'PyTorch', 'Statistics'],
      ['Python', 'R', 'Deep Learning', 'Data Pipelines'],
      ['Python', 'SQL', 'XGBoost', 'Statistics'],
      ['Python', 'Pandas', 'Machine Learning', 'Data Pipelines'],
      ['Python', 'SQL', 'Keras', 'Statistics'],
      ['Python', 'R', 'Scikit-learn', 'Data Pipelines'],
      ['Python', 'SQL', 'TensorFlow', 'Statistics'],
      ['Python', 'Pandas', 'PyTorch', 'Data Pipelines'],
    ]
  ),
  // Job 5: DevOps Engineer (20 candidates)
  ...generateCandidatesForJob(
    5,
    81,
    {
      experienceMinYears: 3,
      experienceMinYearsAutoReject: true,
      ageRange: { min: 26, max: 38, autoReject: true },
      militaryAutoReject: true,
      educationLevelAutoReject: true,
      requiredSkills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform'],
    },
    candidateNames.slice(80, 100),
    ['DevOps', 'Cloud Infrastructure', 'Site Reliability', 'Platform Engineering'],
    [
      ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
      ['AWS', 'Docker', 'Terraform', 'Jenkins'],
      ['AWS', 'Kubernetes', 'CI/CD', 'Ansible'],
      ['AWS', 'Docker', 'Terraform', 'GitLab CI'],
      ['AWS', 'Kubernetes', 'CI/CD', 'Helm'],
      ['AWS', 'Docker', 'Terraform', 'Jenkins'],
      ['AWS', 'Kubernetes', 'CI/CD', 'Ansible'],
      ['AWS', 'Docker', 'Terraform', 'GitLab CI'],
      ['AWS', 'Kubernetes', 'CI/CD', 'Helm'],
      ['AWS', 'Docker', 'Terraform', 'Jenkins'],
      ['AWS', 'Kubernetes', 'CI/CD', 'Ansible'],
      ['AWS', 'Docker', 'Terraform', 'GitLab CI'],
      ['AWS', 'Kubernetes', 'CI/CD', 'Helm'],
      ['AWS', 'Docker', 'Terraform', 'Jenkins'],
      ['AWS', 'Kubernetes', 'CI/CD', 'Ansible'],
      ['AWS', 'Docker', 'Terraform', 'GitLab CI'],
      ['AWS', 'Kubernetes', 'CI/CD', 'Helm'],
      ['AWS', 'Docker', 'Terraform', 'Jenkins'],
      ['AWS', 'Kubernetes', 'CI/CD', 'Ansible'],
      ['AWS', 'Docker', 'Terraform', 'GitLab CI'],
    ]
  ),
  // Job 6: Frontend Developer (20 candidates)
  ...generateCandidatesForJob(
    6,
    101,
    {
      experienceMinYears: 2,
      experienceMinYearsAutoReject: false,
      ageRange: { min: 22, max: 32, autoReject: false },
      militaryAutoReject: false,
      educationLevelAutoReject: false,
      requiredSkills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'Redux'],
    },
    candidateNames.slice(100, 120),
    ['Frontend Development', 'UI Development', 'Web Development', 'Frontend Engineering'],
    [
      ['React', 'JavaScript', 'TypeScript', 'CSS'],
      ['React', 'Redux', 'JavaScript', 'HTML'],
      ['React', 'TypeScript', 'Next.js', 'Tailwind'],
      ['Vue', 'JavaScript', 'TypeScript', 'CSS'],
      ['React', 'Redux', 'JavaScript', 'Material-UI'],
      ['React', 'TypeScript', 'Gatsby', 'CSS'],
      ['Angular', 'TypeScript', 'RxJS', 'SCSS'],
      ['React', 'JavaScript', 'Redux', 'Styled Components'],
      ['React', 'TypeScript', 'Vite', 'CSS'],
      ['Vue', 'Nuxt', 'TypeScript', 'Tailwind'],
      ['React', 'JavaScript', 'Context API', 'CSS'],
      ['React', 'TypeScript', 'Remix', 'CSS'],
      ['Angular', 'TypeScript', 'NgRx', 'SCSS'],
      ['React', 'JavaScript', 'Zustand', 'CSS'],
      ['React', 'TypeScript', 'Next.js', 'Tailwind'],
      ['Vue', 'JavaScript', 'Vuex', 'CSS'],
      ['React', 'Redux', 'TypeScript', 'Material-UI'],
      ['React', 'TypeScript', 'Gatsby', 'CSS'],
      ['Angular', 'TypeScript', 'RxJS', 'SCSS'],
      ['React', 'JavaScript', 'Recoil', 'CSS'],
    ]
  ),
  // Job 7: Backend Developer (20 candidates)
  ...generateCandidatesForJob(
    7,
    121,
    {
      experienceMinYears: 3,
      experienceMinYearsAutoReject: true,
      ageRange: { min: 25, max: 36, autoReject: true },
      militaryAutoReject: true,
      educationLevelAutoReject: true,
      requiredSkills: ['Node.js', 'Python', 'PostgreSQL', 'REST APIs', 'Microservices'],
    },
    candidateNames.slice(120, 140),
    ['Backend Development', 'API Development', 'Server-side Development', 'Backend Engineering'],
    [
      ['Node.js', 'PostgreSQL', 'REST APIs', 'Express'],
      ['Python', 'Django', 'PostgreSQL', 'REST APIs'],
      ['Node.js', 'MongoDB', 'GraphQL', 'Microservices'],
      ['Python', 'FastAPI', 'PostgreSQL', 'REST APIs'],
      ['Java', 'Spring Boot', 'MySQL', 'REST APIs'],
      ['Node.js', 'TypeScript', 'PostgreSQL', 'Microservices'],
      ['Python', 'Flask', 'PostgreSQL', 'REST APIs'],
      ['Node.js', 'NestJS', 'MongoDB', 'GraphQL'],
      ['Python', 'Django', 'PostgreSQL', 'Microservices'],
      ['Java', 'Spring', 'PostgreSQL', 'REST APIs'],
      ['Node.js', 'Express', 'PostgreSQL', 'REST APIs'],
      ['Python', 'FastAPI', 'MongoDB', 'GraphQL'],
      ['Node.js', 'TypeScript', 'PostgreSQL', 'Microservices'],
      ['Python', 'Django', 'MySQL', 'REST APIs'],
      ['Java', 'Spring Boot', 'PostgreSQL', 'Microservices'],
      ['Node.js', 'NestJS', 'PostgreSQL', 'REST APIs'],
      ['Python', 'Flask', 'MongoDB', 'GraphQL'],
      ['Node.js', 'Express', 'PostgreSQL', 'Microservices'],
      ['Python', 'FastAPI', 'PostgreSQL', 'REST APIs'],
      ['Java', 'Spring', 'MySQL', 'REST APIs'],
    ]
  ),
  // Job 8: Marketing Manager (20 candidates)
  ...generateCandidatesForJob(
    8,
    141,
    {
      experienceMinYears: 5,
      experienceMinYearsAutoReject: false,
      ageRange: { min: 28, max: 42, autoReject: false },
      militaryAutoReject: false,
      educationLevelAutoReject: false,
      requiredSkills: ['Digital Marketing', 'SEO', 'Content Marketing', 'Analytics', 'Campaign Management'],
    },
    candidateNames.slice(140, 160),
    ['Marketing', 'Digital Marketing', 'Brand Management', 'Growth Marketing'],
    [
      ['Digital Marketing', 'SEO', 'Content Marketing', 'Analytics'],
      ['Digital Marketing', 'SEM', 'Social Media', 'Campaign Management'],
      ['SEO', 'Content Marketing', 'Analytics', 'Google Ads'],
      ['Digital Marketing', 'Email Marketing', 'Analytics', 'Campaign Management'],
      ['SEO', 'Content Marketing', 'Social Media', 'Analytics'],
      ['Digital Marketing', 'PPC', 'Content Marketing', 'Campaign Management'],
      ['SEO', 'Social Media', 'Analytics', 'Google Analytics'],
      ['Digital Marketing', 'Content Marketing', 'Email Marketing', 'Analytics'],
      ['SEO', 'SEM', 'Content Marketing', 'Campaign Management'],
      ['Digital Marketing', 'Social Media', 'Analytics', 'Facebook Ads'],
      ['SEO', 'Content Marketing', 'Analytics', 'Campaign Management'],
      ['Digital Marketing', 'Email Marketing', 'SEO', 'Analytics'],
      ['Content Marketing', 'Social Media', 'Analytics', 'Campaign Management'],
      ['Digital Marketing', 'SEO', 'PPC', 'Analytics'],
      ['SEO', 'Content Marketing', 'Social Media', 'Campaign Management'],
      ['Digital Marketing', 'Email Marketing', 'Analytics', 'Google Ads'],
      ['SEO', 'Content Marketing', 'Analytics', 'Campaign Management'],
      ['Digital Marketing', 'Social Media', 'SEO', 'Analytics'],
      ['Content Marketing', 'Email Marketing', 'Analytics', 'Campaign Management'],
      ['Digital Marketing', 'SEO', 'Content Marketing', 'Analytics'],
    ]
  ),
  // Job 9: Sales Representative (20 candidates)
  ...generateCandidatesForJob(
    9,
    161,
    {
      experienceMinYears: 1,
      experienceMinYearsAutoReject: false,
      ageRange: { min: 23, max: 35, autoReject: false },
      militaryAutoReject: false,
      educationLevelAutoReject: false,
      requiredSkills: ['Sales', 'Customer Relations', 'Negotiation', 'CRM', 'Communication'],
    },
    candidateNames.slice(160, 180),
    ['Sales', 'Business Development', 'Account Management', 'Customer Success'],
    [
      ['Sales', 'Customer Relations', 'Negotiation', 'CRM'],
      ['Sales', 'Communication', 'CRM', 'Lead Generation'],
      ['Sales', 'Customer Relations', 'Negotiation', 'Salesforce'],
      ['Sales', 'Communication', 'CRM', 'Account Management'],
      ['Sales', 'Customer Relations', 'Negotiation', 'HubSpot'],
      ['Sales', 'Communication', 'CRM', 'Cold Calling'],
      ['Sales', 'Customer Relations', 'Negotiation', 'CRM'],
      ['Sales', 'Communication', 'CRM', 'Relationship Building'],
      ['Sales', 'Customer Relations', 'Negotiation', 'Salesforce'],
      ['Sales', 'Communication', 'CRM', 'Lead Qualification'],
      ['Sales', 'Customer Relations', 'Negotiation', 'HubSpot'],
      ['Sales', 'Communication', 'CRM', 'Account Management'],
      ['Sales', 'Customer Relations', 'Negotiation', 'CRM'],
      ['Sales', 'Communication', 'CRM', 'Cold Calling'],
      ['Sales', 'Customer Relations', 'Negotiation', 'Salesforce'],
      ['Sales', 'Communication', 'CRM', 'Relationship Building'],
      ['Sales', 'Customer Relations', 'Negotiation', 'HubSpot'],
      ['Sales', 'Communication', 'CRM', 'Lead Generation'],
      ['Sales', 'Customer Relations', 'Negotiation', 'CRM'],
      ['Sales', 'Communication', 'CRM', 'Account Management'],
    ]
  ),
  // Job 10: QA Engineer (20 candidates)
  ...generateCandidatesForJob(
    10,
    181,
    {
      experienceMinYears: 3,
      experienceMinYearsAutoReject: false,
      ageRange: { min: 24, max: 34, autoReject: false },
      militaryAutoReject: false,
      educationLevelAutoReject: false,
      requiredSkills: ['Testing', 'Selenium', 'Jest', 'Test Automation', 'Bug Tracking'],
    },
    candidateNames.slice(180, 200),
    ['QA Engineering', 'Test Automation', 'Quality Assurance', 'Software Testing'],
    [
      ['Testing', 'Selenium', 'Jest', 'Test Automation'],
      ['Testing', 'Cypress', 'Jest', 'Bug Tracking'],
      ['Selenium', 'Test Automation', 'JUnit', 'Bug Tracking'],
      ['Testing', 'Playwright', 'Jest', 'Test Automation'],
      ['Selenium', 'Test Automation', 'Pytest', 'Bug Tracking'],
      ['Testing', 'Cypress', 'Test Automation', 'Jest'],
      ['Selenium', 'Test Automation', 'Mocha', 'Bug Tracking'],
      ['Testing', 'Playwright', 'Test Automation', 'Jest'],
      ['Selenium', 'Test Automation', 'JUnit', 'Bug Tracking'],
      ['Testing', 'Cypress', 'Jest', 'Test Automation'],
      ['Selenium', 'Test Automation', 'Pytest', 'Bug Tracking'],
      ['Testing', 'Playwright', 'Jest', 'Test Automation'],
      ['Selenium', 'Test Automation', 'Mocha', 'Bug Tracking'],
      ['Testing', 'Cypress', 'Test Automation', 'Jest'],
      ['Selenium', 'Test Automation', 'JUnit', 'Bug Tracking'],
      ['Testing', 'Playwright', 'Test Automation', 'Jest'],
      ['Selenium', 'Test Automation', 'Pytest', 'Bug Tracking'],
      ['Testing', 'Cypress', 'Jest', 'Test Automation'],
      ['Selenium', 'Test Automation', 'Mocha', 'Bug Tracking'],
      ['Testing', 'Playwright', 'Jest', 'Test Automation'],
    ]
  ),
];

// Generate job options from mockJobs
const jobOptions = mockJobs.map(job => ({
  id: job.id,
  title: job.title,
}));

type SortKey = 'name' | 'score' | 'experienceYears' | 'skills';
type SortKeyExtended = SortKey | 'experienceScore' | 'educationScore' | 'index' | 'category';
type ActiveBucket = 'all' | 'shortlisted' | 'favorite' | 'interview_scheduled' | 'interviewed' | 'offer_sent' | 'hired';

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

export const Review = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get jobId from query parameter, or default to first job
  const jobIdFromQuery = searchParams.get('jobId');
  const initialJobId = jobIdFromQuery ? Number(jobIdFromQuery) : (jobOptions[0]?.id ?? 1);
  const [selectedJob, setSelectedJob] = useState(initialJobId);
  
  const [sortKey, setSortKey] = useState<SortKeyExtended>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [openNotesId, setOpenNotesId] = useState<number | null>(null);
  const [openAiId, setOpenAiId] = useState<number | null>(null);
  const [openCategoryId, setOpenCategoryId] = useState<number | null>(null);
  const { favorites, categories, setFavorite, setCategory, initializeFromCandidates } = useCandidatesStore();
  const [activeBucket, setActiveBucket] = useState<ActiveBucket>('all');

  // Initialize store from candidates
  useEffect(() => {
    // Only initialize for candidates of the selected job to avoid unnecessary updates
    if (!selectedJob || !mockCandidates || mockCandidates.length === 0) {
      return;
    }
    const jobCandidates = mockCandidates.filter(c => c.jobId === selectedJob);
    if (jobCandidates.length > 0) {
      initializeFromCandidates(jobCandidates.map(c => {
        // If not auto_rejected, automatically set to shortlisted
        const initialCategory = c.auto_rejected ? 'rejected' : (c.category || 'shortlisted');
        return { id: c.id, isFavorite: c.isFavorite, category: initialCategory };
      }));
    }
  }, [initializeFromCandidates, selectedJob]);

  // Update selectedJob when query parameter changes
  useEffect(() => {
    if (jobIdFromQuery) {
      const jobId = Number(jobIdFromQuery);
      if (!isNaN(jobId) && jobOptions.some(job => job.id === jobId)) {
        setSelectedJob(jobId);
      }
    }
  }, [jobIdFromQuery]);

  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenNotesId(null);
      setOpenAiId(null);
      setOpenCategoryId(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const job = jobOptions.find((option) => option.id === selectedJob);
  const jobCandidates = useMemo(
    () => {
      if (!selectedJob) {
        return [];
      }
      const filtered = mockCandidates.filter((candidate) => candidate.jobId === selectedJob);
      return filtered;
    },
    [selectedJob, mockCandidates]
  );

  const totalResumes = jobCandidates.length;

  const shortListedCount = useMemo(
    () => {
      return jobCandidates.filter((candidate) => {
        const cat = categories[candidate.id] || (candidate.auto_rejected ? 'rejected' : 'shortlisted');
        return cat === 'shortlisted';
      }).length;
    },
    [jobCandidates, categories]
  );

  const rejectedCount = useMemo(
    () => {
      return jobCandidates.filter((candidate) => {
        const cat = categories[candidate.id] || (candidate.auto_rejected ? 'rejected' : 'shortlisted');
        return cat === 'rejected';
      }).length;
    },
    [jobCandidates, categories]
  );

  const favoriteCount = useMemo(
    () => jobCandidates.filter((candidate) => favorites[candidate.id]).length,
    [jobCandidates, favorites]
  );

  const interviewScheduledCount = useMemo(
    () => jobCandidates.filter((candidate) => categories[candidate.id] === 'interview_scheduled').length,
    [jobCandidates, categories]
  );

  const interviewedCount = useMemo(
    () => jobCandidates.filter((candidate) => categories[candidate.id] === 'interviewed').length,
    [jobCandidates, categories]
  );

  const offerSentCount = useMemo(
    () => jobCandidates.filter((candidate) => categories[candidate.id] === 'offer_sent').length,
    [jobCandidates, categories]
  );

  const hiredCount = useMemo(
    () => jobCandidates.filter((candidate) => categories[candidate.id] === 'hired').length,
    [jobCandidates, categories]
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
        return searchedCandidates.filter((candidate) => {
          const cat = categories[candidate.id] || (candidate.auto_rejected ? 'rejected' : 'shortlisted');
          return cat === 'shortlisted';
        });
      case 'favorite':
        return searchedCandidates.filter((candidate) => favorites[candidate.id]);
      case 'interview_scheduled':
        return searchedCandidates.filter((candidate) => {
          const cat = categories[candidate.id] || (candidate.auto_rejected ? 'rejected' : 'shortlisted');
          return cat === 'interview_scheduled';
        });
      case 'interviewed':
        return searchedCandidates.filter((candidate) => {
          const cat = categories[candidate.id] || (candidate.auto_rejected ? 'rejected' : 'shortlisted');
          return cat === 'interviewed';
        });
      case 'offer_sent':
        return searchedCandidates.filter((candidate) => {
          const cat = categories[candidate.id] || (candidate.auto_rejected ? 'rejected' : 'shortlisted');
          return cat === 'offer_sent';
        });
      case 'hired':
        return searchedCandidates.filter((candidate) => {
          const cat = categories[candidate.id] || (candidate.auto_rejected ? 'rejected' : 'shortlisted');
          return cat === 'hired';
        });
      default:
        return searchedCandidates;
    }
  }, [searchedCandidates, activeBucket, favorites, categories]);

  const sortedCandidates = useMemo(() => {
    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...bucketFilteredCandidates].sort((a, b) => {
      if (sortKey === 'name') {
        return a.name.localeCompare(b.name) * dir;
      }
      if (sortKey === 'skills') {
        return (a.skills.length - b.skills.length) * dir;
      }
      if (sortKey === 'category') {
        const categoryA = categories[a.id] || (a.auto_rejected ? 'rejected' : 'shortlisted');
        const categoryB = categories[b.id] || (b.auto_rejected ? 'rejected' : 'shortlisted');
        const categoryOrder: Record<CandidateCategory, number> = {
          'shortlisted': 1,
          'interview_scheduled': 2,
          'interviewed': 3,
          'offer_sent': 4,
          'hired': 5,
          'rejected': 6,
        };
        return (categoryOrder[categoryA] - categoryOrder[categoryB]) * dir;
      }
      return ((a as any)[sortKey] - (b as any)[sortKey]) * dir;
    });
  }, [bucketFilteredCandidates, sortKey, sortDirection, categories]);

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review Candidates Dashboard</h1>
        <p className="mt-1 text-gray-600">
          Monitor candidate progress, compare scores, and take quick actions for each applicant.
        </p>
      </div>
      {/* Header */}
      <div className="card border border-gray-200 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Job Position
            </label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(Number(e.target.value))}
              className="input-field h-12 w-full md:w-96 text-base font-medium text-gray-800"
            >
              {jobOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3"></div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4 lg:grid-cols-7">
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
          <div
            onClick={() => setActiveBucket('interview_scheduled')}
            className={`cursor-pointer rounded-2xl border border-purple-200 bg-purple-50 p-4 transition ${
              activeBucket === 'interview_scheduled' ? 'ring-2 ring-purple-300' : ''
            }`}
          >
            <p className="text-xs font-medium uppercase text-gray-500">Interview Scheduled</p>
            <p className="mt-2 text-2xl font-semibold text-purple-700">{interviewScheduledCount}</p>
          </div>
          <div
            onClick={() => setActiveBucket('interviewed')}
            className={`cursor-pointer rounded-2xl border border-indigo-200 bg-indigo-50 p-4 transition ${
              activeBucket === 'interviewed' ? 'ring-2 ring-indigo-300' : ''
            }`}
          >
            <p className="text-xs font-medium uppercase text-gray-500">Interviewed</p>
            <p className="mt-2 text-2xl font-semibold text-indigo-700">{interviewedCount}</p>
          </div>
          <div
            onClick={() => setActiveBucket('offer_sent')}
            className={`cursor-pointer rounded-2xl border border-orange-200 bg-orange-50 p-4 transition ${
              activeBucket === 'offer_sent' ? 'ring-2 ring-orange-300' : ''
            }`}
          >
            <p className="text-xs font-medium uppercase text-gray-500">Offer Sent</p>
            <p className="mt-2 text-2xl font-semibold text-orange-700">{offerSentCount}</p>
          </div>
          <div
            onClick={() => setActiveBucket('hired')}
            className={`cursor-pointer rounded-2xl border border-emerald-200 bg-emerald-50 p-4 transition ${
              activeBucket === 'hired' ? 'ring-2 ring-emerald-300' : ''
            }`}
          >
            <p className="text-xs font-medium uppercase text-gray-500">Hired</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">{hiredCount}</p>
          </div>
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
                <th className="px-3 py-4 text-center">
                  <SortableHeader label="State" columnKey="category" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {sortedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
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
                            setFavorite(candidate.id, !favorites[candidate.id]);
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
                    <td className="px-3 py-4 text-center">
                      <div className="relative flex justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Don't allow changing category for rejected candidates
                            if (categories[candidate.id] === 'rejected') return;
                            setOpenCategoryId((prev) => {
                              const next = prev === candidate.id ? null : candidate.id;
                              if (next !== null) {
                                setOpenNotesId(null);
                                setOpenAiId(null);
                              }
                              return next;
                            });
                          }}
                          disabled={categories[candidate.id] === 'rejected'}
                          className={`inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-xs font-medium transition ${
                            categories[candidate.id] === 'rejected'
                              ? 'cursor-not-allowed opacity-75'
                              : ''
                          } ${
                            categories[candidate.id] === 'shortlisted'
                              ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                              : categories[candidate.id] === 'rejected'
                              ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                              : categories[candidate.id] === 'interview_scheduled'
                              ? 'border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100'
                              : categories[candidate.id] === 'interviewed'
                              ? 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                              : categories[candidate.id] === 'offer_sent'
                              ? 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100'
                              : categories[candidate.id] === 'hired'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Tag className="h-3.5 w-3.5" />
                          <span className="capitalize">
                            {categories[candidate.id] === 'shortlisted'
                              ? 'Short Listed'
                              : categories[candidate.id] === 'rejected'
                              ? 'Rejected'
                              : categories[candidate.id] === 'interview_scheduled'
                              ? 'Interview Scheduled'
                              : categories[candidate.id] === 'interviewed'
                              ? 'Interviewed'
                              : categories[candidate.id] === 'offer_sent'
                              ? 'Offer Sent'
                              : categories[candidate.id] === 'hired'
                              ? 'Hired'
                              : 'Short Listed'}
                          </span>
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        {openCategoryId === candidate.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 bottom-full z-20 mb-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg"
                          >
                            <div className="py-1">
                              {(['shortlisted', 'interview_scheduled', 'interviewed', 'offer_sent', 'hired'] as CandidateCategory[]).map((category) => (
                                <button
                                  key={category}
                                  onClick={() => {
                                    setCategory(candidate.id, category);
                                    setOpenCategoryId(null);
                                  }}
                                  className={`w-full px-4 py-2 text-left text-xs transition hover:bg-gray-50 ${
                                    categories[candidate.id] === category
                                      ? 'bg-gray-50 font-medium text-gray-900'
                                      : 'text-gray-700'
                                  }`}
                                >
                                  <span className={`capitalize ${
                                    category === 'shortlisted'
                                      ? 'text-green-700'
                                      : category === 'interview_scheduled'
                                      ? 'text-purple-700'
                                      : category === 'interviewed'
                                      ? 'text-indigo-700'
                                      : category === 'offer_sent'
                                      ? 'text-orange-700'
                                      : category === 'hired'
                                      ? 'text-emerald-700'
                                      : ''
                                  }`}>
                                    {category === 'shortlisted'
                                      ? 'Short Listed'
                                      : category === 'interview_scheduled'
                                      ? 'Interview Scheduled'
                                      : category === 'interviewed'
                                      ? 'Interviewed'
                                      : category === 'offer_sent'
                                      ? 'Offer Sent'
                                      : category === 'hired'
                                      ? 'Hired'
                                      : ''}
                                  </span>
                                </button>
                              ))}
                            </div>
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

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-3">
        <button className="btn-outline flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Ranking
        </button>
        <button className="btn-primary flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>
    </div>
  );
};

