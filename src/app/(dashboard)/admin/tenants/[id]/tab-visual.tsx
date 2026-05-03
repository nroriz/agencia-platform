"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Palette, Upload } from "lucide-react";
import type { TenantVisual } from "@/types/database";

interface TabVisualProps {
  tenantId: string;
  initialData: TenantVisual | null;
  tenantNome: string;
}

const FONT_OPTIONS = [
  "Inter", "Poppins", "Montserrat", "Roboto", "Oswald",
  "Bebas Neue", "Playfair Display", "Lora", "Raleway", "Open Sans",
  "Space Grotesk", "DM Sans", "Sora", "Outfit", "Manrope",
];

export function TabVisual({ tenantId, initialData, tenantNome }: TabVisualProps) {
  const [form, setForm] = useState({
    cor_fundo: initialData?.cor_fundo ?? "#0a0a0a",
    cor_acento: initialData?.cor_acento ?? "#FF4103",
    cor_texto: initialData?.cor_texto ?? "#ffffff",
    fonte_headline: initialData?.fonte_headline ?? "Inter",
    fonte_headline_peso: initialData?.fonte_headline_peso ?? 800,
    fonte_numero: initialData?.fonte_numero ?? "Inter",
    fonte_corpo: initialData?.fonte_corpo ?? "Inter",
    fonte_label: initialData?.fonte_label ?? "Inter",
    estilo_imagem: initialData?.estilo_imagem ?? "",
    header_esquerda_a: initialData?.header_esquerda_a ?? "",
    header_esquerda_b: initialData?.header_esquerda_b ?? "",
    header_direita: initialData?.header_direita ?? "",
    tag_marca: initialData?.tag_marca ?? "",
    logo_url: initialData?.logo_url ?? "",
    avatar_url: initialData?.avatar_url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "avatar" | null>(null);

  function update(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleUpload(type: "logo" | "avatar") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setUploading(type);
      const supabase = createClient();
      const path = `${tenantId}/${type}_${Date.now()}.${file.name.split(".").pop()}`;

      const { error: uploadError } = await supabase.storage
        .from("tenant-assets")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        toast.error("Erro no upload: " + uploadError.message);
        setUploading(null);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("tenant-assets")
        .getPublicUrl(path);

      update(type === "logo" ? "logo_url" : "avatar_url", publicUrl);
      setUploading(null);
      toast.success(`${type === "logo" ? "Logo" : "Avatar"} enviado`);
    };
    input.click();
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    const payload = {
      tenant_id: tenantId,
      cor_fundo: form.cor_fundo,
      cor_acento: form.cor_acento,
      cor_texto: form.cor_texto,
      fonte_headline: form.fonte_headline,
      fonte_headline_peso: form.fonte_headline_peso,
      fonte_numero: form.fonte_numero,
      fonte_corpo: form.fonte_corpo,
      fonte_label: form.fonte_label,
      estilo_imagem: form.estilo_imagem,
      header_esquerda_a: form.header_esquerda_a || null,
      header_esquerda_b: form.header_esquerda_b || null,
      header_direita: form.header_direita || null,
      tag_marca: form.tag_marca || null,
      logo_url: form.logo_url || null,
      avatar_url: form.avatar_url || null,
    };

    let error;
    if (initialData) {
      ({ error } = await supabase
        .from("tenant_visual")
        .update(payload)
        .eq("tenant_id", tenantId));
    } else {
      ({ error } = await supabase.from("tenant_visual").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Visual salvo");
    }
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Form Side */}
        <div className="space-y-6">
          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="size-4 text-muted-foreground" />
                Cores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Fundo</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={form.cor_fundo}
                      onChange={(e) => update("cor_fundo", e.target.value)}
                      className="size-8 rounded cursor-pointer border border-border"
                    />
                    <Input
                      value={form.cor_fundo}
                      onChange={(e) => update("cor_fundo", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Acento</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={form.cor_acento}
                      onChange={(e) => update("cor_acento", e.target.value)}
                      className="size-8 rounded cursor-pointer border border-border"
                    />
                    <Input
                      value={form.cor_acento}
                      onChange={(e) => update("cor_acento", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Texto</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={form.cor_texto}
                      onChange={(e) => update("cor_texto", e.target.value)}
                      className="size-8 rounded cursor-pointer border border-border"
                    />
                    <Input
                      value={form.cor_texto}
                      onChange={(e) => update("cor_texto", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fonts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fontes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <select
                    value={form.fonte_headline}
                    onChange={(e) => update("fonte_headline", e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Peso Headline</Label>
                  <Input
                    type="number"
                    min={100}
                    max={900}
                    step={100}
                    value={form.fonte_headline_peso}
                    onChange={(e) => update("fonte_headline_peso", parseInt(e.target.value) || 800)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Numeros</Label>
                  <select
                    value={form.fonte_numero}
                    onChange={(e) => update("fonte_numero", e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Corpo</Label>
                  <select
                    value={form.fonte_corpo}
                    onChange={(e) => update("fonte_corpo", e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Label</Label>
                  <select
                    value={form.fonte_label}
                    onChange={(e) => update("fonte_label", e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Header & Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Header & Branding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Header Esquerda A</Label>
                  <Input
                    value={form.header_esquerda_a}
                    onChange={(e) => update("header_esquerda_a", e.target.value)}
                    placeholder="ex: @handle"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Header Esquerda B</Label>
                  <Input
                    value={form.header_esquerda_b}
                    onChange={(e) => update("header_esquerda_b", e.target.value)}
                    placeholder="ex: Nome da Marca"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Header Direita</Label>
                  <Input
                    value={form.header_direita}
                    onChange={(e) => update("header_direita", e.target.value)}
                    placeholder="ex: Salve para depois"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tag da Marca</Label>
                  <Input
                    value={form.tag_marca}
                    onChange={(e) => update("tag_marca", e.target.value)}
                    placeholder="ex: @handle"
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label>Estilo de Imagem</Label>
                <Input
                  value={form.estilo_imagem}
                  onChange={(e) => update("estilo_imagem", e.target.value)}
                  placeholder="ex: fotografia profissional, iluminacao quente"
                />
              </div>
            </CardContent>
          </Card>

          {/* Logo & Avatar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Logo & Avatar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <Label>Logo</Label>
                  {form.logo_url && (
                    <div className="size-20 rounded-lg border border-border overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpload("logo")}
                    disabled={uploading === "logo"}
                  >
                    {uploading === "logo" ? (
                      <Loader2 className="size-4 animate-spin mr-1" />
                    ) : (
                      <Upload className="size-4 mr-1" />
                    )}
                    Upload Logo
                  </Button>
                </div>
                <div className="space-y-3">
                  <Label>Avatar</Label>
                  {form.avatar_url && (
                    <div className="size-20 rounded-full border border-border overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpload("avatar")}
                    disabled={uploading === "avatar"}
                  >
                    {uploading === "avatar" ? (
                      <Loader2 className="size-4 animate-spin mr-1" />
                    ) : (
                      <Upload className="size-4 mr-1" />
                    )}
                    Upload Avatar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Side */}
        <div className="lg:sticky lg:top-4 self-start">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-lg overflow-hidden aspect-square relative"
                style={{ backgroundColor: form.cor_fundo }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between px-3 py-2"
                  style={{ borderBottom: `2px solid ${form.cor_acento}` }}
                >
                  <div className="flex items-center gap-2">
                    {form.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.avatar_url}
                        alt=""
                        className="size-5 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="size-5 rounded-full"
                        style={{ backgroundColor: form.cor_acento }}
                      />
                    )}
                    <span
                      style={{
                        color: form.cor_texto,
                        fontFamily: form.fonte_label,
                        fontSize: "8px",
                        opacity: 0.7,
                      }}
                    >
                      {form.header_esquerda_a || "@handle"}
                    </span>
                  </div>
                  <span
                    style={{
                      color: form.cor_texto,
                      fontFamily: form.fonte_label,
                      fontSize: "7px",
                      opacity: 0.5,
                    }}
                  >
                    {form.header_direita || "Salve"}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-col items-center justify-center p-4 pt-6 gap-3">
                  <span
                    style={{
                      color: form.cor_acento,
                      fontFamily: form.fonte_numero,
                      fontSize: "32px",
                      fontWeight: 900,
                      lineHeight: 1,
                    }}
                  >
                    01
                  </span>
                  <span
                    style={{
                      color: form.cor_texto,
                      fontFamily: form.fonte_headline,
                      fontWeight: form.fonte_headline_peso,
                      fontSize: "14px",
                      textAlign: "center",
                      lineHeight: 1.2,
                    }}
                  >
                    Titulo Exemplo
                  </span>
                  <span
                    style={{
                      color: form.cor_texto,
                      fontFamily: form.fonte_corpo,
                      fontSize: "9px",
                      textAlign: "center",
                      opacity: 0.7,
                      lineHeight: 1.4,
                      maxWidth: "80%",
                    }}
                  >
                    Este e um texto de corpo para visualizar como ficara o carrossel com as configuracoes atuais.
                  </span>
                </div>

                {/* Tag */}
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <span
                    style={{
                      color: form.cor_acento,
                      fontFamily: form.fonte_label,
                      fontSize: "7px",
                    }}
                  >
                    {form.tag_marca || tenantNome}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Save className="size-4 mr-2" />
          )}
          Salvar Visual
        </Button>
      </div>
    </div>
  );
}
