import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const slugOrId = params.id;
    const body = await request.json().catch(() => ({}));
    const submittedPassword =
      typeof body.password === "string" ? body.password.trim() : "";

    const client = supabaseAdmin || supabase;

    // Look up by slug first, then fallback to id if UUID
    let { data: note, error } = await client
      .from("til_notes")
      .select("id, slug, title, is_locked, password_hash, content, image_urls, summary, tags, category")
      .eq("slug", slugOrId)
      .maybeSingle();

    if (!note && /^[0-9a-f-]{36}$/i.test(slugOrId)) {
      const byId = await client
        .from("til_notes")
        .select("id, slug, title, is_locked, password_hash, content, image_urls, summary, tags, category")
        .eq("id", slugOrId)
        .maybeSingle();
      note = byId.data;
      error = byId.error;
    }

    if (error || !note) {
      return NextResponse.json(
        { success: false, error: "Technique note not found" },
        { status: 404 }
      );
    }

    if (!note.is_locked) {
      return NextResponse.json({
        success: true,
        unlockedReason: "public",
        fullContent: note.content,
        imageUrls: note.image_urls || [],
      });
    }

    if (!note.password_hash) {
      return NextResponse.json(
        { success: false, error: "No access passphrase set for this locked note." },
        { status: 403 }
      );
    }

    if (!submittedPassword) {
      return NextResponse.json(
        { success: false, error: "Passphrase required." },
        { status: 400 }
      );
    }

    const matches = await bcrypt.compare(submittedPassword, note.password_hash);
    if (!matches) {
      return NextResponse.json(
        { success: false, error: "Invalid access passphrase. Access denied." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      unlockedReason: "passphrase",
      fullContent: note.content,
      imageUrls: note.image_urls || [],
    });
  } catch (err: any) {
    console.error(`Error in /api/til/${params.id}/unlock:`, err);
    return NextResponse.json(
      { success: false, error: "Server authentication error" },
      { status: 500 }
    );
  }
}
