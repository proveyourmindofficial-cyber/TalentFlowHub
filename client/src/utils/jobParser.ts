/**
 * 🚀 MOST POWERFUL FREE JOB PARSER ENGINE
 * Advanced pattern recognition for extracting job details from text
 * Zero cost - no external APIs required!
 */

export interface ParsedJobData {
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  department: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType: 'full_time' | 'part_time' | 'contract' | 'internship';
  experienceLevel: string;
  skills: string;
  benefits: string;
  isRemoteAvailable: boolean;
  companyName?: string;
  contactEmails: string[];
}

export class JobParser {
  
  /**
   * 🎯 MAIN PARSING ENGINE - Extracts all job details
   */
  static parseJobPosting(text: string): ParsedJobData {
    const normalizedText = this.normalizeText(text);
    
    return {
      title: this.extractJobTitle(normalizedText),
      description: this.extractDescription(normalizedText),
      requirements: this.extractRequirements(normalizedText),
      responsibilities: this.extractResponsibilities(normalizedText),
      department: this.extractDepartment(normalizedText),
      location: this.extractLocation(normalizedText),
      salaryMin: this.extractSalaryMin(normalizedText),
      salaryMax: this.extractSalaryMax(normalizedText),
      jobType: this.extractJobType(normalizedText),
      experienceLevel: this.extractExperience(normalizedText),
      skills: this.extractSkills(normalizedText),
      benefits: this.extractBenefits(normalizedText),
      isRemoteAvailable: this.extractRemoteAvailability(normalizedText),
      companyName: this.extractCompanyName(normalizedText),
      contactEmails: this.extractContactEmails(normalizedText),
    };
  }

  /**
   * 📝 TEXT NORMALIZATION - Clean and prepare text
   */
  private static normalizeText(text: string): string {
    return text
      .replace(/[\u2013\u2014]/g, '-') // Replace em/en dashes
      .replace(/[\u2018\u2019]/g, "'") // Replace smart quotes
      .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * 💼 JOB TITLE EXTRACTION - Multiple pattern recognition
   */
  private static extractJobTitle(text: string): string {
    const patterns = [
      // Direct patterns
      /(?:hiring|looking for|seeking).{0,50}?(?:an?\s+)?([^.\n!]{10,80}?)(?:\s+to join|\s+in|\s+at|\s*!|\s*\n)/i,
      /(?:position|role|vacancy|opening).{0,20}?:?\s*([^.\n!]{10,80}?)(?:\s+to join|\s+in|\s+at|\s*!|\s*\n)/i,
      /we're hiring.{0,30}?([^.\n!]{10,80}?)(?:\s+to join|\s+in|\s+at|\s*!|\s*\n)/i,
      
      // Role/Position patterns
      /🧑‍💼\s*role\s*:?\s*([^.\n!]{10,80}?)(?:\s*\n|\s*–|\s*-)/i,
      /role\s*:?\s*([^.\n!]{15,80}?)(?:\s*\n|\s*–|\s*-)/i,
      
      // Job title after keywords
      /(?:job title|position|role|vacancy)\s*:?\s*([^.\n!]{10,80}?)(?:\s*\n|$)/i,
      
      // Between quotes or emphasis
      /"([^"]{10,80}?)"/i,
      /'([^']{10,80})'/i,
      
      // Multi-word titles in first lines
      /^.{0,100}?([A-Z][^.\n!]{15,80}?)(?:\s*\(|$|\n)/m,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const title = this.cleanJobTitle(match[1]);
        if (this.isValidJobTitle(title)) {
          return title;
        }
      }
    }

    // Fallback: Extract first meaningful line
    const firstLine = text.split('\n')[0]?.trim();
    if (firstLine && firstLine.length > 10 && firstLine.length < 100) {
      const cleaned = this.cleanJobTitle(firstLine);
      if (this.isValidJobTitle(cleaned)) {
        return cleaned;
      }
    }

    return "Job Position";
  }

  /**
   * 🧹 CLEAN JOB TITLE - Remove noise and emojis
   */
  private static cleanJobTitle(title: string): string {
    return title
      .replace(/[🚀📍🏢🕓🧑‍💼✅❗📩📧#]+/g, '') // Remove emojis
      .replace(/^(we're hiring|hiring|looking for|seeking|position|role|vacancy)\s*/i, '')
      .replace(/\s*(to join|in|at|!).*$/i, '')
      .replace(/^\s*-\s*/, '') // Remove leading dash
      .trim();
  }

  /**
   * ✅ VALIDATE JOB TITLE - Check if it's a real job title
   */
  private static isValidJobTitle(title: string): boolean {
    if (!title || title.length < 5 || title.length > 100) return false;
    
    // Must contain job-related keywords
    const jobKeywords = /(?:manager|developer|analyst|specialist|engineer|director|coordinator|assistant|executive|consultant|lead|senior|junior|intern)/i;
    const hasJobKeyword = jobKeywords.test(title);
    
    // Must not be generic phrases
    const genericPhrases = /^(we're|looking|hiring|join|team|company|opportunity)$/i;
    const isNotGeneric = !genericPhrases.test(title.trim());
    
    return hasJobKeyword && isNotGeneric;
  }

  /**
   * 📍 LOCATION EXTRACTION - Multiple location patterns
   */
  private static extractLocation(text: string): string {
    const patterns = [
      /📍\s*location\s*:?\s*([^.\n]{3,50}?)(?:\s*\n|$)/i,
      /location\s*:?\s*([^.\n]{3,50}?)(?:\s*\n|$)/i,
      /based\s+in\s+([^.\n]{3,50}?)(?:\s*\n|$)/i,
      /office\s+in\s+([^.\n]{3,50}?)(?:\s*\n|$)/i,
      /work\s+from\s+([^.\n]{3,50}?)(?:\s*office|\s*\n|$)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const location = match[1].trim();
        if (this.isValidLocation(location)) {
          return location;
        }
      }
    }

    return "";
  }

  /**
   * ✅ VALIDATE LOCATION
   */
  private static isValidLocation(location: string): boolean {
    if (!location || location.length < 2 || location.length > 50) return false;
    
    // Indian cities and common locations
    const validLocations = /(?:hyderabad|bangalore|chennai|mumbai|delhi|pune|kolkata|ahmedabad|jaipur|lucknow|kanpur|nagpur|indore|thane|bhopal|visakhapatnam|pimpri|patna|vadodara|ghaziabad|ludhiana|agra|nashik|faridabad|meerut|rajkot|kalyan|vasai|varanasi|srinagar|aurangabad|dhanbad|amritsar|navi mumbai|allahabad|ranchi|gwalior|jabalpur|coimbatore|vijayawada|jodhpur|madurai|raipur|kota|guwahati|chandigarh|solapur|hubli|tiruchirappalli|bareilly|mysore|tiruppur|gurgaon|aligarh|jalandhar|bhubaneswar|salem|mira bhayandar|warangal|thiruvananthapuram|guntur|bhiwandi|saharanpur|gorakhpur|bikaner|amravati|noida|jamshedpur|bhilai|cuttack|firozabad|kochi|nellore|bhavnagar|dehradun|durgapur|asansol|rourkela|nanded|kolhapur|ajmer|akola|gulbarga|jamnagar|ujjain|loni|siliguri|jhansi|ulhasnagar|jammu|sangli miraj kupwad|mangalore|erode|belgaum|ambattur|tirunelveli|malegaon|gaya|jalgaon|udaipur|maheshtala)/i;
    
    return validLocations.test(location) || /^[A-Za-z\s,.-]+$/.test(location);
  }

  /**
   * 💼 WORK MODE & REMOTE DETECTION
   */
  private static extractRemoteAvailability(text: string): boolean {
    const remotePatterns = /(?:remote|work from home|wfh|hybrid|telecommute)/i;
    const officePatterns = /(?:work from office|office|on-site|onsite)/i;
    
    if (remotePatterns.test(text)) return true;
    if (officePatterns.test(text)) return false;
    
    return false; // Default to office
  }

  /**
   * 🎯 EXPERIENCE EXTRACTION
   */
  private static extractExperience(text: string): string {
    const patterns = [
      /🕓?\s*experience\s*:?\s*([0-9]+\s*[-–]\s*[0-9]+\s*years?)/i,
      /([0-9]+\s*[-–]\s*[0-9]+)\s*years?\s*(?:of\s*)?experience/i,
      /minimum\s*([0-9]+\s*[-–]\s*[0-9]+)\s*years/i,
      /([0-9]+\+?)\s*years?\s*(?:of\s*)?experience/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return "";
  }

  /**
   * 💰 SALARY EXTRACTION
   */
  private static extractSalaryMin(text: string): number | undefined {
    const salaryMatch = text.match(/(?:salary|ctc|package)\s*:?\s*(?:rs\.?\s*|₹\s*)?([0-9,]+)\s*[-–]\s*([0-9,]+)/i);
    if (salaryMatch) {
      return parseInt(salaryMatch[1].replace(/,/g, ''));
    }
    return undefined;
  }

  private static extractSalaryMax(text: string): number | undefined {
    const salaryMatch = text.match(/(?:salary|ctc|package)\s*:?\s*(?:rs\.?\s*|₹\s*)?([0-9,]+)\s*[-–]\s*([0-9,]+)/i);
    if (salaryMatch) {
      return parseInt(salaryMatch[2].replace(/,/g, ''));
    }
    return undefined;
  }

  /**
   * 🏷️ JOB TYPE EXTRACTION
   */
  private static extractJobType(text: string): 'full_time' | 'part_time' | 'contract' | 'internship' {
    const contractPatterns = /(?:contract|contract[-\s]to[-\s]hire|c2h|contractor)/i;
    const partTimePatterns = /(?:part[-\s]time|part time)/i;
    const internshipPatterns = /(?:intern|internship|trainee)/i;
    
    if (contractPatterns.test(text)) return 'contract';
    if (partTimePatterns.test(text)) return 'part_time';
    if (internshipPatterns.test(text)) return 'internship';
    
    return 'full_time';
  }

  /**
   * 🏢 DEPARTMENT EXTRACTION
   */
  private static extractDepartment(text: string): string {
    const jobTitle = this.extractJobTitle(text);
    const lowerTitle = jobTitle.toLowerCase();
    
    if (/(?:talent|recruit|hr|human resources)/i.test(lowerTitle)) return 'Human Resources';
    if (/(?:developer|engineer|tech|software|frontend|backend|fullstack)/i.test(lowerTitle)) return 'Engineering';
    if (/(?:sales|business development)/i.test(lowerTitle)) return 'Sales';
    if (/(?:marketing|digital marketing)/i.test(lowerTitle)) return 'Marketing';
    if (/(?:finance|accounting)/i.test(lowerTitle)) return 'Finance';
    if (/(?:operations|ops)/i.test(lowerTitle)) return 'Operations';
    if (/(?:support|customer)/i.test(lowerTitle)) return 'Customer Support';
    if (/(?:design|ui|ux)/i.test(lowerTitle)) return 'Design';
    
    return 'General';
  }

  /**
   * 🔧 SKILLS EXTRACTION - Extract technical and soft skills
   */
  private static extractSkills(text: string): string {
    const skillPatterns = [
      // Technical skills
      /(?:javascript|js|typescript|ts|react|angular|vue|node\.?js|python|java|php|\.net|c#|sql|mongodb|mysql|postgresql|aws|azure|docker|kubernetes)/gi,
      // Soft skills
      /(?:communication|leadership|teamwork|problem solving|analytical|organizational)/gi,
      // Domain specific
      /(?:recruitment|hiring|sourcing|it recruitment|domestic|contract hiring)/gi,
    ];

    const skills = new Set<string>();
    
    skillPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(skill => skills.add(skill.toLowerCase()));
      }
    });

    return Array.from(skills).join(', ');
  }

  /**
   * 📋 REQUIREMENTS EXTRACTION
   */
  private static extractRequirements(text: string): string {
    const sections = this.extractBulletSections(text);
    const requirementKeywords = /(?:requirement|qualifications?|skills?|must have|should have|experience|expertise)/i;
    
    for (const section of sections) {
      if (requirementKeywords.test(section.title)) {
        return section.content;
      }
    }
    
    // Fallback: Look for bullet points after requirement keywords
    const requirementMatch = text.match(/(?:requirement|qualifications?)[\s\S]*?((?:\s*[•✅▪-]\s*.+(?:\n|$))+)/i);
    if (requirementMatch) {
      return this.cleanBulletPoints(requirementMatch[1]);
    }
    
    return "";
  }

  /**
   * 📝 RESPONSIBILITIES EXTRACTION
   */
  private static extractResponsibilities(text: string): string {
    const sections = this.extractBulletSections(text);
    const responsibilityKeywords = /(?:responsibilities|duties|key responsibilities|what you'll do|role|tasks)/i;
    
    for (const section of sections) {
      if (responsibilityKeywords.test(section.title)) {
        return section.content;
      }
    }
    
    // Fallback: Look for bullet points after responsibility keywords
    const responsibilityMatch = text.match(/(?:responsibilities|duties)[\s\S]*?((?:\s*[•✅▪-]\s*.+(?:\n|$))+)/i);
    if (responsibilityMatch) {
      return this.cleanBulletPoints(responsibilityMatch[1]);
    }
    
    return "";
  }

  /**
   * 🎁 BENEFITS EXTRACTION
   */
  private static extractBenefits(text: string): string {
    const benefitPatterns = [
      /(?:benefits|perks|what we offer)[\s\S]*?((?:\s*[•✅▪-]\s*.+(?:\n|$))+)/i,
    ];

    for (const pattern of benefitPatterns) {
      const match = text.match(pattern);
      if (match) {
        return this.cleanBulletPoints(match[1]);
      }
    }

    return "";
  }

  /**
   * 🏢 COMPANY NAME EXTRACTION
   */
  private static extractCompanyName(text: string): string {
    const patterns = [
      /(?:hiring at|join|at)\s+([A-Z][A-Za-z\s&.]+?)(?:\s*!|\s*$|\s*\n)/i,
      /([A-Z][A-Za-z\s&.]+?)\s*(?:is hiring|hiring)/i,
      /🏢\s*([A-Za-z\s&.]+?)(?:\s*$|\s*\n)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const company = match[1].trim();
        if (this.isValidCompanyName(company)) {
          return company;
        }
      }
    }

    return "";
  }

  /**
   * ✅ VALIDATE COMPANY NAME
   */
  private static isValidCompanyName(name: string): boolean {
    if (!name || name.length < 2 || name.length > 50) return false;
    return /^[A-Za-z0-9\s&.-]+$/.test(name);
  }

  /**
   * 📧 EMAIL EXTRACTION
   */
  private static extractContactEmails(text: string): string[] {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailPattern) || [];
    return [...new Set(emails)]; // Remove duplicates
  }

  /**
   * 📄 DESCRIPTION EXTRACTION
   */
  private static extractDescription(text: string): string {
    // Remove header information and get the main description
    const lines = text.split('\n');
    let descriptionStart = 0;
    
    // Skip the initial hiring announcement and details
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('passionate') || line.includes('opportunity') || line.includes('join') || line.includes('looking for')) {
        descriptionStart = i;
        break;
      }
    }

    // Find where structured sections start
    let descriptionEnd = lines.length;
    for (let i = descriptionStart; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('key responsibilities') || line.includes('requirements') || line.includes('qualifications')) {
        descriptionEnd = i;
        break;
      }
    }

    const description = lines.slice(descriptionStart, descriptionEnd).join('\n').trim();
    return description || "Join our dynamic team and make a real impact in our organization.";
  }

  /**
   * 🔤 EXTRACT BULLET SECTIONS - Parse structured content
   */
  private static extractBulletSections(text: string): Array<{ title: string; content: string }> {
    const sections: Array<{ title: string; content: string }> = [];
    const lines = text.split('\n');
    
    let currentSection: { title: string; content: string } | null = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if it's a section header
      if (trimmedLine.match(/^🔑|^[A-Z][^:]*:$|^[A-Z\s]+:$/)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = { title: trimmedLine, content: '' };
      } else if (currentSection && trimmedLine.match(/^[•✅▪-]/)) {
        currentSection.content += (currentSection.content ? '\n' : '') + trimmedLine;
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  /**
   * 🧹 CLEAN BULLET POINTS
   */
  private static cleanBulletPoints(text: string): string {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^[•✅▪-]\s*/, '• '))
      .join('\n');
  }
}

/**
 * 🚀 QUICK PARSE FUNCTION - Easy to use wrapper
 */
export function parseJobPosting(jobText: string): ParsedJobData {
  return JobParser.parseJobPosting(jobText);
}