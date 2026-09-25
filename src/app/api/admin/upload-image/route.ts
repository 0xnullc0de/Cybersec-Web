import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "notes";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name ? file.name.split(".").pop()?.toLowerCase() || "png" : "png";
    const cleanName = (file.name || "image").replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${folder}/${Date.now()}-${cleanName}`;

    const client = supabaseAdmin || supabase;
    const { data, error } = await client.storage
      .from("writeup-images")
      .upload(filename, buffer, {
        contentType: file.type || "image/png",
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: publicUrlData } = client.storage
      .from("writeup-images")
      .getPublicUrl(filename);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      path: filename,
    });
  } catch (err: any) {
    console.error("Upload image error:", err);
    return NextResponse.json({ error: err.message || "Failed to upload image" }, { status: 500 });
  }
}
