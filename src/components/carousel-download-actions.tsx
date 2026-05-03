"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  Copy,
  Check,
  FileArchive,
  Hash,
  MessageSquare,
} from "lucide-react";

interface CarouselDownloadActionsProps {
  carouselId: string;
  caption: string | null;
  hashtags: string[] | null;
  slideUrls: { slideNumber: number; url: string }[];
}

export function CarouselDownloadActions({
  carouselId,
  caption,
  hashtags,
  slideUrls,
}: CarouselDownloadActionsProps) {
  const [downloading, setDownloading] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);
  const [hashtagsCopied, setHashtagsCopied] = useState(false);

  async function handleDownloadZip() {
    setDownloading(true);
    try {
      const response = await fetch(`/api/carousel/${carouselId}/download`);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `carrossel_${carouselId.substring(0, 8)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silently fail
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopyCaption() {
    if (!caption) return;
    await navigator.clipboard.writeText(caption);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2000);
  }

  async function handleCopyHashtags() {
    if (!hashtags || hashtags.length === 0) return;
    const text = hashtags.map((t) => `#${t}`).join(" ");
    await navigator.clipboard.writeText(text);
    setHashtagsCopied(true);
    setTimeout(() => setHashtagsCopied(false), 2000);
  }

  function handleDownloadSlide(url: string, slideNumber: number) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `slide_${String(slideNumber).padStart(2, "0")}.png`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="space-y-4">
      {/* Main actions row */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={handleDownloadZip}
          disabled={downloading}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <FileArchive className="size-4 mr-1.5" />
          {downloading ? "Preparando..." : "Baixar Carrossel Completo"}
        </Button>

        {caption && (
          <Button variant="outline" size="sm" onClick={handleCopyCaption}>
            {captionCopied ? (
              <Check className="size-4 mr-1.5 text-green-400" />
            ) : (
              <MessageSquare className="size-4 mr-1.5" />
            )}
            {captionCopied ? "Copiado!" : "Copiar Caption"}
          </Button>
        )}

        {hashtags && hashtags.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleCopyHashtags}>
            {hashtagsCopied ? (
              <Check className="size-4 mr-1.5 text-green-400" />
            ) : (
              <Hash className="size-4 mr-1.5" />
            )}
            {hashtagsCopied ? "Copiado!" : "Copiar Hashtags"}
          </Button>
        )}
      </div>

      {/* Individual slide downloads */}
      {slideUrls.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {slideUrls.map(({ slideNumber, url }) => (
            <Button
              key={slideNumber}
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => handleDownloadSlide(url, slideNumber)}
            >
              <Download className="size-3 mr-1" />
              Slide {slideNumber}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
