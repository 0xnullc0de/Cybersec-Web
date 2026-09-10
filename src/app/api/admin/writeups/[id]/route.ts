import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase, supabaseAdmin } from '@/lib/supabase';

const client = supabaseAdmin || supabase;

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('x-admin-key');
    const expectedKey = process.env.ADMIN_PASSWORD || 'nulbyt3-root';
    if (authHeader !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const updates: any = { updated_at: new Date().toISOString() };

    if (body.title !== undefined) updates.title = body.title;
    if (body.summary !== undefined) updates.summary = body.summary;
    if (body.platform !== undefined) updates.platform = body.platform;
    if (body.difficulty !== undefined) updates.difficulty = body.difficulty;
    if (body.os !== undefined) updates.os = body.os;
    if (body.tags !== undefined) {
      updates.tags = Array.isArray(body.tags)
        ? body.tags
        : body.tags.split(',').map((t: string) => t.trim().replace(/^#/, '')).filter(Boolean);
    }
    if (body.initialAccessVector !== undefined || body.initial_access_vector !== undefined) {
      updates.initial_access_vector = body.initialAccessVector ?? body.initial_access_vector;
    }
    if (body.privEscVector !== undefined || body.priv_esc_vector !== undefined) {
      updates.priv_esc_vector = body.privEscVector ?? body.priv_esc_vector;
    }
    if (body.isProLab !== undefined || body.is_pro_lab !== undefined) {
      updates.is_pro_lab = Boolean(body.isProLab ?? body.is_pro_lab);
    }
    if (body.isRetired !== undefined) updates.is_retired = Boolean(body.isRetired);
    if (body.retirementDate !== undefined) updates.retirement_date = body.retirementDate;
    if (body.previewContent !== undefined) updates.preview_content = body.previewContent;
    if (body.fullContent !== undefined) updates.full_content = body.fullContent;
    if (body.featured !== undefined) updates.featured = Boolean(body.featured);

    if (body.unlockPassword !== undefined) {
      if (body.unlockPassword && body.unlockPassword.trim()) {
        const cleanPw = body.unlockPassword.trim();
        updates.unlock_password = cleanPw;
        updates.password_hash = bcrypt.hashSync(cleanPw, 10);
      } else {
        updates.unlock_password = null;
        updates.password_hash = null;
      }
    }

    const { data, error } = await client
      .from('writeups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, writeup: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('x-admin-key');
    const expectedKey = process.env.ADMIN_PASSWORD || 'nulbyt3-root';
    if (authHeader !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { error } = await client.from('writeups').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Writeup deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
