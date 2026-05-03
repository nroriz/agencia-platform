"use client";

import { useState, useRef, type DragEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Loader2,
  Trash2,
  Image as ImageIcon,
  Filter,
} from "lucide-react";

const CATEGORIAS = [
  { value: "all", label: "Todas" },
  { value: "ambiente", label: "Ambiente" },
  { value: "equipe", label: "Equipe" },
  { value: "produto", label: "Produto" },
  { value: "servico", label: "Servico" },
  { value: "detalhe", label: "Detalhe" },
  { value: "upload", label: "Upload" },
  { value: "studio", label: "Studio" },
];

const CATEGORIA_COLORS: Record<string, string> = {
  ambiente: "bg-blue-500/15 text-blue-400",
  equipe: "bg-green-500/15 text-green-400",
  produto: "bg-purple-500/15 text-purple-400",
  servico: "bg-orange-500/15 text-orange-400",
  detalhe: "bg-pink-500/15 text-pink-400",
  upload: "bg-neutral-500/15 text-neutral-400",
  studio: "bg-cyan-500/15 text-cyan-400",
};

export interface MediaItem {
  id: string;
  tenant_id: string;
  filename: string;
  storage_path: string;
  public_url: string;
  categoria: string;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  ai_description: string | null;
  created_at: string;
}

interface MediaLibraryProps {
  tenantId: string;
  initialData: MediaItem[];
  compact?: boolean;
}

export function MediaLibrary({
  tenantId,
  initialData,
  compact = false,
}: MediaLibraryProps) {
  const [items, setItems] = useState<MediaItem[]>(initialData);
  const [filter, setFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered =
    filter === "all"
      ? items
      : items.filter((m) => m.categoria === filter);

  const categoryCounts = items.reduce<Record<string, number>>((acc, m) => {
    acc[m.categoria] = (acc[m.categoria] ?? 0) + 1;
    return acc;
  }, {});

  async function uploadFiles(files: FileList | File[]) {
    const fileArr = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (fileArr.length === 0) return;

    setUploading(true);
    const supabase = createClient();

    for (const file of fileArr) {
      const ext = file.name.split(".").pop();
      const path = `${tenantId}/media/upload/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("tenant-assets")
        .upload(path, file);

      if (error) {
        toast.error(`Erro: ${file.name} — ${error.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("tenant-assets")
        .getPublicUrl(path);

      const { data: record, error: insertError } = await supabase
        .from("tenant_media")
        .insert({
          tenant_id: tenantId,
          filename: file.name,
          storage_path: path,
          public_url: urlData.publicUrl,
          categoria: "upload",
          mime_type: file.type,
          size_bytes: file.size,
        })
        .select()
        .single();

      if (insertError) {
        toast.error(`DB erro: ${insertError.message}`);
        continue;
      }

      setItems((prev) => [record as MediaItem, ...prev]);
    }

    setUploading(false);
    toast.success(`${fileArr.length} foto(s) enviada(s)`);
  }

  async function updateCategoria(id: string, categoria: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("tenant_media")
      .update({ categoria })
      .eq("id", id);

    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }

    setItems((prev) =>
      prev.map((m) => (m.id === id ? { ...m, categoria } : m))
    );
  }

  async function deleteItem(id: string, storagePath: string) {
    const supabase = createClient();
    await supabase.storage.from("tenant-assets").remove([storagePath]);
    const { error } = await supabase.from("tenant_media").delete().eq("id", id);

    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }

    setItems((prev) => prev.filter((m) => m.id !== id));
    toast.success("Foto removida");
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed cursor-pointer transition-all ${
          compact ? "p-6" : "p-10"
        } ${
          dragOver
            ? "border-orange-500 bg-orange-500/5"
            : "border-border/50 hover:border-border"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        <div className="text-center">
          {uploading ? (
            <Loader2 className="size-6 animate-spin text-orange-500 mx-auto" />
          ) : (
            <>
              <Upload className="size-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Arraste fotos ou clique para enviar
              </p>
            </>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="size-4 text-muted-foreground" />
        {CATEGORIAS.map((cat) => {
          const count =
            cat.value === "all"
              ? items.length
              : categoryCounts[cat.value] ?? 0;
          return (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              className={`rounded-full px-3 py-1 text-xs transition-all ${
                filter === cat.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma foto encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={`grid gap-3 ${
            compact ? "grid-cols-3 md:grid-cols-4" : "grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          }`}
        >
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-lg overflow-hidden aspect-square border border-border/50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.public_url}
                alt={item.filename}
                className="w-full h-full object-cover"
              />

              {/* Category badge */}
              <div className="absolute top-1.5 left-1.5">
                <select
                  value={item.categoria}
                  onChange={(e) => updateCategoria(item.id, e.target.value)}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium border-0 cursor-pointer ${
                    CATEGORIA_COLORS[item.categoria] ?? CATEGORIA_COLORS.upload
                  }`}
                >
                  {CATEGORIAS.filter((c) => c.value !== "all").map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delete */}
              <button
                onClick={() => deleteItem(item.id, item.storage_path)}
                className="absolute top-1.5 right-1.5 size-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="size-3 text-white" />
              </button>

              {/* Info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white truncate">{item.filename}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
