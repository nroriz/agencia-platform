"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Plug, CheckCircle2, XCircle } from "lucide-react";
import type { TenantIntegracoes } from "@/types/database";

interface TabIntegracoesProps {
  tenantId: string;
  initialData: TenantIntegracoes | null;
}

export function TabIntegracoes({ tenantId, initialData }: TabIntegracoesProps) {
  const [form, setForm] = useState({
    meta_graph_token: initialData?.meta_graph_token ?? "",
    instagram_page_id: initialData?.instagram_page_id ?? "",
    aprovacao_canal: initialData?.aprovacao_canal ?? "telegram",
    aprovacao_chat_id: initialData?.aprovacao_chat_id ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({});

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function testInstagram() {
    if (!form.meta_graph_token || !form.instagram_page_id) {
      toast.error("Preencha token e page ID");
      return;
    }

    setTesting("instagram");
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${form.instagram_page_id}?fields=name,username&access_token=${form.meta_graph_token}`
      );
      const data = await res.json();
      if (data.error) {
        setTestResults((prev) => ({ ...prev, instagram: false }));
        toast.error("Falha: " + data.error.message);
      } else {
        setTestResults((prev) => ({ ...prev, instagram: true }));
        toast.success(`Conectado: @${data.username || data.name}`);
      }
    } catch {
      setTestResults((prev) => ({ ...prev, instagram: false }));
      toast.error("Erro de conexao");
    }
    setTesting(null);
  }

  async function testTelegram() {
    if (!form.aprovacao_chat_id) {
      toast.error("Preencha o Chat ID");
      return;
    }

    setTesting("telegram");
    try {
      const res = await fetch("/api/test-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: form.aprovacao_chat_id }),
      });
      if (res.ok) {
        setTestResults((prev) => ({ ...prev, telegram: true }));
        toast.success("Mensagem de teste enviada");
      } else {
        setTestResults((prev) => ({ ...prev, telegram: false }));
        toast.error("Falha ao enviar mensagem de teste");
      }
    } catch {
      setTestResults((prev) => ({ ...prev, telegram: false }));
      toast.error("Erro de conexao");
    }
    setTesting(null);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    const payload = {
      tenant_id: tenantId,
      meta_graph_token: form.meta_graph_token || null,
      instagram_page_id: form.instagram_page_id || null,
      aprovacao_canal: form.aprovacao_canal,
      aprovacao_chat_id: form.aprovacao_chat_id || null,
    };

    let error;
    if (initialData) {
      ({ error } = await supabase
        .from("tenant_integracoes")
        .update(payload)
        .eq("tenant_id", tenantId));
    } else {
      ({ error } = await supabase.from("tenant_integracoes").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Integracoes salvas");
    }
  }

  function StatusIcon({ field }: { field: string }) {
    const result = testResults[field];
    if (result === true) return <CheckCircle2 className="size-4 text-green-400" />;
    if (result === false) return <XCircle className="size-4 text-red-400" />;
    return null;
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Instagram */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plug className="size-4 text-muted-foreground" />
            Instagram / Meta Graph API
            <StatusIcon field="instagram" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Meta Graph Token</Label>
            <Input
              type="password"
              value={form.meta_graph_token}
              onChange={(e) => update("meta_graph_token", e.target.value)}
              placeholder="EAA..."
            />
          </div>
          <div className="space-y-2">
            <Label>Instagram Page ID</Label>
            <Input
              value={form.instagram_page_id}
              onChange={(e) => update("instagram_page_id", e.target.value)}
              placeholder="17841400..."
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={testInstagram}
            disabled={testing === "instagram"}
          >
            {testing === "instagram" ? (
              <Loader2 className="size-4 animate-spin mr-1" />
            ) : null}
            Testar Conexao
          </Button>
        </CardContent>
      </Card>

      {/* Telegram */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plug className="size-4 text-muted-foreground" />
            Telegram (Aprovacao)
            <StatusIcon field="telegram" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Canal de Aprovacao</Label>
            <Input
              value={form.aprovacao_canal}
              onChange={(e) => update("aprovacao_canal", e.target.value)}
              placeholder="telegram"
            />
          </div>
          <div className="space-y-2">
            <Label>Chat ID</Label>
            <Input
              value={form.aprovacao_chat_id}
              onChange={(e) => update("aprovacao_chat_id", e.target.value)}
              placeholder="-100..."
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={testTelegram}
            disabled={testing === "telegram"}
          >
            {testing === "telegram" ? (
              <Loader2 className="size-4 animate-spin mr-1" />
            ) : null}
            Testar Envio
          </Button>
        </CardContent>
      </Card>

      {/* Google Drive - Placeholder */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">
            Google Drive (Em breve)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Integracao com Google Drive sera disponibilizada na Fase 10.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Save className="size-4 mr-2" />
          )}
          Salvar Integracoes
        </Button>
      </div>
    </div>
  );
}
