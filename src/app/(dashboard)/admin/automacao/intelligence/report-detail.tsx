"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReportDetailProps {
  reportId: string;
  tenantName: string;
  periodo: string;
  createdAt: string;
  reportJson: unknown;
}

export function ReportDetail({
  tenantName,
  periodo,
  createdAt,
  reportJson,
}: ReportDetailProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedJson = JSON.stringify(reportJson, null, 2);
  const formattedDate = new Date(createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden border-border/50 hover:border-orange-500/30 transition-colors">
      <CardHeader
        className="cursor-pointer select-none p-4"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {isOpen ? (
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">
                {tenantName} — {periodo}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formattedDate}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen((prev) => !prev);
            }}
          >
            {isOpen ? "Fechar" : "Ver Detalhes"}
          </Button>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="px-4 pb-4 pt-0">
          <div className="relative rounded-lg bg-muted/50 border border-border/50">
            {/* Copy button */}
            <div className="flex justify-end p-2 pb-0">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="size-3" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    Copiar JSON
                  </>
                )}
              </Button>
            </div>

            {/* JSON viewer */}
            <pre className="overflow-x-auto p-4 pt-2 text-xs leading-relaxed text-muted-foreground font-mono max-h-[500px] overflow-y-auto">
              <code>
                <JsonRenderer data={reportJson} />
              </code>
            </pre>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function JsonRenderer({ data }: { data: unknown }) {
  if (data === null) return <span className="text-orange-400">null</span>;
  if (data === undefined)
    return <span className="text-muted-foreground">undefined</span>;

  if (typeof data === "string")
    return <span className="text-green-400">&quot;{data}&quot;</span>;
  if (typeof data === "number")
    return <span className="text-cyan-400">{data}</span>;
  if (typeof data === "boolean")
    return <span className="text-purple-400">{data ? "true" : "false"}</span>;

  if (Array.isArray(data)) {
    if (data.length === 0)
      return <span className="text-muted-foreground">{"[]"}</span>;
    return (
      <span>
        {"[\n"}
        {data.map((item, i) => (
          <span key={i} className="ml-4 block">
            {"  "}
            <JsonRenderer data={item} />
            {i < data.length - 1 ? "," : ""}
          </span>
        ))}
        {"]"}
      </span>
    );
  }

  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0)
      return <span className="text-muted-foreground">{"{}"}</span>;
    return (
      <span>
        {"{\n"}
        {entries.map(([key, value], i) => (
          <span key={key} className="ml-4 block">
            {"  "}
            <span className="text-blue-400">&quot;{key}&quot;</span>
            {": "}
            <JsonRenderer data={value} />
            {i < entries.length - 1 ? "," : ""}
          </span>
        ))}
        {"}"}
      </span>
    );
  }

  return <span>{String(data)}</span>;
}
