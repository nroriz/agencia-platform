"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Save, Loader2, Layers } from "lucide-react";
import type { TenantVisual } from "@/types/database";

const TEMPLATES = [
  { value: "overlay_simples", label: "Overlay Simples", desc: "Foto + titulo + subtitulo" },
  { value: "overlay_centralizado", label: "Centralizado", desc: "Texto centralizado sobre foto" },
  { value: "moldura_marca", label: "Moldura Marca", desc: "Foto com bordas da marca" },
  { value: "badge", label: "Badge", desc: "Foto + badge no canto" },
];

const FORMATOS = [
  { value: "4:5", label: "4:5 (Feed)" },
  { value: "1:1", label: "1:1 (Quadrado)" },
  { value: "9:16", label: "9:16 (Story)" },
];

interface ModoComposeProps {
  tenantId: string;
  visual: TenantVisual | null;
  mediaUrls: string[];
}

export function ModoCompose({ tenantId, visual, mediaUrls }: ModoComposeProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [template, setTemplate] = useState("overlay_simples");
  const [formato, setFormato] = useState("4:5");
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${tenantId}/studio/compose_input_${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("studio-outputs")
      .upload(path, file);

    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }

    const { data } = supabase.storage.from("studio-outputs").getPublicUrl(path);
    setImageUrl(data.publicUrl);
  }

  async function handleCompose() {
    if (!imageUrl) {
      toast.error("Selecione uma imagem");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/studio/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          template,
          formato,
          image_url: imageUrl,
          data: { titulo, subtitulo, show_logo: true },
        }),
      });

      const data = await res.json();
      if (data.output_url) {
        setOutputUrl(data.output_url);
        toast.success("Composicao gerada");
      } else {
        toast.error(data.error || "Erro ao compor");
      }
    } catch {
      toast.error("Erro de conexao");
    }
    setProcessing(false);
  }

  async function saveToBank() {
    if (!outputUrl) return;
    const supabase = createClient();
    await supabase.from("tenant_media").insert({
      tenant_id: tenantId,
      filename: `studio_compose_${Date.now()}.png`,
      storage_path: outputUrl.split("/storage/v1/object/public/")[1] ?? outputUrl,
      public_url: outputUrl,
      categoria: "studio",
    });
    toast.success("Salvo no banco de midia");
  }

  // CSS-only preview
  const aspectRatio = formato === "9:16" ? "9/16" : formato === "1:1" ? "1/1" : "4/5";

  return (
    <div className="space-y-6 pt-4">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Preview */}
        <Card>
          <CardContent className="p-4">
            <div
              className="relative rounded-lg overflow-hidden mx-auto"
              style={{
                aspectRatio,
                maxWidth: formato === "9:16" ? "270px" : "400px",
                backgroundColor: visual?.cor_fundo ?? "#0a0a0a",
              }}
            >
              {imageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={outputUrl || imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  {!outputUrl && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                      {titulo && (
                        <h3
                          style={{
                            fontFamily: visual?.fonte_headline ?? "Inter",
                            fontWeight: visual?.fonte_headline_peso ?? 800,
                            color: visual?.cor_texto ?? "#fff",
                            fontSize: "20px",
                          }}
                        >
                          {titulo}
                        </h3>
                      )}
                      {subtitulo && (
                        <p
                          style={{
                            fontFamily: visual?.fonte_corpo ?? "Inter",
                            color: visual?.cor_texto ?? "#fff",
                            fontSize: "12px",
                            opacity: 0.8,
                            marginTop: "4px",
                          }}
                        >
                          {subtitulo}
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center cursor-pointer"
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload className="size-10 text-muted-foreground" />
                </div>
              )}
            </div>
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
          {/* Template */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1">
                <Layers className="size-4" />
                Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTemplate(t.value)}
                  className={`w-full rounded-lg border p-2.5 text-left transition-all ${
                    template === t.value
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-border/50 hover:border-border"
                  }`}
                >
                  <span className="text-sm font-medium">{t.label}</span>
                  <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Format */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Formato</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {FORMATOS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFormato(f.value)}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-xs transition-all ${
                      formato === f.value
                        ? "border-orange-500 bg-orange-500/10 text-orange-400"
                        : "border-border/50"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Text */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Texto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Titulo</Label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Titulo principal"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Subtitulo</Label>
                <Input
                  value={subtitulo}
                  onChange={(e) => setSubtitulo(e.target.value)}
                  placeholder="Texto complementar"
                />
              </div>
            </CardContent>
          </Card>

          {/* Media selector */}
          {mediaUrls.length > 0 && !imageUrl && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Banco</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto">
                  {mediaUrls.slice(0, 8).map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setImageUrl(url)}
                      className="aspect-square rounded overflow-hidden border-2 border-transparent hover:border-border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white"
              onClick={handleCompose}
              disabled={!imageUrl || processing}
            >
              {processing ? (
                <Loader2 className="size-4 animate-spin mr-1" />
              ) : (
                <Layers className="size-4 mr-1" />
              )}
              Gerar Composicao
            </Button>
            {outputUrl && (
              <Button variant="outline" className="w-full" onClick={saveToBank}>
                <Save className="size-4 mr-1" />
                Salvar no Banco
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
