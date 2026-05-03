"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import type { OnboardingData } from "./wizard";

const FONT_COMBOS = [
  { label: "Moderno", headline: "Plus Jakarta Sans", corpo: "DM Sans" },
  { label: "Classico", headline: "Montserrat", corpo: "Inter" },
  { label: "Impactante", headline: "Bebas Neue", corpo: "Space Grotesk" },
  { label: "Elegante", headline: "Playfair Display", corpo: "Lora" },
];

interface StepVisualProps {
  data: OnboardingData;
  updateData: (partial: Partial<OnboardingData>) => void;
}

export function StepVisual({ data, updateData }: StepVisualProps) {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function handleLogoUpload() {
    if (!data.tenant_id) {
      toast.error("Salve os dados da empresa primeiro (Passo 1)");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setUploading(true);
      const supabase = createClient();
      const path = `${data.tenant_id}/logo.${file.name.split(".").pop()}`;

      const { error: uploadError } = await supabase.storage
        .from("tenant-assets")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        toast.error("Erro no upload: " + uploadError.message);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("tenant-assets")
        .getPublicUrl(path);

      updateData({ logo_url: urlData.publicUrl });

      // Extract colors from logo
      extractColorsFromImage(file);
      setUploading(false);
      toast.success("Logo enviada");
    };
    input.click();
  }

  function extractColorsFromImage(file: File) {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = 100;
      canvas.height = 100;
      ctx.drawImage(img, 0, 0, 100, 100);

      const imageData = ctx.getImageData(0, 0, 100, 100).data;
      const colorMap = new Map<string, number>();

      for (let i = 0; i < imageData.length; i += 16) {
        const r = Math.round(imageData[i] / 32) * 32;
        const g = Math.round(imageData[i + 1] / 32) * 32;
        const b = Math.round(imageData[i + 2] / 32) * 32;
        const a = imageData[i + 3];
        if (a < 128) continue;

        const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
        colorMap.set(hex, (colorMap.get(hex) ?? 0) + 1);
      }

      const sorted = [...colorMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([color]) => color)
        .filter((c) => c !== "#000000" && c !== "#ffffff" && c !== "#e0e0e0");

      setExtractedColors(sorted.slice(0, 4));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  async function handleSave() {
    if (!data.tenant_id) {
      toast.error("Salve os dados da empresa primeiro (Passo 1)");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase.from("tenant_visual").upsert(
      {
        tenant_id: data.tenant_id,
        cor_fundo: data.cor_fundo,
        cor_acento: data.cor_acento,
        cor_texto: data.cor_texto,
        fonte_headline: data.fonte_headline,
        fonte_headline_peso: 800,
        fonte_numero: data.fonte_headline,
        fonte_corpo: data.fonte_corpo,
        fonte_label: data.fonte_corpo,
        estilo_imagem: "fotografia profissional",
        logo_url: data.logo_url || null,
      },
      { onConflict: "tenant_id" }
    );

    setSaving(false);
    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      setSaved(true);
      toast.success("Visual salvo");
    }
  }

  return (
    <div className="space-y-6">
      <canvas ref={canvasRef} className="hidden" />

      {/* Logo Upload */}
      <div className="space-y-3">
        <Label className="text-neutral-300">Logo</Label>
        <div className="flex items-center gap-4">
          {data.logo_url ? (
            <div className="size-20 rounded-xl border border-white/[0.08] overflow-hidden bg-white/[0.04]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.logo_url} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="size-20 rounded-xl border-2 border-dashed border-white/[0.1] flex items-center justify-center">
              <Upload className="size-6 text-neutral-600" />
            </div>
          )}
          <Button
            variant="outline"
            onClick={handleLogoUpload}
            disabled={uploading}
            className="border-white/[0.1] text-neutral-300"
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin mr-1" />
            ) : (
              <Upload className="size-4 mr-1" />
            )}
            {data.logo_url ? "Trocar Logo" : "Enviar Logo"}
          </Button>
        </div>

        {/* Extracted Colors */}
        {extractedColors.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-neutral-500">Cores detectadas na logo:</p>
            <div className="flex gap-2">
              {extractedColors.map((color) => (
                <button
                  key={color}
                  onClick={() => updateData({ cor_acento: color })}
                  className={`size-10 rounded-lg border-2 transition-all ${
                    data.cor_acento === color
                      ? "border-white scale-110"
                      : "border-transparent hover:border-white/50"
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Usar ${color} como acento`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <Label className="text-neutral-300">Cores</Label>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-neutral-500">Fundo</span>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={data.cor_fundo}
                onChange={(e) => updateData({ cor_fundo: e.target.value })}
                className="size-8 rounded cursor-pointer border border-white/[0.1]"
              />
              <Input
                value={data.cor_fundo}
                onChange={(e) => updateData({ cor_fundo: e.target.value })}
                className="flex-1 bg-white/[0.04] border-white/[0.08] text-white text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-neutral-500">Acento</span>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={data.cor_acento}
                onChange={(e) => updateData({ cor_acento: e.target.value })}
                className="size-8 rounded cursor-pointer border border-white/[0.1]"
              />
              <Input
                value={data.cor_acento}
                onChange={(e) => updateData({ cor_acento: e.target.value })}
                className="flex-1 bg-white/[0.04] border-white/[0.08] text-white text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-neutral-500">Texto</span>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={data.cor_texto}
                onChange={(e) => updateData({ cor_texto: e.target.value })}
                className="size-8 rounded cursor-pointer border border-white/[0.1]"
              />
              <Input
                value={data.cor_texto}
                onChange={(e) => updateData({ cor_texto: e.target.value })}
                className="flex-1 bg-white/[0.04] border-white/[0.08] text-white text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Font Combos */}
      <div className="space-y-3">
        <Label className="text-neutral-300">Fontes</Label>
        <div className="grid grid-cols-2 gap-3">
          {FONT_COMBOS.map((combo) => (
            <button
              key={combo.label}
              onClick={() =>
                updateData({
                  fonte_headline: combo.headline,
                  fonte_corpo: combo.corpo,
                })
              }
              className={`rounded-xl border p-4 text-left transition-all ${
                data.fonte_headline === combo.headline
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-white/[0.08] hover:border-white/[0.15]"
              }`}
            >
              <span className="text-xs text-neutral-500">{combo.label}</span>
              <p className="text-lg font-bold text-white mt-1" style={{ fontFamily: combo.headline }}>
                Titulo
              </p>
              <p className="text-sm text-neutral-400" style={{ fontFamily: combo.corpo }}>
                Texto do corpo
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <div className="space-y-2">
        <Label className="text-neutral-300">Preview</Label>
        <div className="flex justify-center">
          <div
            className="w-[270px] h-[337px] rounded-xl overflow-hidden relative"
            style={{ backgroundColor: data.cor_fundo }}
          >
            {/* Header bar */}
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{ borderBottom: `2px solid ${data.cor_acento}` }}
            >
              {data.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.logo_url} alt="" className="h-4 object-contain" />
              ) : (
                <div className="size-4 rounded-full" style={{ backgroundColor: data.cor_acento }} />
              )}
              <span style={{ color: data.cor_texto, fontSize: "8px", opacity: 0.5 }}>
                @{data.handle || "handle"}
              </span>
            </div>

            {/* Content */}
            <div className="flex flex-col items-center justify-center gap-3 p-6 pt-10">
              <span
                style={{
                  color: data.cor_acento,
                  fontFamily: data.fonte_headline,
                  fontSize: "36px",
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                01
              </span>
              <span
                style={{
                  color: data.cor_texto,
                  fontFamily: data.fonte_headline,
                  fontSize: "16px",
                  fontWeight: 800,
                  textAlign: "center",
                }}
              >
                Titulo do Slide
              </span>
              <span
                style={{
                  color: data.cor_texto,
                  fontFamily: data.fonte_corpo,
                  fontSize: "10px",
                  textAlign: "center",
                  opacity: 0.7,
                  lineHeight: 1.4,
                }}
              >
                Este e um exemplo de como seus carrosseis vao ficar com essas configuracoes.
              </span>
            </div>

            <div className="absolute bottom-3 left-0 right-0 text-center">
              <span style={{ color: data.cor_acento, fontSize: "7px" }}>
                {data.nome || "Sua Marca"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className={saved
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-gradient-to-r from-orange-500 to-red-600 text-white"
          }
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin mr-1" />
          ) : saved ? (
            <CheckCircle2 className="size-4 mr-1" />
          ) : null}
          {saved ? "Salvo" : "Salvar Visual"}
        </Button>
      </div>
    </div>
  );
}
