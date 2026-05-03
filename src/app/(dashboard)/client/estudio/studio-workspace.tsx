"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { TenantVisual } from "@/types/database";
import { ModoEnhance } from "./modo-enhance";
import { ModoCompose } from "./modo-compose";
import { ModoCreate } from "./modo-create";

interface StudioWorkspaceProps {
  tenantId: string;
  visual: TenantVisual | null;
  mediaUrls: string[];
}

export function StudioWorkspace({ tenantId, visual, mediaUrls }: StudioWorkspaceProps) {
  const [mode, setMode] = useState("enhance");

  return (
    <Tabs value={mode} onValueChange={(v) => v && setMode(v)}>
      <TabsList variant="line">
        <TabsTrigger value="enhance">Melhorar Foto</TabsTrigger>
        <TabsTrigger value="compose">Foto + Texto</TabsTrigger>
        <TabsTrigger value="create">Criar do Zero</TabsTrigger>
      </TabsList>

      <TabsContent value="enhance">
        <ModoEnhance tenantId={tenantId} visual={visual} mediaUrls={mediaUrls} />
      </TabsContent>

      <TabsContent value="compose">
        <ModoCompose tenantId={tenantId} visual={visual} mediaUrls={mediaUrls} />
      </TabsContent>

      <TabsContent value="create">
        <ModoCreate tenantId={tenantId} visual={visual} />
      </TabsContent>
    </Tabs>
  );
}
