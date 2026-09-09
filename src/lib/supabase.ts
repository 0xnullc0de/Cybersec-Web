import { createClient } from '@supabase/supabase-js';
import { Writeup, Certification } from '@/types';
import { writeups as fallbackWriteups } from '@/data/writeups';
import { certifications as fallbackCerts } from '@/data/certifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bhtzmnhmdlmsuxivwgua.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

export function isWriteupRetired(row: { is_retired?: boolean; retirement_date?: string | null; isRetired?: boolean; retirementDate?: string | null }): boolean {
  return Boolean(row.is_retired || row.isRetired || ((row.retirement_date || row.retirementDate) && new Date((row.retirement_date || row.retirementDate) as string).getTime() <= Date.now()));
}

// Map database row to Writeup type
export function mapDbToWriteup(row: any): Writeup {
  return {
    slug: row.slug,
    title: row.title,
    platform: row.platform,
    difficulty: row.difficulty,
    os: row.os,
    tags: row.tags || [],
    datePublished: row.date_published,
    retirementDate: row.retirement_date,
    isRetired: Boolean(row.is_retired),
    points: row.points || 0,
    ipAddress: row.ip_address || '',
    featured: Boolean(row.featured),
    summary: row.summary || '',
    initialAccessVector: row.initial_access_vector || '',
    privEscVector: row.priv_esc_vector || '',
    previewContent: row.preview_content || '',
    content: row.full_content || row.preview_content || '',
    pdfPath: row.pdf_path || undefined,
    imagePaths: row.image_paths || [],
  };
}

// Map database row to Certification type
export function mapDbToCert(row: any): Certification {
  return {
    id: row.id,
    name: row.name,
    fullName: row.full_name,
    issuer: row.issuer,
    date: row.date,
    status: row.status,
    credentialId: row.credential_id || undefined,
    badgeColor: row.badge_color || '#00ff66',
    description: row.description || '',
    skillsCovered: row.skills_covered || [],
    verificationUrl: row.verification_url || undefined,
  };
}

/**
 * Fetch all writeups from Supabase.
 * Falls back to static dataset if database query encounters issues.
 */
export async function getWriteups(): Promise<Writeup[]> {
  try {
    const { data, error } = await supabase
      .from('writeups_public')
      .select('*')
      .order('date_published', { ascending: false });

    if (error || !data || data.length === 0) {
      return fallbackWriteups;
    }

    return data.map(mapDbToWriteup);
  } catch (err) {
    console.error('Error querying writeups from Supabase:', err);
    return fallbackWriteups;
  }
}

/**
 * Fetch a single writeup by slug from Supabase.
 * For active machines, full_content will be null from writeups_public,
 * requiring password unlock via /api/writeups/[slug]/unlock.
 */
export async function getWriteupBySlug(slug: string): Promise<Writeup | null> {
  try {
    const { data, error } = await supabase
      .from('writeups_public')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      const fallback = fallbackWriteups.find((w) => w.slug === slug);
      if (!fallback) return null;
      // If active, ensure content is sanitized if using fallback
      if (!fallback.isRetired) {
        return {
          ...fallback,
          content: '', // Never leak active content initially
        };
      }
      return fallback;
    }

    return mapDbToWriteup(data);
  } catch (err) {
    console.error(`Error querying writeup ${slug} from Supabase:`, err);
    const fallback = fallbackWriteups.find((w) => w.slug === slug);
    if (!fallback) return null;
    if (!fallback.isRetired) {
      return { ...fallback, content: '' };
    }
    return fallback;
  }
}

/**
 * Fetch all certificates from Supabase.
 */
export async function getCertificates(): Promise<Certification[]> {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return fallbackCerts;
    }

    return data.map(mapDbToCert);
  } catch (err) {
    console.error('Error querying certificates from Supabase:', err);
    return fallbackCerts;
  }
}
