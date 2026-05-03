import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, MessageSquare, Type, ImageIcon, Tag, Ban, Sparkles, BookOpen } from "lucide-react";
import type { TenantVisual, TenantVoz } from "@/types/database";

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="size-8 rounded-full border border-border shadow-sm"
        style={{ backgroundColor: color }}
      />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground uppercase">{color}</p>
      </div>
    </div>
  );
}

export default async function MarcaPage() {
  const user = await requireClient();
  const supabase = await createClient();

  const { data: visual } = await supabase
    .from("tenant_visual")
    .select("*")
    .eq("tenant_id", user.tenant_id!)
    .single();

  const { data: voz } = await supabase
    .from("tenant_voz")
    .select("*")
    .eq("tenant_id", user.tenant_id!)
    .single();

  const typedVisual = visual as TenantVisual | null;
  const typedVoz = voz as TenantVoz | null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Minha Marca</h2>
        <p className="text-muted-foreground">
          Identidade visual e voz da sua marca
        </p>
      </div>

      {/* Identidade Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-5" />
            Identidade Visual
          </CardTitle>
        </CardHeader>
        <CardContent>
          {typedVisual ? (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Cores */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Cores
                </h4>
                <div className="space-y-3">
                  <ColorSwatch color={typedVisual.cor_fundo} label="Fundo" />
                  <ColorSwatch color={typedVisual.cor_acento} label="Acento" />
                  <ColorSwatch color={typedVisual.cor_texto} label="Texto" />
                </div>
              </div>

              {/* Fontes */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <Type className="size-4" />
                  Fontes
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between rounded-lg border p-3">
                    <span className="text-muted-foreground">Headline</span>
                    <span className="font-medium">
                      {typedVisual.fonte_headline} ({typedVisual.fonte_headline_peso})
                    </span>
                  </div>
                  <div className="flex justify-between rounded-lg border p-3">
                    <span className="text-muted-foreground">Numero</span>
                    <span className="font-medium">{typedVisual.fonte_numero}</span>
                  </div>
                  <div className="flex justify-between rounded-lg border p-3">
                    <span className="text-muted-foreground">Corpo</span>
                    <span className="font-medium">{typedVisual.fonte_corpo}</span>
                  </div>
                  <div className="flex justify-between rounded-lg border p-3">
                    <span className="text-muted-foreground">Label</span>
                    <span className="font-medium">{typedVisual.fonte_label}</span>
                  </div>
                </div>
              </div>

              {/* Estilo de Imagem */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <ImageIcon className="size-4" />
                  Estilo de Imagem
                </h4>
                <Badge variant="secondary" className="text-sm">
                  {typedVisual.estilo_imagem}
                </Badge>
              </div>

              {/* Tag da Marca */}
              {typedVisual.tag_marca && (
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    <Tag className="size-4" />
                    Tag da Marca
                  </h4>
                  <Badge variant="outline" className="text-sm">
                    {typedVisual.tag_marca}
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">
              Identidade visual ainda nao configurada.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Voz da Marca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="size-5" />
            Voz da Marca
          </CardTitle>
        </CardHeader>
        <CardContent>
          {typedVoz ? (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Tom */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <Sparkles className="size-4" />
                  Tom
                </h4>
                <p className="text-sm rounded-lg border p-3">{typedVoz.tom}</p>
              </div>

              {/* Palavras Proibidas */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <Ban className="size-4" />
                  Palavras Proibidas
                </h4>
                {typedVoz.palavras_proibidas.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {typedVoz.palavras_proibidas.map((palavra) => (
                      <Badge key={palavra} variant="destructive" className="text-xs">
                        {palavra}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma</p>
                )}
              </div>

              {/* Expressoes Tipicas */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <MessageSquare className="size-4" />
                  Expressoes Tipicas
                </h4>
                {typedVoz.expressoes_tipicas.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {typedVoz.expressoes_tipicas.map((expr) => (
                      <Badge key={expr} variant="secondary" className="text-xs">
                        {expr}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma</p>
                )}
              </div>

              {/* Regras Extras */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <BookOpen className="size-4" />
                  Regras Extras
                </h4>
                {typedVoz.regras_extras.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {typedVoz.regras_extras.map((regra, i) => (
                      <li key={i} className="rounded-lg border p-3">
                        {regra}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Voz da marca ainda nao configurada.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
