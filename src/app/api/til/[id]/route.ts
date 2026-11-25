import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { supabase, supabaseAdmin, mapDbToTilNote } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("x-admin-key");
    const expectedKey = process.env.ADMIN_PASSWORD || "nulbyt3-root";
    if (authHeader !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
        ? body.tags
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [];
    }
    if (body.readTime !== undefined) updates.read_time = body.readTime.trim();
    if (body.summary !== undefined) updates.summary = body.summary.trim();
    if (body.content !== undefined) updates.content = body.content.trim();
    if (body.imageUrls !== undefined) updates.image_urls = body.imageUrls;

    if (body.isLocked !== undefined) {
      const locking = Boolean(body.isLocked);
      updates.is_locked = locking;

      if (locking) {
        const providedPw =
          typeof body.unlockPassword === "string" ? body.unlockPassword.trim() : "";
        if (providedPw) {
          updates.unlock_password = providedPw;
          updates.password_hash = await bcrypt.hash(providedPw, 10);
        } else {
          // Ensure a password exists if locking without providing a new string
          const client = supabaseAdmin || supabase;
          const { data: curr } = await client
            .from("til_notes")
            .select("title, unlock_password, password_hash")
            .eq("id", id)
            .maybeSingle();

          if (!curr?.password_hash) {
            const titleBase = (body.title || curr?.title || "Note").replace(/[^a-zA-Z0-9]/g, "");
            const autoPw = `NOTE{${titleBase}_Vault_${Math.random()
              .toString(16)
              .substring(2, 6)
              .toUpperCase()}!}`;
            updates.unlock_password = autoPw;
            updates.password_hash = await bcrypt.hash(autoPw, 10);
          }
        }
      } else {
        updates.unlock_password = null;
        updates.password_hash = null;
      }
    } else if (typeof body.unlockPassword === "string" && body.unlockPassword.trim()) {
      const pw = body.unlockPassword.trim();
      updates.unlock_password = pw;
      updates.password_hash = await bcrypt.hash(pw, 10);
    }

    updates.updated_at = new Date().toISOString();

    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from("til_notes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.message?.includes("is_locked")) {
        return NextResponse.json(
          {
            error:
              "Locked notes require running supabase/migrations/0003_til_notes_notion_vault.sql in Supabase SQL Editor first.",
          },
          { status: 500 }
        );
      }
      console.error("Update til_note error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      revalidatePath("/til");
      revalidatePath("/til/vault");
      revalidatePath("/");
    } catch (_) {}

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
    const authHeader = request.headers.get("x-admin-key");
    const expectedKey = process.env.ADMIN_PASSWORD || "nulbyt3-root";
    if (authHeader !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const client = supabaseAdmin || supabase;
    const { error } = await client.from("til_notes").delete().eq("id", id);

    if (error) {
      console.error("Delete til_note error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      revalidatePath("/til");
      revalidatePath("/til/vault");
      revalidatePath("/");
    } catch (_) {}

    return NextResponse.json({ success: true, message: "Note deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/til/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
