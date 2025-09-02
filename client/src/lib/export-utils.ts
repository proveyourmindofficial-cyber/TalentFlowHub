import { format } from 'date-fns';

export function exportToCsv<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const actualColumns = columns || Object.keys(data[0]).map(key => ({ key, label: key }));
  
  // Create CSV header
  const header = actualColumns.map(col => col.label).join(',');
  
  // Create CSV rows
  const rows = data.map(item => 
    actualColumns.map(col => {
      const value = item[col.key];
      if (value === null || value === undefined) return '';
      
      // Handle dates
      if (value && typeof value === 'object' && value instanceof Date) {
        return format(value, 'yyyy-MM-dd');
      }
      
      if (value && typeof value === 'string' && !isNaN(Date.parse(value))) {
        return format(new Date(value), 'yyyy-MM-dd');
      }
      
      // Handle arrays
      if (Array.isArray(value)) {
        return `"${value.join('; ')}"`;
      }
      
      // Handle strings with commas or quotes
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(',')
  );
  
  const csvContent = [header, ...rows].join('\n');
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  // For now, we'll export as CSV with .xlsx extension
  // In a full implementation, you'd use a library like SheetJS
  exportToCsv(data, filename, columns);
}

export function downloadTemplate(templateType: 'jobs' | 'candidates' | 'applications' | 'interviews' | 'offer-letters') {
  const templates = {
    jobs: {
      filename: 'jobs_template',
      headers: ['title', 'description', 'department', 'location', 'salaryMin', 'salaryMax', 'jobType', 'experienceLevel', 'skills', 'benefits'],
      sampleData: ['Software Developer', 'Develop and maintain web applications', 'Engineering', 'Bangalore', '800000', '1200000', 'full_time', 'Mid-level', 'JavaScript;React;Node.js', 'Health Insurance;PF']
    },
    candidates: {
      filename: 'candidates_template',
      headers: ['name', 'email', 'phone', 'primarySkill', 'totalExperience', 'currentCompany', 'currentLocation', 'expectedCtc'],
      sampleData: ['John Doe', 'john@example.com', '+91-9876543210', 'React Developer', '3.5', 'TechCorp', 'Bangalore', '1200000']
    },
    applications: {
      filename: 'applications_template',
      headers: ['candidateEmail', 'jobTitle', 'stage', 'appliedDate'],
      sampleData: ['john@example.com', 'Software Developer', 'Applied', '2025-08-20']
    },
    interviews: {
      filename: 'interviews_template',
      headers: ['candidateEmail', 'jobTitle', 'interviewDate', 'interviewTime', 'round', 'mode', 'interviewerName'],
      sampleData: ['john@example.com', 'Software Developer', '2025-08-25', '14:00', 'L1', 'Online', 'Jane Smith']
    },
    'offer-letters': {
      filename: 'offer_letters_template',
      headers: ['candidateEmail', 'jobTitle', 'designation', 'ctc', 'joiningDate', 'hrName'],
      sampleData: ['john@example.com', 'Software Developer', 'Software Developer', '1200000', '2025-09-01', 'HR Manager']
    }
  };

  const template = templates[templateType];
  const csvContent = [
    template.headers.join(','),
    template.sampleData.join(',')
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${template.filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseCsvFile(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          reject(new Error('CSV file must have at least a header and one data row'));
          return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const obj: any = {};
          
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          
          return obj;
        });
        
        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse CSV file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}