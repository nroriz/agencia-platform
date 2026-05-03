"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type {
  Tenant,
  TenantVisual,
  TenantVoz,
  TenantBrandDNA,
  TenantTerritorio,
  TenantHorario,
  TenantIntegracoes,
  Ideia,
  CarouselStatus,
  TenantMedia,
} from "@/types/database";
import { MediaLibrary } from "@/components/media-library";
import { TabGeral } from "./tab-geral";
import { TabTerritorios } from "./tab-territorios";
import { TabHorarios } from "./tab-horarios";
import { TabVoz } from "./tab-voz";
import { TabVisual } from "./tab-visual";
import { TabIntegracoes } from "./tab-integracoes";
import { TabIdeias } from "./tab-ideias";
import { TabCarrosseis } from "./tab-carrosseis";
import { TabMetricas } from "./tab-metricas";
import { TabBrandDNA } from "./tab-brand-dna";

const TABS = [
  { value: "geral", label: "Geral" },
  { value: "territorios", label: "Territorios" },
  { value: "horarios", label: "Horarios" },
  { value: "voz", label: "Voz" },
  { value: "visual", label: "Visual" },
  { value: "brand-dna", label: "Brand DNA" },
  { value: "integracoes", label: "Integracoes" },
  { value: "ideias", label: "Ideias" },
  { value: "midia", label: "Midia" },
  { value: "estudio", label: "Estudio" },
  { value: "carrosseis", label: "Carrosseis" },
  { value: "metricas", label: "Metricas" },
] as const;

interface CarouselRow {
  id: string;
  tema: string;
  tema_refinado: string | null;
  formato: string | null;
  status: CarouselStatus;
  created_at: string;
}

interface TenantWorkspaceProps {
  tenant: Tenant;
  visual: TenantVisual | null;
  voz: TenantVoz | null;
  brandDna: TenantBrandDNA | null;
  territorios: TenantTerritorio[];
  horarios: TenantHorario[];
  integracoes: TenantIntegracoes | null;
  ideias: Ideia[];
  media: TenantMedia[];
  carousels: CarouselRow[];
  initialTab: string;
}

export function TenantWorkspace({
  tenant,
  visual,
  voz,
  brandDna,
  territorios,
  horarios,
  integracoes,
  ideias,
  media,
  carousels,
  initialTab,
}: TenantWorkspaceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);

  function handleTabChange(value: string | null) {
    if (!value) return;
    setActiveTab(value);
    router.replace(`?tab=${value}`, { scroll: false });
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList variant="line" className="flex-wrap">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="geral">
        <TabGeral tenant={tenant} />
      </TabsContent>

      <TabsContent value="territorios">
        <TabTerritorios tenantId={tenant.id} initialData={territorios} />
      </TabsContent>

      <TabsContent value="horarios">
        <TabHorarios tenantId={tenant.id} initialData={horarios} />
      </TabsContent>

      <TabsContent value="voz">
        <TabVoz tenantId={tenant.id} initialData={voz} />
      </TabsContent>

      <TabsContent value="visual">
        <TabVisual tenantId={tenant.id} initialData={visual} tenantNome={tenant.nome} />
      </TabsContent>

      <TabsContent value="brand-dna">
        <TabBrandDNA tenantId={tenant.id} initialData={brandDna} tenantHandle={tenant.handle} />
      </TabsContent>

      <TabsContent value="integracoes">
        <TabIntegracoes tenantId={tenant.id} initialData={integracoes} />
      </TabsContent>

      <TabsContent value="ideias">
        <TabIdeias tenantId={tenant.id} initialData={ideias} />
      </TabsContent>

      <TabsContent value="midia">
        <div className="pt-4">
          <MediaLibrary tenantId={tenant.id} initialData={media} />
        </div>
      </TabsContent>

      <TabsContent value="estudio">
        <div className="rounded-xl border border-dashed border-border/50 p-12 text-center space-y-2">
          <p className="text-lg font-medium text-muted-foreground">
            Estudio Visual
          </p>
          <p className="text-sm text-muted-foreground/60">
            O estudio esta disponivel no painel do cliente em /client/estudio
          </p>
        </div>
      </TabsContent>

      <TabsContent value="carrosseis">
        <TabCarrosseis tenantId={tenant.id} initialData={carousels} />
      </TabsContent>

      <TabsContent value="metricas">
        <TabMetricas tenantId={tenant.id} />
      </TabsContent>
    </Tabs>
  );
}
