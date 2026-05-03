"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Loader2, PenTool } from "lucide-react";
import type { TenantVisual } from "@/types/database";

const TIPOS = [
  { value: "aviso", label: "Aviso", desc: "Fechados, mudanca de horario, etc" },
  { value: "frase", label: "Frase", desc: "Frase impactante + autor" },
  { value: "promocao", label: "Promocao", desc: "Titulo + preco + CTA" },
  { value: "informacao", label: "Informacao", desc: "Dado ou novidade" },
  { value: "preco_servico", label: "Precos", desc: "Lista de servicos com valores" },
  { value: "horario", label: "Horarios", desc: "Grade de horarios" },
  { value: "personalizado", label: "Personalizado", desc: "Texto livre" },
];

const FORMATOS = [
  { value: "4:5", label: "4:5 (Feed)" },
  { value: "1:1", label: "1:1 (Quadrado)" },
  { value: "9:16", label: "9:16 (Story)" },
];

interface ModoCreateProps {
  tenantId: string;
  visual: TenantVisual | null;
}

export function ModoCreate({ tenantId, visual }: ModoCreateProps) {
  const [tipo, setTipo] = useState("frase");
  const [formato, setFormato] = useState("4:5");
  const [fields, setFields] = useState({
    titulo: "",
    subtitulo: "",
    texto: "",
    autor: "",
    preco: "",
    cta: "",
  });
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState("");

  function updateField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate() {
    setProcessing(true);
    try {
      const res = await fetch("/api/studio/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          tipo,
          formato,
          data: fields,
        }),
      });

      const data = await res.json();
      if (data.output_url) {
        setOutputUrl(data.output_url);
        toast.success("Imagem criada");
      } else {
        toast.error(data.error || "Erro ao criar");
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
      filename: `studio_create_${Date.now()}.png`,
      storage_path: outputUrl.split("/storage/v1/object/public/")[1] ?? outputUrl,
      public_url: outputUrl,
      categoria: "studio",
    });
    toast.success("Salvo no banco de midia");
  }

  const aspectRatio = formato === "9:16" ? "9/16" : formato === "1:1" ? "1/1" : "4/5";

  return (
    <div className="space-y-6 pt-4">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Preview */}
        <Card>
          <CardContent className="p-4">
            <div
              className="relative rounded-lg overflow-hidden mx-auto flex flex-col items-center justify-center"
              style={{
                aspectRatio,
                maxWidth: formato === "9:16" ? "270px" : "400px",
                backgroundColor: visual?.cor_fundo ?? "#0a0a0a",
              }}
            >
              {outputUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={outputUrl} alt="Output" className="w-full h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
                  {tipo === "frase" && (
                    <>
                      <span
                        style={{
                          color: visual?.cor_texto ?? "#fff",
                          fontFamily: visual?.fonte_headline ?? "Inter",
                          fontWeight: visual?.fonte_headline_peso ?? 800,
                          fontSize: "18px",
                          lineHeight: 1.3,
                        }}
                      >
                        {fields.texto || "Sua frase aqui..."}
                      </span>
                      {fields.autor && (
                        <span
                          style={{
                            color: visual?.cor_acento ?? "#FF4103",
                            fontSize: "11px",
                          }}
                        >
                          — {fields.autor}
                        </span>
                      )}
                    </>
                  )}
                  {tipo === "aviso" && (
                    <>
                      <span
                        style={{
                          color: visual?.cor_acento ?? "#FF4103",
                          fontFamily: visual?.fonte_headline ?? "Inter",
                          fontWeight: 900,
                          fontSize: "14px",
                          textTransform: "uppercase",
                          letterSpacing: "2px",
                        }}
                      >
                        AVISO
                      </span>
                      <span
                        style={{
                          color: visual?.cor_texto ?? "#fff",
                          fontFamily: visual?.fonte_headline ?? "Inter",
                          fontWeight: 800,
                          fontSize: "20px",
                          lineHeight: 1.2,
                        }}
                      >
                        {fields.titulo || "Titulo do aviso"}
                      </span>
                      <span
                        style={{
                          color: visual?.cor_texto ?? "#fff",
                          opacity: 0.7,
                          fontSize: "11px",
                        }}
                      >
                        {fields.subtitulo || "Detalhes..."}
                      </span>
                    </>
                  )}
                  {tipo === "promocao" && (
                    <>
                      <span
                        style={{
                          color: visual?.cor_texto ?? "#fff",
                          fontFamily: visual?.fonte_headline ?? "Inter",
                          fontWeight: 800,
                          fontSize: "18px",
                        }}
                      >
                        {fields.titulo || "Nome da Promo"}
                      </span>
                      <span
                        style={{
                          color: visual?.cor_acento ?? "#FF4103",
                          fontSize: "28px",
                          fontWeight: 900,
                        }}
                      >
                        {fields.preco || "R$ --"}
                      </span>
                      <span
                        style={{
                          color: visual?.cor_texto ?? "#fff",
                          opacity: 0.6,
                          fontSize: "10px",
                        }}
                      >
                        {fields.subtitulo}
                      </span>
                      {fields.cta && (
                        <div
                          className="rounded-full px-4 py-1.5 mt-2"
                          style={{
                            backgroundColor: visual?.cor_acento ?? "#FF4103",
                            color: visual?.cor_fundo ?? "#0a0a0a",
                            fontSize: "10px",
                            fontWeight: 700,
                          }}
                        >
                          {fields.cta}
                        </div>
                      )}
                    </>
                  )}
                  {!["frase", "aviso", "promocao"].includes(tipo) && (
                    <>
                      <PenTool className="size-8" style={{ color: visual?.cor_acento ?? "#FF4103" }} />
                      <span
                        style={{
                          color: visual?.cor_texto ?? "#fff",
                          fontFamily: visual?.fonte_headline ?? "Inter",
                          fontWeight: 800,
                          fontSize: "16px",
                        }}
                      >
                        {fields.titulo || "Titulo"}
                      </span>
                      <span
                        style={{
                          color: visual?.cor_texto ?? "#fff",
                          opacity: 0.7,
                          fontSize: "11px",
                          lineHeight: 1.4,
                        }}
                      >
                        {fields.texto || fields.subtitulo || "Conteudo..."}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="space-y-4">
          {/* Type */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-1.5">
                {TIPOS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTipo(t.value)}
                    className={`rounded-lg border p-2 text-left transition-all ${
                      tipo === t.value
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    <span className="text-xs font-medium">{t.label}</span>
                    <p className="text-[9px] text-muted-foreground">{t.desc}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Format */}
          <Card>
            <CardContent className="pt-4">
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

          {/* Fields */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Conteudo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Titulo</Label>
                <Input
                  value={fields.titulo}
                  onChange={(e) => updateField("titulo", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Subtitulo</Label>
                <Input
                  value={fields.subtitulo}
                  onChange={(e) => updateField("subtitulo", e.target.value)}
                />
              </div>
              {(tipo === "frase" || tipo === "personalizado") && (
                <div className="space-y-1">
                  <Label className="text-xs">Texto</Label>
                  <Textarea
                    value={fields.texto}
                    onChange={(e) => updateField("texto", e.target.value)}
                    rows={3}
                  />
                </div>
              )}
              {tipo === "frase" && (
                <div className="space-y-1">
                  <Label className="text-xs">Autor</Label>
                  <Input
                    value={fields.autor}
                    onChange={(e) => updateField("autor", e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              )}
              {tipo === "promocao" && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Preco</Label>
                    <Input
                      value={fields.preco}
                      onChange={(e) => updateField("preco", e.target.value)}
                      placeholder="R$ 49,90"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">CTA</Label>
                    <Input
                      value={fields.cta}
                      onChange={(e) => updateField("cta", e.target.value)}
                      placeholder="Agende agora"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white"
              onClick={handleCreate}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="size-4 animate-spin mr-1" />
              ) : (
                <PenTool className="size-4 mr-1" />
              )}
              Gerar Imagem
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
