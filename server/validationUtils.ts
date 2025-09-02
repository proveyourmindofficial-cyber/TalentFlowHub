import { z } from 'zod';

/**
 * Validation utilities for candidate data
 */

// UAN Number validation (12 digits)
export const uanNumberSchema = z.string()
  .regex(/^\d{12}$/, "UAN must be exactly 12 digits")
  .optional()
  .or(z.literal(''));

// Aadhaar Number validation (12 digits with Verhoeff algorithm)
export const aadhaarNumberSchema = z.string()
  .regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits")
  .refine((value) => {
    if (!value) return true; // Optional field
    return validateAadhaarVerhoeff(value);
  }, "Invalid Aadhaar number")
  .optional()
  .or(z.literal(''));

// LinkedIn URL validation
export const linkedinUrlSchema = z.string()
  .regex(/^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/, "Invalid LinkedIn URL format")
  .optional()
  .or(z.literal(''));

// Phone number validation (10 digits)
export const phoneNumberSchema = z.string()
  .regex(/^\d{10}$/, "Phone number must be exactly 10 digits");

// Email validation with domain check
export const emailSchema = z.string()
  .email("Invalid email format")
  .refine((email) => {
    const domain = email.split('@')[1];
    const validDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'company.com'];
    // Allow all domains for now, but could be restricted
    return domain.length > 0;
  }, "Invalid email domain");

// CTC validation (reasonable range)
export const ctcSchema = z.number()
  .min(0, "CTC cannot be negative")
  .max(10000000, "CTC seems unrealistically high") // 1 Crore max
  .optional();

// Experience validation
export const experienceSchema = z.number()
  .min(0, "Experience cannot be negative")
  .max(50, "Experience cannot exceed 50 years");

/**
 * Verhoeff algorithm for Aadhaar validation
 * Reference: https://en.wikipedia.org/wiki/Verhoeff_algorithm
 */
function validateAadhaarVerhoeff(aadhaarStr: string): boolean {
  if (!/^\d{12}$/.test(aadhaarStr)) return false;
  
  const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
  ];

  const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
  ];

  let c = 0;
  const myArray = aadhaarStr.split('').reverse().map(Number);
  
  for (let i = 0; i < myArray.length; i++) {
    c = d[c][p[((i + 1) % 8)][myArray[i]]];
  }
  
  return c === 0;
}

/**
 * Generate next serial number for external candidates
 */
export async function getNextExternalCandidateSerial(): Promise<number> {
  // This will be handled by the database sequence
  return 1;
}

/**
 * Validate candidate type specific fields
 */
export function validateCandidateTypeFields(candidateType: string, data: any) {
  if (candidateType === 'external') {
    const requiredFields = ['recruiterName', 'source', 'clientName'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields for external candidate: ${missingFields.join(', ')}`);
    }
  }
}