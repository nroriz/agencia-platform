"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CarouselFilterTabsProps {
  counts: Record<string, number>;
}

const TAB_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "draft", label: "Rascunho" },
  { value: "pending_approval", label: "Pendentes" },
  { value: "approved", label: "Aprovados" },
  { value: "scheduled", label: "Agendados" },
  { value: "published", label: "Publicados" },
  { value: "downloaded", label: "Baixados" },
  { value: "failed", label: "Falhou" },
] as const;

export function CarouselFilterTabs({ counts }: CarouselFilterTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "all";

  function handleChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <Tabs value={current} onValueChange={handleChange}>
      <TabsList>
        {TAB_OPTIONS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
            {counts[tab.value] !== undefined && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({counts[tab.value]})
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
