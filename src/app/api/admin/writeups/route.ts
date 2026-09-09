import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase, supabaseAdmin } from '@/lib/supabase';

const client = supabaseAdmin || supabase;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('x-admin-key');
    const expectedKey = process.env.ADMIN_PASSWORD || 'nulbyt3-root';
    if (authHeader !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await client
      .from('writeups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('x-admin-key');
    const expectedKey = process.env.ADMIN_PASSWORD || 'nulbyt3-root';
    if (authHeader !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      platform = 'HTB',
      difficulty = 'Medium',
      os = 'Linux',
      tags = [],
      summary = '',
      initialAccessVector = '',
      privEscVector = '',
      previewContent = '',
      fullContent = '',
      isRetired = false,
      retirementDate = null,
      points = 20,
      ipAddress = '',
      featured = false,
      unlockPassword = '',
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const cleanSlug = (slug || `${platform.toLowerCase()}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)
      .replace(/^-+|-+$/g, '');

    let passwordHash = null;
    let savedUnlockPassword = null;
    if (unlockPassword && unlockPassword.trim()) {
      savedUnlockPassword = unlockPassword.trim();
      passwordHash = bcrypt.hashSync(savedUnlockPassword, 10);
    }

    const row = {
      slug: cleanSlug,
      title,
      platform,
      difficulty,
      os,
      tags: Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      summary,
      initial_access_vector: initialAccessVector,
      priv_esc_vector: privEscVector,
      preview_content: previewContent,
      full_content: fullContent,
      is_retired: Boolean(isRetired),
      retirement_date: retirementDate || null,
      points: Number(points) || 0,
      ip_address: ipAddress || '',
      featured: Boolean(featured),
      password_hash: passwordHash,
      unlock_password: savedUnlockPassword,
      date_published: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('writeups')
      .upsert(row, { onConflict: 'slug' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, writeup: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
