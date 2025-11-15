import { type ChangeEvent, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
// @ts-ignore
import { availableSkills } from '../../availableSkills';
import { useJob, useCreateJob, useUpdateJob, useDepartments, type Job } from '../api/jobs';

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

const universityMajors = [
  'مهندسی کامپیوتر',
  'مهندسی مکانیک',
  'مهندسی برق',
  'علوم کامپیوتر',
  'مهندسی صنایع',
  'مهندسی معماری',
  'مهندسی هوا فضا',
  'فیزیک',
  'آموزش ریاضی',
  'مهندسی عمران',
  'مهندسی شیمی',
  'ریاضیات و کاربردها',
  'اقتصاد',
  'شیمی محض',
  'روانشناسی',
  'علوم مهندسی',
  'مهندسی پزشکی',
  'مهندسی مواد و متالورژی',
  'مهندسی انرژی',
  'مهندسی ساخت وتولید',
  'مهندسی نفت',
  'مهندسی پلیمر',
  'کارشناسی ارشد پیوسته علوم قضایی',
  'فیزیک مهندسی',
  'آموزش فیزیک',
  'آموزش تربیت بدنی',
  'طراحی صنعتی',
  'مهندسی نقشه برداری',
  'آموزش ابتدایی',
  'شیمی کاربردی',
  'مهندسی دریا',
  'مهندسی هوانوردی ومراقبت پرواز',
  'مهندسی تعمیرونگهداری هواپیما',
  'دکترای پیوسته بیوتکنولوژی',
  'زبان چینی',
  'مدیریت بازرگانی',
  'دکترای پیوسته فیزیک',
  'آموزش زبان انگلیسی',
  'مهندسی معدن',
  'حسابداری',
  'معماری داخلی',
  'مهندسی شهرسازی',
  'مدیریت بیمه اکو',
  'مهندسی الکترونیک هواپیمایی',
  'مهندسی خط و سازه های ریلی',
  'زبان و ادبیات ترکی استامبولی',
  'زبان و ادبیات فرانسه',
  'مدیریت صنعتی',
  'مهندسی نساجی',
  'علوم و مهندسی آب',
  'مدیریت مالی',
  'مهندسی ماشینهای صنایع غذایی',
  'ایمنی صنعتی',
  'مدیریت دولتی',
  'مهندسی حمل و نقل ریلی',
  'مهندسی ماشینهای ریلی',
  'جهانگردی',
  'کاردان فنی برق',
  'صنایع دستی',
  'آمار',
  'زبان و ادبیات انگلیسی',
  'فقه و حقوق اسلامی',
  'مهندسی مکانیک بیوسیستم (کشاورزی)',
  'مترجمی زبان فرانسه',
  'علوم قضایی',
  'مهندسی خودرو',
  'علوم اقتصادی',
  'آمار و کاربردها',
  'مهندسی علمی کاربردی عمران',
  'مدیریت بیمه',
  'هوانوردی',
  'مهندسی ایمنی',
  'شیمی',
  'مهندسی مواد',
  'دبیری ریاضی',
  'علوم تربیتی',
  'دبیری فیزیک',
  'مهندسی کشتی',
  'کارشناسی ارشد علوم قضایی',
  'تربیت دبیر زبان انگلیسی',
  'مهندسی فناوری اطلاعات',
  'مهندسی هوافضا',
  'دکترای پیوسته بیوتکنولوژی',
  'مهندسی ماشین های ریلی',
  'کاردانی تعمیرونگهداری هواپیما',
  'حقوق',
  'زبان و ادبیات فارسی',
  'آموزش علوم اجتماعی',
  'علوم سیاسی',
  'آموزش الهیات',
  'آموزش زبان عربی',
  'علوم ارتباطات اجتماعی',
  'آموزش زبان و ادبیات فارسی',
  'راهنمایی و مشاوره',
  'جامعه شناسی',
  'مشاوره',
  'روزنامه نگاری',
  'کارشناسی ارشد پیوسته معارف اسلامی و حقوق',
  'زبان وادبیات آلمانی',
  'مدیریت آموزشی',
  'امور تربیتی',
  'جغرافیا',
  'فقه و مبانی حقوق اسلامی',
  'آموزش جغرافیا',
  'هتلداری',
  'مردم شناسی',
  'آموزش دانش آموزان با نیازهای ویژه',
  'فلسفه',
  'فلسفه و کلام اسلامی',
  'آموزش تاریخ',
  'فلسفه و حکمت اسلامی',
  'مطالعات ارتباطی',
  'آموزش راهنمایی ومشاوره',
  'سینما',
  'باستانشناسی',
  'آموزش کودکان استثنایی',
  'مددکاری اجتماعی',
  'علوم ورزشی',
  'مدیریت امور بانکی',
  'علوم قرآن و حدیث',
  'مطالعات ارتباطی و فناوری اطلاعات',
  'مطالعات خانواده',
  'برنامه ریزی اجتماعی و تعاون',
  'مدیریت امور گمرکی',
  'مترجمی زبان انگلیسی',
  'زبان و ادبیات عربی',
  'پژوهشگری اجتماعی',
  'فقه و حقوق شافعی',
  'مترجمی زبان آلمانی',
  'روابط عمومی',
  'مترجمی زبان عربی',
  'تاریخ',
  'تاریخ و تمدن ملل اسلامی',
  'علم اطلاعات و دانش شناسی',
  'کاردانی حسابداری',
  'دبیری زبان و ادبیات عربی',
  'دبیری الهیات و معارف اسلامی',
  'دبیری علوم اجتماعی',
  'مدیریت جهانگردی',
  'دبیری تاریخ',
  'دبیری زبان وادبیات فارسی',
  'ادیان و عرفان',
  'زبان شناسی',
  'علوم اجتماعی',
  'الهیات و معارف اسلامی',
  'سنجش از دور و سیستم اطلاعات جغرافیایی',
  'علوم قرآنی',
  'جغرافیا و برنامه ریزی شهری',
  'مدیریت گمرکی',
  'مدیریت کسب و کارهای کوچک',
  'رشد و پرورش کودکان پیش دبستانی',
  'مدیریت هتلداری',
  'دبیری زبان وادبیات عربی',
  'دبیری زبان وادبیات فارسی',
  'زبان وادبیات فارسی',
  'راهنمایی ومشاوره',
  'الهیات ومعارف اسلامی',
  'دبیری الهیات ومعارف اسلامی',
  'کارشناسی ارشدمعارف اسلامی وحقوق',
  'سنجش ازدور وسیستم اطلاعات جغرافیایی',
  'زبان وادبیات عربی',
  'روانشناسی واموزش کودکان استثنایی',
  'مدیریت اموربانکی',
  'مدیریت کسب وکارهای کوچک',
  'فقه وحقوق اسلامی',
  'جغرافیابرنامه ریزی شهری',
  'جغرافیای سیاسی (امایش ومدیریت سیاسی فضا)',
  'دبیری زبان و ادبیات عرب',
  'کارشناسی ارشد معارف اسلامی و حقوق',
  'پزشکی',
  'دندانپزشکی',
  'داروسازی',
  'زیست فناوری',
  'دکترای عمومی دامپزشکی',
  'زبان و ادبیات ژاپنی',
  'فیزیوتراپی',
  'مامایی',
  'پرستاری',
  'بینایی سنجی',
  'تکنولوژی پرتوشناسی',
  'گفتاردرمانی',
  'زبان اسپانیایی',
  'نوازندگی موسیقی جهانی',
  'علوم تغذیه',
  'زیست شناسی سلولی مولکولی',
  'هوشبری',
  'شنوایی شناسی',
  'زیست شناسی جانوری',
  'ارتباط تصویری',
  'زبان روسی',
  'بهداشت عمومی',
  'علوم و مهندسی صنایع غذایی (کشاورزی)',
  'کاردرمانی',
  'آموزش شیمی',
  'اعضای مصنوعی و وسایل کمکی',
  'علوم آزمایشگاهی',
  'آموزش زیست شناسی',
  'تکنولوژی پرتودرمانی',
  'ساخت پروتزهای دندانی',
  'میکروبیولوژی',
  'اتاق عمل',
  'عکاسی',
  'دامپزشکی',
  'تکنولوژی پرتودرمانی',
  'زبان آلمانی',
  'زیست شناسی',
  'ادبیات نمایشی',
  'کارشناسی تکنولوژی پرتوشناسی',
  'دبیری زیست شناسی',
  'مهندسی صنایع مبلمان',
  'کارشناسی ساخت پروتزهای دندانی',
  'علوم و صنایع غذایی',
  'کارشناسی تکنولوژی پرتودرمانی(رادیوتراپی)',
  'زبان فرانسه',
  'هنر اسلامی',
  'زبان وادبیات انگلیسی',
  'عکاسی',
  'مهندسی کشاورزی',
  'زبان وادبیات اسپانیایی',
  'دبیری شیمی',
  'زیست شناسی سلولی مولکولی',
  'مهندسی رباتیک',
  'مهندسی بهداشت محیط',
  'کارشناسی ساخت پروتزهای دندانی',
  'مدیریت خدمات بهداشتی درمانی',
  'مکاترونیک',
  'مهندسی رباتیک',
  'اعضای مصنوعی',
  'کارشناسی بهداشت عمومی',
  'کارشناسی فرش',
  'چاپ',
  'مرمت و احیای بناهای تاریخی',
  'تلویزیون و هنرهای دیجیتالی',
  'مهندسی اپتیک و لیزر',
  'کاردان فنی عمران',
  'کاردانی معماری',
  'زمین شناسی',
  'مرمت آثار تاریخی',
  'کاردانی تعمیر و نگهداری هواپیما',
  'مهندسی بهداشت حرفه ای',
  'مهندسی مدیریت و آبادانی روستاها',
  'کارشناسی فناوری اطلاعات سلامت',
  'مرمت واحیای بناهای تاریخی',
  'مرمت اثارتاریخی',
  'تلویزیون وهنرهای دیجیتالی',
  'کارشناسی تکنولوژی پرتودرمانی(رادیوتراپی)',
  'بازیگری',
  'کاردان فنی مکانیک',
  'موزه داری',
  'مدیریت فرهنگی هنری',
  'نقاشی',
  'بازیگری _ کارگردانی',
  'مهندسی منابع طبیعی',
  'آهنگسازی',
  'نوازندگی موسیقی ایرانی',
  'نمایش عروسکی',
  'مجسمه سازی',
  'طراحی صحنه',
  'طراحی لباس',
  'فرش',
  'طراحی پارچه',
  'آموزش ارتباط تصویری',
  'کارگردانی تلویزیون',
  'مرمت بناهای تاریخی',
  'بهداشت مواد غذایی',
  'علوم و مهندسی شیلات',
  'نوازندگی موسیقی جهانی',
  'کارگردانی تلویزیون',
  'کاردانی فوریت های پزشکی',
  'تکنولوژی اتاق عمل',
  'نقاشی ایرانی',
  'صنایع دستی',
  'آموزش هنر',
  'آموزش علوم تجربی',
  'طراحی و چاپ پارچه',
  'کارشناسی تکنولوژی پرتوشناسی',
  'علوم وصنایع غذایی',
  'کاردرمانی',
  'کارشناسی تکنولوژی پزشکی هسته ای',
  'علوم تغذیه',
  'تکنولوژی پزشکی هسته ای',
  'شیمی محض',
  'کاردانی تکنسین پروتزهای دندانی',
  'مهندسی بهداشت حرفه ای وایمنی کار',
];

const universityCategoryOptions = [
  {
    id: 'top_iranian',
    label: 'Top Iranian Universities',
    description: 'Sharif University of Technology, Amirkabir University of Technology, University of Tehran',
  },
  {
    id: 'international',
    label: 'International Universities',
    description: 'Any university outside Iran',
  },
  {
    id: 'public',
    label: 'Public Universities',
    description: 'Other public universities in Iran',
  },
  {
    id: 'azad',
    label: 'Azad Universities',
    description: 'Any branch of Islamic Azad University',
  },
  {
    id: 'payam_noor_nonprofit',
    label: 'Payam Noor and Non-Profit Universities',
    description: 'Including Payam Noor, Non-profit, Applied Sciences',
  },
];

const SALARY_MIN_BOUND = 0;
const SALARY_MAX_BOUND = 200;
const SALARY_STEP = 1;
const SALARY_MIN_GAP = 1;

export const JobForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: jobData, isLoading: isLoadingJob } = useJob(Number(id) || 0);
  const { data: departmentsData } = useDepartments();
  const createJobMutation = useCreateJob();
  const updateJobMutation = useUpdateJob();

  // Ensure departments is always an array
  const departments = Array.isArray(departmentsData) ? departmentsData : [];

  const [majorInput, setMajorInput] = useState('');
  const [showMajorSuggestions, setShowMajorSuggestions] = useState(false);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [companyInput, setCompanyInput] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    location: '',
    employment_type: '',
    experience_level: '',
    salary_min: '30',
    salary_max: '80',
    required_skills: [] as Array<{ name: string; priority: 'Critical' | 'Important' | 'Nice-to-have' }>,
    experience_min_years: '',
    experience_min_years_auto_reject: false,
    demographic_requirements: {
      gender: '',
      gender_auto_reject: false,
      military_status: '',
      military_auto_reject: false,
      education_level: '',
      education_level_auto_reject: false,
      education_major: [] as string[],
      education_major_auto_reject: false,
      preferred_universities_enabled: false,
      preferred_universities_auto_reject: false,
      preferred_universities: [] as string[],
      target_companies_enabled: false,
      target_companies: [] as string[],
      age_range: {
        min: '',
        max: '',
        auto_reject: false,
      },
    },
  });

  // Load job data when editing
  useEffect(() => {
    if (isEdit && jobData) {
      const skills = Array.isArray(jobData.required_skills) 
        ? jobData.required_skills.map((s: any) => 
            typeof s === 'string' ? { name: s, priority: 'Important' as const } : s
          )
        : [];
      
      const demo = jobData.demographic_requirements || {
        age_range: {
          min: jobData.age_range_min,
          max: jobData.age_range_max,
          auto_reject: jobData.age_range_auto_reject,
        },
        gender: jobData.gender || '',
        gender_auto_reject: jobData.gender_auto_reject || false,
        military_status: jobData.military_status || '',
        military_auto_reject: jobData.military_auto_reject || false,
        education_level: jobData.education_level || '',
        education_level_auto_reject: jobData.education_level_auto_reject || false,
        education_major: jobData.education_major || [],
        education_major_auto_reject: jobData.education_major_auto_reject || false,
        preferred_universities_enabled: jobData.preferred_universities_enabled || false,
        preferred_universities_auto_reject: jobData.preferred_universities_auto_reject || false,
        preferred_universities: jobData.preferred_universities || [],
        target_companies_enabled: jobData.target_companies_enabled || false,
        target_companies: jobData.target_companies || [],
      };

      setFormData({
        title: jobData.title || '',
        description: jobData.description || '',
        department: jobData.department?.toString() || '',
        location: jobData.location || '',
        employment_type: jobData.employment_type || '',
        experience_level: jobData.experience_level || '',
        salary_min: jobData.salary_min?.toString() || '30',
        salary_max: jobData.salary_max?.toString() || '80',
        required_skills: skills,
        experience_min_years: jobData.experience_min_years?.toString() || '',
        experience_min_years_auto_reject: jobData.experience_min_years_auto_reject || false,
        demographic_requirements: {
          gender: demo.gender || '',
          gender_auto_reject: demo.gender_auto_reject || false,
          military_status: demo.military_status || '',
          military_auto_reject: demo.military_auto_reject || false,
          education_level: demo.education_level || '',
          education_level_auto_reject: demo.education_level_auto_reject || false,
          education_major: demo.education_major || [],
          education_major_auto_reject: demo.education_major_auto_reject || false,
          preferred_universities_enabled: demo.preferred_universities_enabled || false,
          preferred_universities_auto_reject: demo.preferred_universities_auto_reject || false,
          preferred_universities: demo.preferred_universities || [],
          target_companies_enabled: demo.target_companies_enabled || false,
          target_companies: demo.target_companies || [],
          age_range: {
            min: demo.age_range?.min?.toString() || '',
            max: demo.age_range?.max?.toString() || '',
            auto_reject: demo.age_range?.auto_reject || false,
          },
        },
      });
    }
  }, [isEdit, jobData]);

  const [skillInput, setSkillInput] = useState('');
  const [skillPriority, setSkillPriority] = useState<'Critical' | 'Important' | 'Nice-to-have'>('Important');

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

  const togglePreferredUniversity = (categoryId: string) => {
    setFormData((prev) => {
      const current = prev.demographic_requirements.preferred_universities;
      const exists = current.includes(categoryId);
      return {
        ...prev,
        demographic_requirements: {
          ...prev.demographic_requirements,
          preferred_universities: exists
            ? current.filter((item) => item !== categoryId)
            : [...current, categoryId],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData: any = {
        title: formData.title,
        description: formData.description,
        department: formData.department ? Number(formData.department) : null,
        location: formData.location,
        employment_type: formData.employment_type || undefined,
        experience_level: formData.experience_level || undefined,
        salary_min: formData.salary_min ? Number(formData.salary_min) : null,
        salary_max: formData.salary_max ? Number(formData.salary_max) : null,
        required_skills: formData.required_skills,
        experience_min_years: formData.experience_min_years ? Number(formData.experience_min_years) : null,
        experience_min_years_auto_reject: formData.experience_min_years_auto_reject,
        age_range_min: formData.demographic_requirements.age_range.min ? Number(formData.demographic_requirements.age_range.min) : null,
        age_range_max: formData.demographic_requirements.age_range.max ? Number(formData.demographic_requirements.age_range.max) : null,
        age_range_auto_reject: formData.demographic_requirements.age_range.auto_reject,
        gender: formData.demographic_requirements.gender || undefined,
        gender_auto_reject: formData.demographic_requirements.gender_auto_reject,
        military_status: formData.demographic_requirements.military_status || undefined,
        military_auto_reject: formData.demographic_requirements.military_auto_reject,
        education_level: formData.demographic_requirements.education_level || undefined,
        education_level_auto_reject: formData.demographic_requirements.education_level_auto_reject,
        education_major: formData.demographic_requirements.education_major,
        education_major_auto_reject: formData.demographic_requirements.education_major_auto_reject,
        preferred_universities_enabled: formData.demographic_requirements.preferred_universities_enabled,
        preferred_universities_auto_reject: formData.demographic_requirements.preferred_universities_auto_reject,
        preferred_universities: formData.demographic_requirements.preferred_universities,
        target_companies_enabled: formData.demographic_requirements.target_companies_enabled,
        target_companies: formData.demographic_requirements.target_companies,
      };

      if (isEdit && id) {
        await updateJobMutation.mutateAsync({ id: Number(id), data: submitData });
      } else {
        await createJobMutation.mutateAsync(submitData);
      }
      
      navigate('/jobs');
    } catch (error) {
      console.error('Failed to save job:', error);
      alert('Failed to save job. Please try again.');
    }
  };

  if (isEdit && isLoadingJob) {
    return (
      <div className="space-y-6">
        <div className="card p-12 text-center">
          <p className="text-gray-600">Loading job data...</p>
        </div>
      </div>
    );
  }

  const addSkill = () => {
    if (skillInput.trim() && !formData.required_skills.some(s => s.name === skillInput.trim())) {
      setFormData({
        ...formData,
        required_skills: [...formData.required_skills, { name: skillInput.trim(), priority: skillPriority }],
      });
      setSkillInput('');
      setSkillPriority('Important');
    }
  };

  const removeSkill = (skillName: string) => {
    setFormData({
      ...formData,
      required_skills: formData.required_skills.filter((s) => s.name !== skillName),
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
                    <option key={dept.id} value={dept.id}>
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
            <div className="flex items-start gap-0">
              <div className="relative">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSkillInput(value);
                    if (value.trim()) {
                      setShowSkillSuggestions(true);
                    } else {
                      setShowSkillSuggestions(false);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  onFocus={() => {
                    if (skillInput.trim()) {
                      setShowSkillSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay to allow click on suggestion
                    setTimeout(() => setShowSkillSuggestions(false), 200);
                  }}
                  placeholder="Type or select skill..."
                  className="input-field max-w-[200px] rounded-r-none"
                />
                {showSkillSuggestions && skillInput.trim() && (
                  <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {availableSkills
                      .filter((skill: string) =>
                        skill.toLowerCase().includes(skillInput.toLowerCase()) &&
                        !formData.required_skills.some(s => s.name.toLowerCase() === skill.toLowerCase())
                      )
                      .slice(0, 10)
                      .map((skill: string, index: number) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => {
                            if (!formData.required_skills.some(s => s.name.toLowerCase() === skill.toLowerCase())) {
                              setFormData({
                                ...formData,
                                required_skills: [...formData.required_skills, { name: skill, priority: skillPriority }],
                              });
                            }
                            setSkillInput('');
                            setShowSkillSuggestions(false);
                            setSkillPriority('Important');
                          }}
                        >
                          {skill}
                        </button>
                      ))}
                    {availableSkills.filter((skill: string) =>
                      skill.toLowerCase().includes(skillInput.toLowerCase()) &&
                      !formData.required_skills.some(s => s.name.toLowerCase() === skill.toLowerCase())
                    ).length === 0 && skillInput && (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No matching skill found. You can type a custom skill and press Enter.
                      </div>
                    )}
                  </div>
                )}
              </div>
              <select
                value={skillPriority}
                onChange={(e) => setSkillPriority(e.target.value as 'Critical' | 'Important' | 'Nice-to-have')}
                className="input-field max-w-[200px] rounded-none border-l-0"
              >
                <option value="Critical">Critical</option>
                <option value="Important">Important</option>
                <option value="Nice-to-have">Nice-to-have</option>
              </select>
              <button
                type="button"
                onClick={addSkill}
                className="btn-secondary whitespace-nowrap rounded-l-none"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.required_skills.map((skill) => {
                const priorityColors = {
                  'Critical': 'bg-red-500',
                  'Important': 'bg-orange-500',
                  'Nice-to-have': 'bg-blue-500',
                };
                return (
                  <span
                    key={skill.name}
                    className={`inline-flex items-center px-3 py-1 ${priorityColors[skill.priority]} text-white rounded-full text-sm`}
                  >
                    {skill.name}
                    <span className="ml-2 text-xs opacity-90">({skill.priority})</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill.name)}
                      className="ml-2 hover:text-gray-300"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
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
              <div className="relative max-w-[400px] space-y-2">
                <div className="relative flex gap-0">
                  <input
                    type="text"
                    className="input-field max-w-[200px] rounded-r-none"
                    placeholder="Type or select university major..."
                    value={majorInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setMajorInput(value);
                      setShowMajorSuggestions(true);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (majorInput.trim() && !formData.demographic_requirements.education_major.includes(majorInput.trim())) {
                          setFormData({
                            ...formData,
                            demographic_requirements: {
                              ...formData.demographic_requirements,
                              education_major: [...formData.demographic_requirements.education_major, majorInput.trim()],
                            },
                          });
                          setMajorInput('');
                          setShowMajorSuggestions(false);
                        }
                      }
                    }}
                    onFocus={() => setShowMajorSuggestions(true)}
                    onBlur={() => {
                      // Delay to allow click on suggestion
                      setTimeout(() => setShowMajorSuggestions(false), 200);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (majorInput.trim() && !formData.demographic_requirements.education_major.includes(majorInput.trim())) {
                        setFormData({
                          ...formData,
                          demographic_requirements: {
                            ...formData.demographic_requirements,
                            education_major: [...formData.demographic_requirements.education_major, majorInput.trim()],
                          },
                        });
                        setMajorInput('');
                        setShowMajorSuggestions(false);
                      }
                    }}
                    className="btn-secondary whitespace-nowrap rounded-l-none"
                  >
                    Add
                  </button>
                  {showMajorSuggestions && (
                    <div className="absolute z-50 top-full mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {universityMajors
                      .filter((major) =>
                        major.toLowerCase().includes(majorInput.toLowerCase()) &&
                        !formData.demographic_requirements.education_major.includes(major)
                      )
                      .slice(0, 10)
                      .map((major, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => {
                            if (!formData.demographic_requirements.education_major.includes(major)) {
                              setFormData({
                                ...formData,
                                demographic_requirements: {
                                  ...formData.demographic_requirements,
                                  education_major: [...formData.demographic_requirements.education_major, major],
                                },
                              });
                            }
                            setMajorInput('');
                            setShowMajorSuggestions(false);
                          }}
                        >
                          {major}
                        </button>
                      ))}
                    {universityMajors.filter((major) =>
                      major.toLowerCase().includes(majorInput.toLowerCase()) &&
                      !formData.demographic_requirements.education_major.includes(major)
                    ).length === 0 && majorInput && (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No matching major found. You can type a custom major and press Enter.
                      </div>
                    )}
                  </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.demographic_requirements.education_major.map((major) => (
                    <span
                      key={major}
                      className="inline-flex items-center px-3 py-1 bg-primary text-white rounded-full text-sm"
                    >
                      {major}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            demographic_requirements: {
                              ...formData.demographic_requirements,
                              education_major: formData.demographic_requirements.education_major.filter((m) => m !== major),
                            },
                          });
                        }}
                        className="ml-2 hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
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
                    Select one or more university categories that you prefer candidates to have attended.
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {universityCategoryOptions.map((category) => {
                      const isSelected = formData.demographic_requirements.preferred_universities.includes(category.id);
                      return (
                        <label
                          key={category.id}
                          className={`flex items-start rounded-md border px-3 py-3 text-sm transition hover:border-primary/60 ${isSelected ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-700'}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePreferredUniversity(category.id)}
                            className="mt-0.5 mr-3 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{category.label}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{category.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <label className="block text-sm font-medium text-gray-700">Target Companies</label>
              </div>
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mr-3 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={formData.demographic_requirements.target_companies_enabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      demographic_requirements: {
                        ...formData.demographic_requirements,
                        target_companies_enabled: e.target.checked,
                        target_companies: e.target.checked
                          ? formData.demographic_requirements.target_companies
                          : [],
                      },
                    })
                  }
                />
                Enable target companies
              </label>

              {formData.demographic_requirements.target_companies_enabled && (
                <div className="relative max-w-[400px] space-y-2">
                  <div className="relative flex gap-0">
                    <input
                      type="text"
                      className="input-field max-w-[200px] rounded-r-none"
                      placeholder="Type company name..."
                      value={companyInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCompanyInput(value);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (companyInput.trim() && !formData.demographic_requirements.target_companies.includes(companyInput.trim())) {
                            setFormData({
                              ...formData,
                              demographic_requirements: {
                                ...formData.demographic_requirements,
                                target_companies: [...formData.demographic_requirements.target_companies, companyInput.trim()],
                              },
                            });
                            setCompanyInput('');
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (companyInput.trim() && !formData.demographic_requirements.target_companies.includes(companyInput.trim())) {
                          setFormData({
                            ...formData,
                            demographic_requirements: {
                              ...formData.demographic_requirements,
                              target_companies: [...formData.demographic_requirements.target_companies, companyInput.trim()],
                            },
                          });
                          setCompanyInput('');
                        }
                      }}
                      className="btn-secondary whitespace-nowrap rounded-l-none"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.demographic_requirements.target_companies.map((company) => (
                      <span
                        key={company}
                        className="inline-flex items-center px-3 py-1 bg-primary text-white rounded-full text-sm"
                      >
                        {company}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              demographic_requirements: {
                                ...formData.demographic_requirements,
                                target_companies: formData.demographic_requirements.target_companies.filter((c) => c !== company),
                              },
                            });
                          }}
                          className="ml-2 hover:text-gray-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
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
              disabled={createJobMutation.isPending || updateJobMutation.isPending}
            >
              <Save className="h-5 w-5 mr-2" />
              {createJobMutation.isPending || updateJobMutation.isPending 
                ? 'Saving...' 
                : isEdit ? 'Update Job' : 'Create Job'}
            </button>
        </div>
      </form>
    </div>
  );
};

