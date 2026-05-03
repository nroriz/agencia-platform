import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import archiver from "archiver";
import { PassThrough } from "stream";
import type { CarouselSlide } from "@/types/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch carousel with slides
  const { data: carousel, error } = await supabase
    .from("carousels")
    .select("*, carousel_slides(*)")
    .eq("id", id)
    .single();

  if (error || !carousel) {
    return NextResponse.json({ error: "Carousel not found" }, { status: 404 });
  }

  const slides = (carousel.carousel_slides as unknown as CarouselSlide[]) ?? [];
  const sortedSlides = [...slides].sort(
    (a, b) => a.slide_number - b.slide_number
  );

  // Create ZIP archive
  const archive = archiver("zip", { zlib: { level: 6 } });
  const passthrough = new PassThrough();
  archive.pipe(passthrough);

  // Download and add each slide PNG to the ZIP
  for (const slide of sortedSlides) {
    if (!slide.png_url) continue;
    try {
      const response = await fetch(slide.png_url);
      if (!response.ok) continue;
      const buffer = Buffer.from(await response.arrayBuffer());
      const filename = `slide_${String(slide.slide_number).padStart(2, "0")}.png`;
      archive.append(buffer, { name: filename });
    } catch {
      // Skip slides that fail to download
    }
  }

  // Add caption.txt
  if (carousel.caption) {
    archive.append(carousel.caption, { name: "caption.txt" });
  }

  // Add hashtags.txt
  if (carousel.hashtags && carousel.hashtags.length > 0) {
    const hashtagsText = carousel.hashtags
      .map((t: string) => `#${t}`)
      .join(" ");
    archive.append(hashtagsText, { name: "hashtags.txt" });
  }

  // Add info.json
  const info = {
    id: carousel.id,
    tema: carousel.tema,
    tema_refinado: carousel.tema_refinado,
    formato: carousel.formato,
    territorio: carousel.territorio,
    hook_linha1: carousel.hook_linha1,
    hook_linha2: carousel.hook_linha2,
    slides_count: sortedSlides.length,
    created_at: carousel.created_at,
    status: carousel.status,
  };
  archive.append(JSON.stringify(info, null, 2), { name: "info.json" });

  archive.finalize();

  // Update status to downloaded (don't block on it)
  supabase
    .from("carousels")
    .update({ status: "downloaded" })
    .eq("id", id)
    .in("status", ["approved", "downloaded"])
    .then(() => {});

  // Convert stream to ReadableStream for Response
  const readable = new ReadableStream({
    start(controller) {
      passthrough.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      passthrough.on("end", () => {
        controller.close();
      });
      passthrough.on("error", (err) => {
        controller.error(err);
      });
    },
  });

  const safeName = (carousel.tema_refinado ?? carousel.tema ?? "carrossel")
    .replace(/[^a-zA-Z0-9\u00C0-\u024F ]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 50);

  return new Response(readable, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeName}.zip"`,
    },
  });
}
