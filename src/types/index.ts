export type Platform = 'HTB' | 'THM' | 'Proving Grounds' | 'CTF' | 'Other';
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Insane';
export type OperatingSystem = 'Linux' | 'Windows' | 'Active Directory' | 'FreeBSD' | 'Multi';

export interface Writeup {
  slug: string;
  title: string;
  platform: Platform;
  difficulty: Difficulty;
  os: OperatingSystem;
  tags: string[];
  datePublished: string;
  retirementDate: string | null;
  isRetired: boolean;
  summary: string;
  initialAccessVector: string;
  privEscVector: string;
  points?: number;
  ipAddress?: string;
  featured?: boolean;
  /** Access password for active/locked writeups. Generated from machine name + HTB flag style. */
  password?: string;
  pdfPath?: string;
  imagePaths?: string[];
  content: string;
  previewContent?: string;
}


export interface Certification {
  id: string;
  name: string;
  fullName: string;
  issuer: string;
  date: string;
  status: 'earned' | 'in-progress';
  credentialId?: string;
  badgeColor: string;
  description: string;
  skillsCovered: string[];
  verificationUrl?: string;
}

export interface TilNote {
  id: string;
  slug: string;
  title: string;
  category: 'Active Directory' | 'Privilege Escalation' | 'Web Security' | 'Reverse Engineering' | 'Tooling' | 'Evasion';
  date: string;
  tags: string[];
  readTime: string;
  summary: string;
  content: string;
}

export interface SiteConfig {
  name: string;
  handle: string;
  role: string;
  bio: string;
  statusBadge: string;
  socials: {
    github: string;
    linkedin: string;
    twitter: string;
    htb: string;
    thm: string;
    email: string;
  };
  stats: {
    htbRank: string;
    writeupsPublished: number;
    certsProgress: string;
    machinesPwned: number;
    successRate: string;
    redTeamHours: string;
  };
}
