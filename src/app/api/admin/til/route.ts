import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("x-admin-key");
    const expectedKey = process.env.ADMIN_PASSWORD || "nulbyt3-root";
    if (authHeader !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from("til_notes")
      .select("*")
      .order("date", { ascending: false })
      .order("display_order", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (data || []).map((row: any) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      category: row.category || "Tooling",
      date: row.date,
      tags: row.tags || [],
      readTime: row.read_time || "3 min read",
      summary: row.summary || "",
      content: row.content || "",
      isLocked: Boolean(row.is_locked),
      unlockPassword: row.unlock_password || "",
      imageUrls: row.image_urls || [],
      notionPageId: row.notion_page_id || undefined,
    }));

    return NextResponse.json(formatted, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
