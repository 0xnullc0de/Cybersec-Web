import { NextRequest, NextResponse } from 'next/server';
import { supabase, mapDbToCert } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const updates: Record<string, any> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.fullName !== undefined) updates.full_name = body.fullName;
    if (body.issuer !== undefined) updates.issuer = body.issuer;
    if (body.date !== undefined) updates.date = body.date;
    if (body.status !== undefined) updates.status = body.status;
    if (body.credentialId !== undefined) updates.credential_id = body.credentialId;
    if (body.badgeColor !== undefined) updates.badge_color = body.badgeColor;
    if (body.description !== undefined) updates.description = body.description;
    if (body.skillsCovered !== undefined) updates.skills_covered = body.skillsCovered;
    if (body.verificationUrl !== undefined) updates.verification_url = body.verificationUrl;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('certificates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapDbToCert(data));
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update certificate' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { error } = await supabase
      .from('certificates')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Certificate deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete certificate' }, { status: 500 });
  }
}
