import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { writeups as fallbackWriteups } from '@/data/writeups';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json().catch(() => ({}));
    const submittedPassword = typeof body.password === 'string' ? body.password.trim() : '';

    // Query writeup directly from writeups table including password_hash and full_content
    const { data: writeup, error } = await supabase
      .from('writeups')
      .select('slug, title, is_retired, is_pro_lab, retirement_date, password_hash, full_content')
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
          });
        }
      }

      // Check password
      if (fallback.password && submittedPassword === fallback.password) {
        return NextResponse.json({
          success: true,
          unlockedReason: 'passphrase',
          fullContent: fallback.content,
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
