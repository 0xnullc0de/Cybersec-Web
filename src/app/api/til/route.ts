import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { supabase, supabaseAdmin, mapDbToTilNote } from "@/lib/supabase";
import { tilNotes as fallbackTilNotes } from "@/data/til";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const publicRes = await supabase
      .from("til_notes_public")
      .select("*")
      .order("date", { ascending: false })
      .order("display_order", { ascending: false });

    if (!publicRes.error && publicRes.data && publicRes.data.length > 0) {
      return NextResponse.json(publicRes.data.map(mapDbToTilNote), {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from("til_notes")
      .select(
        "id, slug, title, category, date, tags, read_time, summary, content, image_urls, display_order, created_at, updated_at"
      )
      .order("date", { ascending: false })
      .order("display_order", { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json(fallbackTilNotes, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    return NextResponse.json(data.map(mapDbToTilNote), {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("GET /api/til error:", err);
    return NextResponse.json(fallbackTilNotes);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("x-admin-key");
    const expectedKey = process.env.ADMIN_PASSWORD || "nulbyt3-root";
    if (authHeader !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      category = "Tooling",
      date,
      tags = [],
      readTime = "3 min read",
      summary = "",
      content,
      imageUrls = [],
      isLocked = false,
      unlockPassword = "",
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Required fields missing: title, content" },
        { status: 400 }
      );
    }

    const finalSlug = (
      slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    ).trim();
    const finalDate = date || new Date().toISOString().split("T")[0];

    const client = supabaseAdmin || supabase;
    const { data: latest } = await client
      .from("til_notes")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1);

    const nextOrder = (latest?.[0]?.display_order || 0) + 1;

    let finalUnlockPassword: string | null = null;
    let passwordHash: string | null = null;

    if (Boolean(isLocked)) {
      finalUnlockPassword =
        (typeof unlockPassword === "string" && unlockPassword.trim()) ||
        `NOTE{${title.replace(/[^a-zA-Z0-9]/g, "")}_Vault_${Math.random()
          .toString(16)
          .substring(2, 6)
          .toUpperCase()}!}`;
      passwordHash = await bcrypt.hash(finalUnlockPassword, 10);
    }

    const newRecord: Record<string, any> = {
      title: title.trim(),
      slug: finalSlug,
      category: category.trim(),
      date: finalDate,
      tags: Array.isArray(tags)
        ? tags
        : typeof tags === "string"
        ? tags
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [],
      read_time: readTime.trim(),
      summary: summary.trim(),
      content: content.trim(),
      image_urls: Array.isArray(imageUrls) ? imageUrls : [],
      display_order: nextOrder,
      updated_at: new Date().toISOString(),
    };

    if (Boolean(isLocked)) {
      newRecord.is_locked = true;
      newRecord.password_hash = passwordHash;
      newRecord.unlock_password = finalUnlockPassword;
    }

    const { data, error } = await client
      .from("til_notes")
      .insert(newRecord)
      .select()
      .single();

    if (error) {
      if (error.message?.includes("is_locked")) {
        return NextResponse.json(
          {
            error:
              "Locked notes require running supabase/migrations/0003_til_notes_notion_vault.sql in your Supabase SQL Editor first.",
          },
          { status: 500 }
        );
      }
      console.error("Insert til_note error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      revalidatePath("/til");
      revalidatePath("/til/vault");
      revalidatePath("/");
    } catch (_) {}

    return NextResponse.json(mapDbToTilNote(data), { status: 201 });
  } catch (err: any) {
    console.error("POST /api/til error:", err);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
