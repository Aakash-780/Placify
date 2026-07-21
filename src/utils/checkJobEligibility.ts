import { getCanonicalBranch } from '@/constants/branches';

export type EligibilityResult = {
  status: 'eligible' | 'ineligible' | 'incomplete';
  reasons: string[];
};

export function checkJobEligibility(student: any, job: any): EligibilityResult {
  const reasons: string[] = [];

  // Null/incomplete profile safety checks
  if (
    !student ||
    student.branch === null || student.branch === undefined || student.branch === '' ||
    student.current_year === null || student.current_year === undefined ||
    student.cgpa === null || student.cgpa === undefined ||
    student.backlogs === null || student.backlogs === undefined
  ) {
    return {
      status: 'incomplete',
      reasons: ['Complete your profile to check eligibility.']
    };
  }

  const studentBranch = getCanonicalBranch(student.branch);
  const studentYear = Number(student.current_year);
  const studentCgpa = parseFloat(student.cgpa) || 0;
  const studentBacklogs = parseInt(student.backlogs, 10) || 0;

  // DB array parser helper for arrays that might be strings or arrays
  const parseArray = (val: any) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      return val.replace(/[{}]/g, '').split(',').map(s => s.replace(/"/g, '').trim()).filter(Boolean);
    }
    return [val];
  };

  // 1. Branch check
  const rawBranches = parseArray(job.allowed_branches);
  const hasAllBranch = rawBranches.some(b => String(b).trim().toLowerCase() === 'all');
  const allowedBranches = rawBranches.map(b => getCanonicalBranch(b));
  if (allowedBranches.length > 0 && !hasAllBranch && !allowedBranches.includes(studentBranch)) {
    reasons.push('Branch not eligible');
  }

  // 2. Year check (Academic Year: 1st Year, 2nd Year, 3rd Year, Final Year)
  const rawYears = parseArray(job.allowed_years);
  const hasAllYear = rawYears.some(y => String(y).trim().toLowerCase() === 'all');
  const allowedYears = rawYears.map(y => Number(y)).filter(y => !isNaN(y));
  if (allowedYears.length > 0 && !hasAllYear && !allowedYears.includes(studentYear)) {
    reasons.push('Year not eligible');
  }

  // 3. CGPA check
  const minCgpa = parseFloat(job.min_cgpa) || 0;
  if (studentCgpa < minCgpa) {
    reasons.push('Minimum CGPA not met');
  }

  // 4. Backlogs check
  const maxBacklogs = parseInt(job.max_backlogs, 10) || 0;
  if (studentBacklogs > maxBacklogs) {
    reasons.push('Too many backlogs');
  }

  // 5. Deadline check
  if (job.application_deadline) {
    const deadlineDate = new Date(job.application_deadline);
    if (deadlineDate < new Date()) {
      reasons.push('Application closed');
    }
  }

  // 6. Archived/Status check
  if (job.status === 'archived' || job.status === 'closed') {
    reasons.push('Application closed');
  }

  if (reasons.length > 0) {
    return {
      status: 'ineligible',
      reasons
    };
  }

  return {
    status: 'eligible',
    reasons: []
  };
}
