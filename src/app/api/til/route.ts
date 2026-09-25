import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin, mapDbToTilNote } from "@/lib/supabase";
import { tilNotes as fallbackTilNotes } from "@/data/til";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("til_notes")
      .select("*")
      .order("display_order", { ascending: true });

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
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Required fields missing: title, content" },
        { status: 400 }
      );
    }

    const finalSlug = (slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")).trim();
    const finalDate = date || new Date().toISOString().split("T")[0];

    const { data: latest } = await supabase
      .from("til_notes")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1);

    const nextOrder = (latest?.[0]?.display_order || 0) + 1;

    const newRecord = {
      title: title.trim(),
      slug: finalSlug,
      category: category.trim(),
      date: finalDate,
      tags: Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
      read_time: readTime.trim(),
      summary: summary.trim(),
      content: content.trim(),
      image_urls: Array.isArray(imageUrls) ? imageUrls : [],
      display_order: nextOrder,
      updated_at: new Date().toISOString(),
    };

    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from("til_notes")
      .insert(newRecord)
      .select()
      .single();

    if (error) {
      console.error("Insert til_note error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapDbToTilNote(data), { status: 201 });
  } catch (err: any) {
    console.error("POST /api/til error:", err);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
