import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin, mapDbToTilNote } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const updates: Record<string, any> = {};
    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.slug !== undefined) updates.slug = body.slug.trim();
    if (body.category !== undefined) updates.category = body.category.trim();
    if (body.date !== undefined) updates.date = body.date.trim();
    if (body.tags !== undefined) {
      updates.tags = Array.isArray(body.tags)
        ? body.tags
        : typeof body.tags === "string"
        ? body.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [];
    }
    if (body.readTime !== undefined) updates.read_time = body.readTime.trim();
    if (body.summary !== undefined) updates.summary = body.summary.trim();
    if (body.content !== undefined) updates.content = body.content.trim();
    if (body.imageUrls !== undefined) updates.image_urls = body.imageUrls;
    updates.updated_at = new Date().toISOString();

    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from("til_notes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update til_note error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapDbToTilNote(data));
  } catch (err: any) {
    console.error("PATCH /api/til/[id] error:", err);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from("til_notes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete til_note error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Note deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/til/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
