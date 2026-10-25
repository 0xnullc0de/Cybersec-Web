import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin, mapDbToCert } from '@/lib/supabase';
import { certifications as fallbackCerts } from '@/data/certifications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('certificates')
      .select('*')
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json(fallbackCerts, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      });
    }

    return NextResponse.json(data.map(mapDbToCert), {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (err: any) {
    console.error('GET /api/certificates error:', err);
    return NextResponse.json(fallbackCerts, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = supabaseAdmin || supabase;
    const body = await request.json();

    const {
      name,
      fullName,
      issuer,
      date,
      status = 'earned',
      credentialId,
      badgeColor = '#00ff66',
      description = '',
      skillsCovered = [],
      verificationUrl,
      isProLab = false,
      writeupSlug = null,
      badgeImagePath = null,
    } = body;

    if (!name || !fullName || !issuer || !date) {
      return NextResponse.json(
        { error: 'Required fields missing: name, fullName, issuer, date' },
        { status: 400 }
      );
    }

    // Get highest display order
    const { data: latest } = await client
      .from('certificates')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (latest?.[0]?.display_order || 0) + 1;

    const newRecord = {
      name: name.trim(),
      full_name: fullName.trim(),
      issuer: issuer.trim(),
      date: date.trim(),
      status: status === 'in-progress' ? 'in-progress' : 'earned',
      credential_id: credentialId ? credentialId.trim() : null,
      badge_color: badgeColor || '#00ff66',
      description: description.trim(),
      skills_covered: Array.isArray(skillsCovered)
        ? skillsCovered.map((s: string) => s.trim()).filter(Boolean)
        : typeof skillsCovered === 'string'
        ? skillsCovered.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
      verification_url: verificationUrl ? verificationUrl.trim() : null,
      is_pro_lab: Boolean(isProLab),
      writeup_slug: writeupSlug ? writeupSlug.trim() : null,
      badge_image_path: badgeImagePath ? badgeImagePath.trim() : null,
      display_order: nextOrder,
    };

    const { data, error } = await client
      .from('certificates')
      .insert([newRecord])
      .select()
      .single();

    if (error) {
      console.error('Supabase certificate insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapDbToCert(data), { status: 201 });
  } catch (err: any) {
    console.error('POST /api/certificates error:', err);
    return NextResponse.json({ error: 'Server error creating certificate' }, { status: 500 });
  }
}
