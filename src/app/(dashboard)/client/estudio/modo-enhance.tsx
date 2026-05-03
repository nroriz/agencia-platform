"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Download, Save, Loader2, Wand2 } from "lucide-react";
import type { TenantVisual } from "@/types/database";

interface ModoEnhanceProps {
  tenantId: string;
  visual: TenantVisual | null;
  mediaUrls: string[];
}

export function ModoEnhance({ tenantId, visual, mediaUrls }: ModoEnhanceProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
  });
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${tenantId}/studio/input_${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("studio-outputs")
      .upload(path, file);

    if (error) {
      toast.error("Erro no upload: " + error.message);
      return;
    }

    const { data } = supabase.storage.from("studio-outputs").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setOutputUrl("");
  }

  function selectFromMedia(url: string) {
    setImageUrl(url);
    setOutputUrl("");
  }

  async function handleEnhance() {
    if (!imageUrl) {
      toast.error("Selecione uma imagem primeiro");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/studio/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          image_url: imageUrl,
          adjustments: {
            brightness: adjustments.brightness / 100,
            contrast: adjustments.contrast / 100,
            saturation: adjustments.saturation / 100,
          },
        }),
      });

      const data = await res.json();
      if (data.output_url) {
        setOutputUrl(data.output_url);
        toast.success("Imagem processada");
      } else {
        toast.error(data.error || "Erro ao processar");
      }
    } catch {
      toast.error("Erro de conexao");
    }
    setProcessing(false);
  }

  async function saveToBank() {
    const url = outputUrl || imageUrl;
    if (!url) return;

    const supabase = createClient();
    const { error } = await supabase.from("tenant_media").insert({
      tenant_id: tenantId,
      filename: `studio_enhance_${Date.now()}.png`,
      storage_path: url.split("/storage/v1/object/public/")[1] ?? url,
      public_url: url,
      categoria: "studio",
    });

    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      toast.success("Salvo no banco de midia");
    }
  }

  const filterStyle = {
    filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)${adjustments.blur > 0 ? ` blur(${adjustments.blur}px)` : ""}`,
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Preview */}
        <Card>
          <CardContent className="p-4">
            {imageUrl ? (
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={outputUrl || imageUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  style={outputUrl ? {} : filterStyle}
                />
              </div>
            ) : (
              <div
                onClick={() => inputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-border transition-colors"
              >
                <Upload className="size-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Envie uma foto ou selecione do banco
                </p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="space-y-4">
          {/* Media selector */}
          {mediaUrls.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Banco de Fotos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto">
                  {mediaUrls.slice(0, 12).map((url, i) => (
                    <button
                      key={i}
                      onClick={() => selectFromMedia(url)}
                      className={`aspect-square rounded overflow-hidden border-2 transition-all ${
                        imageUrl === url ? "border-orange-500" : "border-transparent hover:border-border"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sliders */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Ajustes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "brightness", label: "Brilho", min: 50, max: 150 },
                { key: "contrast", label: "Contraste", min: 50, max: 150 },
                { key: "saturation", label: "Saturacao", min: 0, max: 200 },
              ].map((slider) => (
                <div key={slider.key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <Label>{slider.label}</Label>
                    <span className="text-muted-foreground">
                      {adjustments[slider.key as keyof typeof adjustments]}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    value={adjustments[slider.key as keyof typeof adjustments]}
                    onChange={(e) =>
                      setAdjustments((prev) => ({
                        ...prev,
                        [slider.key]: parseInt(e.target.value),
                      }))
                    }
                    className="w-full accent-orange-500"
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  setAdjustments({ brightness: 100, contrast: 100, saturation: 100, blur: 0 })
                }
              >
                Resetar
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white"
              onClick={handleEnhance}
              disabled={!imageUrl || processing}
            >
              {processing ? (
                <Loader2 className="size-4 animate-spin mr-1" />
              ) : (
                <Wand2 className="size-4 mr-1" />
              )}
              Processar
            </Button>

            {(outputUrl || imageUrl) && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={saveToBank}>
                  <Save className="size-4 mr-1" />
                  Salvar
                </Button>
                {outputUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(outputUrl, "_blank")}
                  >
                    <Download className="size-4 mr-1" />
                    Baixar
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
