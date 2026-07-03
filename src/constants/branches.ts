export const CANONICAL_BRANCHES = [
  'CSE',
  'IT',
  'ECE',
  'EEE',
  'Mechanical',
  'Civil',
  'Chemical',
  'Biotechnology',
  'AI & ML',
  'AI & DS',
  'Data Science',
  'Cyber Security',
  'Electronics and Computer Engineering',
  'Robotics',
  'Mechatronics',
  'Information Science',
  'MCA',
  'MTech',
  'MBA',
  'Other'
] as const;

export type Branch = typeof CANONICAL_BRANCHES[number];

/**
 * Normalizes any branch string to the canonical value.
 * e.g., "Computer Science" -> "CSE", "Information Technology" -> "IT"
 */
export function getCanonicalBranch(branch: string | null | undefined): string {
  if (!branch) return 'Other';
  const clean = branch.trim().toUpperCase();
  if (clean === 'COMPUTER SCIENCE' || clean === 'COMPUTER SCIENCE ENGINEERING' || clean === 'CSE' || clean.includes('COMP') || clean.includes('CS')) return 'CSE';
  if (clean === 'INFORMATION TECHNOLOGY' || clean === 'IT' || clean.includes('INFO') || clean.includes('IT')) return 'IT';
  if (clean === 'ELECTRONICS AND COMMUNICATION' || clean === 'ELECTRONICS' || clean === 'ECE' || clean.includes('ECE') || clean.includes('ELECTRONIC')) return 'ECE';
  if (clean === 'ELECTRICAL' || clean === 'ELECTRICAL ENGINEERING' || clean === 'EEE' || clean.includes('EEE') || clean.includes('ELECTRI')) return 'EEE';
  if (clean === 'MECHANICAL' || clean === 'MECH' || clean === 'MECHANICAL ENGINEERING' || clean.includes('MECH')) return 'Mechanical';
  if (clean === 'CIVIL' || clean === 'CIVIL ENGINEERING' || clean.includes('CIVIL')) return 'Civil';
  if (clean === 'CHEMICAL' || clean === 'CHEMICAL ENGINEERING' || clean.includes('CHEMIC')) return 'Chemical';
  if (clean === 'BIOTECHNOLOGY' || clean === 'BIOTECH' || clean.includes('BIOTECH')) return 'Biotechnology';
  
  // Try case-insensitive matching
  const matched = CANONICAL_BRANCHES.find(b => b.toLowerCase() === branch.trim().toLowerCase());
  return matched || 'Other';
}
