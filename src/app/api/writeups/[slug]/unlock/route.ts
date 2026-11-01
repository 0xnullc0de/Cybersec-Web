import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { writeups as fallbackWriteups } from '@/data/writeups';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json().catch(() => ({}));
    const submittedPassword = typeof body.password === 'string' ? body.password.trim() : '';

    const client = supabaseAdmin || supabase;

    // Query writeup directly from writeups table including password_hash and full_content
    const { data: writeup, error } = await client
      .from('writeups')
      .select('slug, title, is_retired, is_pro_lab, retirement_date, password_hash, full_content, initial_access_vector, priv_esc_vector, summary, tags, ip_address, difficulty, os, platform')
      .eq('slug', slug)
      .single();

    if (error || !writeup) {
      // Check fallback data
      const fallback = fallbackWriteups.find((w) => w.slug === slug);
      if (!fallback) {
        return NextResponse.json({ success: false, error: 'Writeup not found' }, { status: 404 });
      }

      // Check if retired (only for non-pro-labs)
      if (!fallback.isProLab) {
        const isRetiredNow = fallback.isRetired || (fallback.retirementDate && new Date(fallback.retirementDate) <= new Date());
        if (isRetiredNow) {
          return NextResponse.json({
            success: true,
            unlockedReason: 'retired',
            fullContent: fallback.content,
            initialAccessVector: fallback.initialAccessVector,
            privEscVector: fallback.privEscVector,
            summary: fallback.summary,
            tags: fallback.tags,
            ipAddress: fallback.ipAddress,
            difficulty: fallback.difficulty,
            os: fallback.os,
            platform: fallback.platform,
          });
        }
      }

      // Check password
      if (fallback.password && submittedPassword === fallback.password) {
        return NextResponse.json({
          success: true,
          unlockedReason: 'passphrase',
          fullContent: fallback.content,
          initialAccessVector: fallback.initialAccessVector,
          privEscVector: fallback.privEscVector,
          summary: fallback.summary,
          tags: fallback.tags,
          ipAddress: fallback.ipAddress,
          difficulty: fallback.difficulty,
          os: fallback.os,
          platform: fallback.platform,
        });
      }

      return NextResponse.json(
        { success: false, error: 'Invalid access passphrase. Access denied.' },
        { status: 401 }
      );
    }

    // Condition 1: Check if machine is officially retired (only for non-pro-labs)
    const isProLab = Boolean(writeup.is_pro_lab);
    if (!isProLab) {
      const isRetired = Boolean(
        writeup.is_retired ||
        (writeup.retirement_date && new Date(writeup.retirement_date) <= new Date())
      );

      if (isRetired) {
        return NextResponse.json({
          success: true,
          unlockedReason: 'retired',
          fullContent: writeup.full_content,
          initialAccessVector: writeup.initial_access_vector,
          privEscVector: writeup.priv_esc_vector,
          summary: writeup.summary,
          tags: writeup.tags,
          ipAddress: writeup.ip_address,
          difficulty: writeup.difficulty,
          os: writeup.os,
          platform: writeup.platform,
        });
      }
    }

    // Condition 2: Active machine - verify password against bcrypt hash
    if (!writeup.password_hash) {
      return NextResponse.json(
        { success: false, error: 'No passphrase set for this active machine.' },
        { status: 403 }
      );
    }

    if (!submittedPassword) {
      return NextResponse.json(
        { success: false, error: 'Passphrase required.' },
        { status: 400 }
      );
    }

    const matches = await bcrypt.compare(submittedPassword, writeup.password_hash);

    if (matches) {
      return NextResponse.json({
        success: true,
        unlockedReason: 'passphrase',
        fullContent: writeup.full_content,
        initialAccessVector: writeup.initial_access_vector,
        privEscVector: writeup.priv_esc_vector,
        summary: writeup.summary,
        tags: writeup.tags,
        ipAddress: writeup.ip_address,
        difficulty: writeup.difficulty,
        os: writeup.os,
        platform: writeup.platform,
      });
    }

    // Authentication failure
    return NextResponse.json(
      { success: false, error: 'Invalid access passphrase. Access denied.' },
      { status: 401 }
    );
  } catch (err: any) {
    console.error(`Error in /api/writeups/${params.slug}/unlock:`, err);
    return NextResponse.json(
      { success: false, error: 'Server authentication error' },
      { status: 500 }
    );
  }
}
