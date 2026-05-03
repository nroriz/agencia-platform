"use client";

import { useState, useRef, type DragEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X, Image as ImageIcon } from "lucide-react";
import type { OnboardingData } from "./wizard";

interface StepFotosProps {
  data: OnboardingData;
  updateData: (partial: Partial<OnboardingData>) => void;
}

export function StepFotos({ data, updateData }: StepFotosProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | File[]) {
    if (!data.tenant_id) {
      toast.error("Salve os dados da empresa primeiro (Passo 1)");
      return;
    }

    const fileArr = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (fileArr.length === 0) return;

    setUploading(true);
    const supabase = createClient();
    const newPhotos = [...data.fotos];

    for (const file of fileArr) {
      const ext = file.name.split(".").pop();
      const path = `${data.tenant_id}/media/upload/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("tenant-assets")
        .upload(path, file);

      if (error) {
        toast.error(`Erro ao enviar ${file.name}: ${error.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("tenant-assets")
        .getPublicUrl(path);

      newPhotos.push({
        path,
        url: urlData.publicUrl,
        name: file.name,
      });
    }

    updateData({ fotos: newPhotos });
    setUploading(false);
    toast.success(`${fileArr.length} foto(s) enviada(s)`);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function removePhoto(idx: number) {
    updateData({ fotos: data.fotos.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-neutral-300">Fotos do Negocio</Label>
        <p className="text-xs text-neutral-500">
          Envie fotos do seu ambiente, equipe, produtos e servicos.
          Essas imagens serao usadas nos seus carrosseis em vez de imagens geradas por IA.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-orange-500 bg-orange-500/10"
            : "border-white/[0.1] hover:border-white/[0.2]"
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
        {uploading ? (
          <Loader2 className="size-8 animate-spin text-orange-500 mx-auto" />
        ) : (
          <>
            <Upload className="size-8 text-neutral-600 mx-auto mb-3" />
            <p className="text-sm text-neutral-400">
              Arraste fotos aqui ou clique para selecionar
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              JPG, PNG, WEBP — minimo 5 fotos recomendado
            </p>
          </>
        )}
      </div>

      {/* Photo Grid */}
      {data.fotos.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm text-neutral-400">{data.fotos.length} foto(s)</span>
          <div className="grid grid-cols-4 gap-3">
            {data.fotos.map((foto, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.url}
                  alt={foto.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 size-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="size-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.fotos.length === 0 && (
        <div className="rounded-xl border border-white/[0.06] p-6 text-center">
          <ImageIcon className="size-8 text-neutral-700 mx-auto mb-2" />
          <p className="text-xs text-neutral-600">
            Voce pode pular esta etapa e enviar fotos depois
          </p>
        </div>
      )}
    </div>
  );
}
