import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// تنظیم worker برای pdfjs - استفاده از CDN
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

// کلمات کلیدی رزومه (فارسی و انگلیسی)
const RESUME_KEYWORDS = {
  personal: ['name', 'نام', 'email', 'ایمیل', 'phone', 'تلفن', 'mobile', 'موبایل', 'contact', 'تماس', 'address', 'آدرس'],
  experience: ['experience', 'تجربه', 'work', 'کار', 'employment', 'employment history', 'سابقه کار', 'position', 'موقعیت', 'job', 'شغل', 'career', 'سابقه'],
  education: ['education', 'تحصیلات', 'university', 'دانشگاه', 'degree', 'مدرک', 'bachelor', 'master', 'کارشناسی', 'کارشناسی ارشد', 'phd', 'دکترا', 'diploma', 'دیپلم'],
  skills: ['skills', 'مهارت', 'technical', 'فنی', 'programming', 'برنامه\u200cنویسی', 'ability', 'توانایی', 'competence', 'شایستگی'],
  resume: ['resume', 'cv', 'curriculum vitae', 'رزومه', 'سوابق', 'resumé']
};

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  reasons: string[];
  warning?: string;
}

/**
 * استخراج متن از فایل PDF
 */
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    
    // فقط 3 صفحه اول را بررسی می‌کنیم برای سرعت بیشتر
    const maxPages = Math.min(pdf.numPages, 3);
    
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ') + '\n';
    }
    
    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('خطا در خواندن فایل PDF');
  }
}

/**
 * استخراج متن از فایل DOCX
 */
async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('خطا در خواندن فایل DOCX');
  }
}

/**
 * استخراج متن از فایل
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'pdf') {
    return await extractTextFromPDF(file);
  } else if (extension === 'docx') {
    return await extractTextFromDOCX(file);
  } else if (extension === 'doc') {
    // برای فایل‌های .doc قدیمی، سعی می‌کنیم با mammoth بخوانیم
    try {
      return await extractTextFromDOCX(file);
    } catch {
      throw new Error('فایل‌های DOC قدیمی پشتیبانی نمی‌شوند. لطفا فایل را به DOCX تبدیل کنید.');
    }
  }
  
  throw new Error('فرمت فایل پشتیبانی نمی‌شود');
}

/**
 * بررسی سریع فایل (بدون استخراج متن)
 */
export function quickResumeCheck(file: File): { isValid: boolean; reason?: string } {
  const fileName = file.name.toLowerCase();
  const resumeKeywords = RESUME_KEYWORDS.resume;
  
  // بررسی نام فایل
  const hasResumeKeyword = resumeKeywords.some(keyword => 
    fileName.includes(keyword.toLowerCase())
  );
  
  // بررسی پسوند
  const validExtensions = ['.pdf', '.doc', '.docx'];
  const fileExtension = '.' + fileName.split('.').pop();
  const hasValidExtension = validExtensions.some(ext => 
    fileExtension === ext
  );
  
  if (!hasValidExtension) {
    return { isValid: false, reason: 'فرمت فایل معتبر نیست' };
  }
  
  // بررسی اندازه فایل (رزومه معمولاً بین 50KB تا 5MB است)
  const isValidSize = file.size > 50 * 1024 && file.size < 5 * 1024 * 1024;
  
  if (!isValidSize) {
    return { isValid: false, reason: 'اندازه فایل غیرمعمول است' };
  }
  
  // اگر نام فایل شامل کلمات کلیدی رزومه باشد، احتمال بالایی دارد
  if (hasResumeKeyword) {
    return { isValid: true, reason: 'نام فایل نشان‌دهنده رزومه است' };
  }
  
  // در غیر این صورت نیاز به بررسی دقیق‌تر دارد
  return { isValid: true, reason: 'نیاز به بررسی دقیق‌تر' };
}

/**
 * بررسی دقیق محتوای فایل برای تشخیص رزومه
 */
export function analyzeResumeContent(text: string, fileName: string): ValidationResult {
  const lowerText = text.toLowerCase();
  const reasons: string[] = [];
  let score = 0;
  const warnings: string[] = [];
  
  // بررسی وجود بخش‌های اصلی رزومه
  const hasPersonalInfo = RESUME_KEYWORDS.personal.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
  if (hasPersonalInfo) {
    score += 20;
    reasons.push('اطلاعات شخصی یافت شد');
  } else {
    warnings.push('اطلاعات شخصی یافت نشد');
  }
  
  const hasExperience = RESUME_KEYWORDS.experience.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
  if (hasExperience) {
    score += 25;
    reasons.push('بخش تجربه کاری یافت شد');
  } else {
    warnings.push('بخش تجربه کاری یافت نشد');
  }
  
  const hasEducation = RESUME_KEYWORDS.education.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
  if (hasEducation) {
    score += 25;
    reasons.push('بخش تحصیلات یافت شد');
  } else {
    warnings.push('بخش تحصیلات یافت نشد');
  }
  
  const hasSkills = RESUME_KEYWORDS.skills.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
  if (hasSkills) {
    score += 15;
    reasons.push('بخش مهارت‌ها یافت شد');
  }
  
  // بررسی وجود ایمیل
  const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/;
  if (emailRegex.test(text)) {
    score += 10;
    reasons.push('ایمیل یافت شد');
  } else {
    warnings.push('ایمیل یافت نشد');
  }
  
  // بررسی وجود شماره تلفن (ایرانی)
  const phoneRegex = /(\+98|0)?9\d{9}|0\d{10}/;
  if (phoneRegex.test(text)) {
    score += 10;
    reasons.push('شماره تلفن یافت شد');
  }
  
  // بررسی حداقل طول متن (رزومه معمولاً حداقل 200 کاراکتر دارد)
  if (text.length < 200) {
    score -= 20;
    warnings.push('متن خیلی کوتاه است');
  } else if (text.length > 5000) {
    warnings.push('متن خیلی طولانی است (ممکن است سند دیگری باشد)');
  }
  
  // بررسی وجود کلمات کلیدی رزومه در نام فایل
  const resumeInFilename = RESUME_KEYWORDS.resume.some(keyword => 
    fileName.toLowerCase().includes(keyword.toLowerCase())
  );
  if (resumeInFilename) {
    score += 5;
    reasons.push('نام فایل نشان‌دهنده رزومه است');
  }
  
  // بررسی وجود تاریخ (رزومه‌ها معمولاً تاریخ دارند)
  const dateRegex = /\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}/;
  if (dateRegex.test(text)) {
    score += 5;
    reasons.push('تاریخ یافت شد');
  }
  
  const confidence = Math.min(Math.max(score, 0), 100);
  const isValid = score >= 50; // حداقل 50 امتیاز برای تایید
  
  return {
    isValid,
    confidence,
    reasons,
    warning: warnings.length > 0 ? warnings.join('، ') : undefined
  };
}

/**
 * بررسی کامل فایل رزومه (ترکیبی از بررسی سریع و دقیق)
 */
export async function validateResumeFile(
  file: File,
  options: { skipContentCheck?: boolean } = {}
): Promise<ValidationResult & { file: File }> {
  // مرحله 1: بررسی سریع
  const quickCheck = quickResumeCheck(file);
  
  if (!quickCheck.isValid) {
    return {
      isValid: false,
      confidence: 0,
      reasons: [quickCheck.reason || 'فایل معتبر نیست'],
      file
    };
  }
  
  // اگر بررسی سریع موفق بود و skipContentCheck فعال است، برگردان
  if (options.skipContentCheck) {
    return {
      isValid: true,
      confidence: 70,
      reasons: [quickCheck.reason || 'بررسی اولیه موفق بود'],
      file
    };
  }
  
  // مرحله 2: بررسی دقیق محتوا
  try {
    const text = await extractTextFromFile(file);
    
    if (!text || text.trim().length < 50) {
      return {
        isValid: false,
        confidence: 0,
        reasons: ['فایل قابل خواندن نیست یا خالی است'],
        file
      };
    }
    
    const analysis = analyzeResumeContent(text, file.name);
    
    return {
      ...analysis,
      file
    };
  } catch (error: any) {
    // در صورت خطا در استخراج متن، از بررسی سریع استفاده می‌کنیم
    return {
      isValid: quickCheck.isValid,
      confidence: 60,
      reasons: [
        quickCheck.reason || 'بررسی اولیه موفق بود',
        `هشدار: ${error.message || 'خطا در خواندن محتوا'}`
      ],
      warning: 'نمی‌توان محتوای فایل را بررسی کرد',
      file
    };
  }
}

