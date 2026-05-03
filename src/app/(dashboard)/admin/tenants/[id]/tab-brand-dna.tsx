"use client";

import { useState, type KeyboardEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Save,
  Loader2,
  Palette,
  Type,
  BookOpen,
  Camera,
  Sparkles,
  Fingerprint,
  X,
  Plus,
} from "lucide-react";
import type { TenantBrandDNA, BrandDNAData } from "@/types/database";

interface TabBrandDNAProps {
  tenantId: string;
  initialData: TenantBrandDNA | null;
  tenantHandle: string;
}

const FONT_OPTIONS = [
  "Inter", "Poppins", "Montserrat", "Roboto", "Oswald",
  "Bebas Neue", "Playfair Display", "Lora", "Raleway", "Open Sans",
  "Space Grotesk", "DM Sans", "Sora", "Outfit", "Manrope",
  "Unbounded", "JetBrains Mono", "Source Serif 4", "Permanent Marker",
];

const LIGHTING_OPTIONS = [
  { value: "cinematic-dark", label: "Cinematic Dark" },
  { value: "bright-studio", label: "Bright Studio" },
  { value: "warm-natural", label: "Warm Natural" },
  { value: "soft-diffused", label: "Soft Diffused" },
  { value: "high-contrast", label: "High Contrast" },
] as const;

const GRADIENT_OPTIONS = [
  { value: "to-top", label: "Para cima" },
  { value: "to-bottom", label: "Para baixo" },
  { value: "radial", label: "Radial" },
  { value: "none", label: "Nenhum" },
] as const;

const DENSIDADE_OPTIONS = [
  { value: "alta", label: "Alta" },
  { value: "media", label: "Media" },
  { value: "baixa", label: "Baixa" },
] as const;

const SLIDE_TYPES = [
  "capa_imagem", "texto_gigante", "dado_imagem", "dado_texto",
  "conteudo_imagem", "lista", "pergunta", "citacao",
  "cta_imagem", "transicao", "comparativo",
];

const DEFAULT_DNA: BrandDNAData = {
  paleta: {
    fundo: "#0A0A0A",
    acento: "#FF4103",
    texto: "#FFFFFF",
    texto_dim: "#7A8B9A",
    offwhite: "#E8ECF0",
    card: "#0D1820",
    border: "#1A2D3D",
    footer: "#050505",
    alerta: "#E81224",
    corpo: "#E8ECF0",
  },
  tipografia: {
    headline: { family: "Unbounded", weight: 900 },
    sub_headline: { family: "Sora", weight: 700 },
    corpo: { family: "Inter", weight: 400 },
    numero: { family: "JetBrains Mono", weight: 700 },
    label: { family: "Inter", weight: 400 },
    citacao: { family: "Source Serif 4", weight: 700 },
    alerta: { family: "Permanent Marker", weight: 400 },
  },
  editorial_rules: {
    tom: "",
    palavras_proibidas: [],
    expressoes_tipicas: [],
    densidade: "alta",
    tipos_slide_preferidos: [],
    tipos_slide_evitar: [],
    max_slides_com_foto: 5,
  },
  photo_style: {
    anchor_prompt: "",
    lighting: "cinematic-dark",
    dominance: 0.7,
  },
  decorative: {
    grain: true,
    shapes: false,
    gradient_style: "to-bottom",
  },
  branding: {
    handle: "",
    slogan: "",
    logo_opacity: 0.8,
  },
};

const PALETA_FIELDS: Array<{ key: keyof BrandDNAData["paleta"]; label: string }> = [
  { key: "fundo", label: "Fundo (60%)" },
  { key: "acento", label: "Acento (10%)" },
  { key: "texto", label: "Texto" },
  { key: "texto_dim", label: "Texto Dim" },
  { key: "offwhite", label: "Off-white" },
  { key: "card", label: "Card" },
  { key: "border", label: "Border" },
  { key: "footer", label: "Footer" },
  { key: "alerta", label: "Alerta" },
  { key: "corpo", label: "Corpo" },
];

const FONT_ROLES: Array<{ key: keyof BrandDNAData["tipografia"]; label: string }> = [
  { key: "headline", label: "Headline" },
  { key: "sub_headline", label: "Sub-headline" },
  { key: "corpo", label: "Corpo" },
  { key: "numero", label: "Numeros" },
  { key: "label", label: "Label" },
  { key: "citacao", label: "Citacao" },
  { key: "alerta", label: "Alerta" },
];

export function TabBrandDNA({ tenantId, initialData, tenantHandle }: TabBrandDNAProps) {
  const initial = initialData?.dna ?? { ...DEFAULT_DNA, branding: { ...DEFAULT_DNA.branding, handle: `@${tenantHandle}` } };
  const [dna, setDna] = useState<BrandDNAData>(initial);
  const [archetype, setArchetype] = useState(initialData?.archetype ?? "editorial-dark");
  const [saving, setSaving] = useState(false);

  // Chip input states
  const [newPalavra, setNewPalavra] = useState("");
  const [newExpressao, setNewExpressao] = useState("");
  const [newSlidePreferido, setNewSlidePreferido] = useState("");
  const [newSlideEvitar, setNewSlideEvitar] = useState("");

  // --- Updaters ---

  function updatePaleta(key: keyof BrandDNAData["paleta"], value: string) {
    setDna((prev) => ({ ...prev, paleta: { ...prev.paleta, [key]: value } }));
  }

  function updateFont(key: keyof BrandDNAData["tipografia"], field: "family" | "weight", value: string | number) {
    setDna((prev) => ({
      ...prev,
      tipografia: {
        ...prev.tipografia,
        [key]: { ...prev.tipografia[key], [field]: value },
      },
    }));
  }

  function updateEditorial<K extends keyof BrandDNAData["editorial_rules"]>(key: K, value: BrandDNAData["editorial_rules"][K]) {
    setDna((prev) => ({ ...prev, editorial_rules: { ...prev.editorial_rules, [key]: value } }));
  }

  function updatePhotoStyle<K extends keyof BrandDNAData["photo_style"]>(key: K, value: BrandDNAData["photo_style"][K]) {
    setDna((prev) => ({ ...prev, photo_style: { ...prev.photo_style, [key]: value } }));
  }

  function updateDecorative<K extends keyof BrandDNAData["decorative"]>(key: K, value: BrandDNAData["decorative"][K]) {
    setDna((prev) => ({ ...prev, decorative: { ...prev.decorative, [key]: value } }));
  }

  function updateBranding<K extends keyof BrandDNAData["branding"]>(key: K, value: BrandDNAData["branding"][K]) {
    setDna((prev) => ({ ...prev, branding: { ...prev.branding, [key]: value } }));
  }

  // --- Chip helpers ---

  function addChip(
    value: string,
    listKey: "palavras_proibidas" | "expressoes_tipicas" | "tipos_slide_preferidos" | "tipos_slide_evitar",
    inputSetter: React.Dispatch<React.SetStateAction<string>>
  ) {
    const trimmed = value.trim();
    if (!trimmed) return;
    updateEditorial(listKey, [...dna.editorial_rules[listKey], trimmed]);
    inputSetter("");
  }

  function removeChip(
    index: number,
    listKey: "palavras_proibidas" | "expressoes_tipicas" | "tipos_slide_preferidos" | "tipos_slide_evitar"
  ) {
    updateEditorial(listKey, dna.editorial_rules[listKey].filter((_, i) => i !== index));
  }

  function handleChipKeyDown(
    e: KeyboardEvent<HTMLInputElement>,
    value: string,
    listKey: "palavras_proibidas" | "expressoes_tipicas" | "tipos_slide_preferidos" | "tipos_slide_evitar",
    inputSetter: React.Dispatch<React.SetStateAction<string>>
  ) {
    if (e.key === "Enter") {
      e.preventDefault();
      addChip(value, listKey, inputSetter);
    }
  }

  // --- Save ---

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    const payload = {
      tenant_id: tenantId,
      dna: dna as unknown as Record<string, unknown>,
      archetype,
      source: "manual",
      confidence: 1.0,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (initialData) {
      ({ error } = await supabase
        .from("tenant_brand_dna")
        .update(payload)
        .eq("tenant_id", tenantId));
    } else {
      ({ error } = await supabase.from("tenant_brand_dna").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Brand DNA salvo");
    }
  }

  // --- Render ---

  return (
    <div className="space-y-6 pt-4">
      {/* Archetype selector */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium">Arquetipo</Label>
        <select
          value={archetype}
          onChange={(e) => setArchetype(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="editorial-dark">Editorial Dark</option>
          <option value="corporate-clean">Corporate Clean</option>
          <option value="retail-vibrant">Retail Vibrant</option>
          <option value="food-warm">Food Warm</option>
          <option value="tech-dark">Tech Dark</option>
          <option value="soft-feminine">Soft Feminine</option>
        </select>
      </div>

      {/* 1. Paleta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="size-4 text-muted-foreground" />
            Paleta (10 roles)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {PALETA_FIELDS.map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <div className="flex gap-1.5 items-center">
                  <input
                    type="color"
                    value={dna.paleta[key]}
                    onChange={(e) => updatePaleta(key, e.target.value)}
                    className="size-7 rounded cursor-pointer border border-border"
                  />
                  <Input
                    value={dna.paleta[key]}
                    onChange={(e) => updatePaleta(key, e.target.value)}
                    className="flex-1 text-xs h-7"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2. Tipografia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Type className="size-4 text-muted-foreground" />
            Tipografia (7 roles)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FONT_ROLES.map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs font-medium">{label}</Label>
                <div className="flex gap-2">
                  <select
                    value={dna.tipografia[key].family}
                    onChange={(e) => updateFont(key, "family", e.target.value)}
                    className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2 text-sm"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={100}
                    max={900}
                    step={100}
                    value={dna.tipografia[key].weight}
                    onChange={(e) => updateFont(key, "weight", parseInt(e.target.value) || 400)}
                    className="w-20 h-8 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3. Regras Editoriais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="size-4 text-muted-foreground" />
            Regras Editoriais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Tom */}
          <div className="space-y-1.5">
            <Label>Tom de Voz</Label>
            <Textarea
              value={dna.editorial_rules.tom}
              onChange={(e) => updateEditorial("tom", e.target.value)}
              placeholder="Direto, verdade na cara, dados concretos..."
              rows={2}
            />
          </div>

          {/* Densidade + Max fotos */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Densidade de texto</Label>
              <select
                value={dna.editorial_rules.densidade}
                onChange={(e) => updateEditorial("densidade", e.target.value as "alta" | "media" | "baixa")}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                {DENSIDADE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Max slides com foto</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={dna.editorial_rules.max_slides_com_foto}
                onChange={(e) => updateEditorial("max_slides_com_foto", parseInt(e.target.value) || 5)}
              />
            </div>
          </div>

          {/* Palavras Proibidas */}
          <div className="space-y-2">
            <Label>Palavras Proibidas</Label>
            <div className="flex flex-wrap gap-1.5">
              {dna.editorial_rules.palavras_proibidas.map((p, i) => (
                <Badge
                  key={i}
                  variant="destructive"
                  className="gap-1 cursor-pointer text-xs"
                  onClick={() => removeChip(i, "palavras_proibidas")}
                >
                  {p}
                  <X className="size-3" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newPalavra}
                onChange={(e) => setNewPalavra(e.target.value)}
                onKeyDown={(e) => handleChipKeyDown(e, newPalavra, "palavras_proibidas", setNewPalavra)}
                placeholder="Digite e pressione Enter"
                className="h-8"
              />
              <Button variant="outline" size="sm" onClick={() => addChip(newPalavra, "palavras_proibidas", setNewPalavra)}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Expressoes Tipicas */}
          <div className="space-y-2">
            <Label>Expressoes Tipicas</Label>
            <div className="flex flex-wrap gap-1.5">
              {dna.editorial_rules.expressoes_tipicas.map((e, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="gap-1 cursor-pointer text-xs"
                  onClick={() => removeChip(i, "expressoes_tipicas")}
                >
                  {e}
                  <X className="size-3" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newExpressao}
                onChange={(e) => setNewExpressao(e.target.value)}
                onKeyDown={(e) => handleChipKeyDown(e, newExpressao, "expressoes_tipicas", setNewExpressao)}
                placeholder="Digite e pressione Enter"
                className="h-8"
              />
              <Button variant="outline" size="sm" onClick={() => addChip(newExpressao, "expressoes_tipicas", setNewExpressao)}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Tipos Slide Preferidos */}
          <div className="space-y-2">
            <Label>Tipos de Slide Preferidos</Label>
            <div className="flex flex-wrap gap-1.5">
              {dna.editorial_rules.tipos_slide_preferidos.map((s, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="gap-1 cursor-pointer text-xs"
                  onClick={() => removeChip(i, "tipos_slide_preferidos")}
                >
                  {s}
                  <X className="size-3" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <select
                value={newSlidePreferido}
                onChange={(e) => setNewSlidePreferido(e.target.value)}
                className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">Selecionar tipo...</option>
                {SLIDE_TYPES.filter((t) => !dna.editorial_rules.tipos_slide_preferidos.includes(t)).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (newSlidePreferido) {
                    addChip(newSlidePreferido, "tipos_slide_preferidos", setNewSlidePreferido);
                  }
                }}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Tipos Slide Evitar */}
          <div className="space-y-2">
            <Label>Tipos de Slide a Evitar</Label>
            <div className="flex flex-wrap gap-1.5">
              {dna.editorial_rules.tipos_slide_evitar.map((s, i) => (
                <Badge
                  key={i}
                  variant="destructive"
                  className="gap-1 cursor-pointer text-xs"
                  onClick={() => removeChip(i, "tipos_slide_evitar")}
                >
                  {s}
                  <X className="size-3" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <select
                value={newSlideEvitar}
                onChange={(e) => setNewSlideEvitar(e.target.value)}
                className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">Selecionar tipo...</option>
                {SLIDE_TYPES.filter((t) => !dna.editorial_rules.tipos_slide_evitar.includes(t)).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (newSlideEvitar) {
                    addChip(newSlideEvitar, "tipos_slide_evitar", setNewSlideEvitar);
                  }
                }}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Estilo Fotografico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="size-4 text-muted-foreground" />
            Estilo Fotografico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Anchor Prompt (Gemini)</Label>
            <Textarea
              value={dna.photo_style.anchor_prompt}
              onChange={(e) => updatePhotoStyle("anchor_prompt", e.target.value)}
              placeholder="Cinematic editorial photograph, dark moody lighting..."
              rows={3}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Iluminacao</Label>
              <select
                value={dna.photo_style.lighting}
                onChange={(e) => updatePhotoStyle("lighting", e.target.value as BrandDNAData["photo_style"]["lighting"])}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                {LIGHTING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Dominancia da foto ({Math.round(dna.photo_style.dominance * 100)}%)</Label>
              <Input
                type="range"
                min={0.2}
                max={1.0}
                step={0.05}
                value={dna.photo_style.dominance}
                onChange={(e) => updatePhotoStyle("dominance", parseFloat(e.target.value))}
                className="h-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Decorativos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" />
            Elementos Decorativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="text-sm">Grain (textura)</Label>
              <Switch
                checked={dna.decorative.grain}
                onCheckedChange={(v) => updateDecorative("grain", v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="text-sm">Shapes</Label>
              <Switch
                checked={dna.decorative.shapes}
                onCheckedChange={(v) => updateDecorative("shapes", v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Gradiente</Label>
              <select
                value={dna.decorative.gradient_style}
                onChange={(e) => updateDecorative("gradient_style", e.target.value as BrandDNAData["decorative"]["gradient_style"])}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                {GRADIENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Fingerprint className="size-4 text-muted-foreground" />
            Branding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Handle</Label>
              <Input
                value={dna.branding.handle}
                onChange={(e) => updateBranding("handle", e.target.value)}
                placeholder="@handle"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slogan</Label>
              <Input
                value={dna.branding.slogan}
                onChange={(e) => updateBranding("slogan", e.target.value)}
                placeholder="Gestao & Estrategia para Barbearias"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Opacidade do Logo ({Math.round((dna.branding.logo_opacity ?? 0.8) * 100)}%)</Label>
              <Input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={dna.branding.logo_opacity ?? 0.8}
                onChange={(e) => updateBranding("logo_opacity", parseFloat(e.target.value))}
                className="h-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Save className="size-4 mr-2" />
          )}
          Salvar Brand DNA
        </Button>
      </div>
    </div>
  );
}
