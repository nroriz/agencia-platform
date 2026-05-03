"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  format,
  isSameDay,
  eachDayOfInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import type { CarouselStatus } from "@/types/database";

interface CalendarCarousel {
  id: string;
  tema_refinado: string | null;
  tema: string;
  status: CarouselStatus;
  formato: string | null;
  agendado_para: string | null;
  created_at: string;
  tenant: {
    handle: string;
    nome: string;
  } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending_approval: "bg-yellow-500",
  approved: "bg-green-500",
  scheduled: "bg-blue-500",
  published: "bg-purple-500",
};

const STATUS_LABELS: Record<string, string> = {
  pending_approval: "Pendente",
  approved: "Aprovado",
  scheduled: "Agendado",
  published: "Publicado",
};

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function getWeekRange(weekOffset: number) {
  const reference = addWeeks(new Date(), weekOffset);
  const start = startOfWeek(reference, { weekStartsOn: 1 });
  const end = endOfWeek(reference, { weekStartsOn: 1 });
  return { start, end };
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

function formatTime(dateString: string): string {
  return format(new Date(dateString), "HH:mm");
}

export function CalendarioClient() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [carousels, setCarousels] = useState<CalendarCarousel[]>([]);
  const [loading, setLoading] = useState(true);

  const { start, end } = getWeekRange(weekOffset);
  const days = eachDayOfInterval({ start, end });

  const fetchCarousels = useCallback(async () => {
    setLoading(true);
    const supabase = createSupabaseBrowser();

    const { start: weekStart, end: weekEnd } = getWeekRange(weekOffset);

    const { data } = await supabase
      .from("carousels")
      .select(
        `
        id,
        tema_refinado,
        tema,
        status,
        formato,
        agendado_para,
        created_at,
        tenant:tenants!carousels_tenant_id_fkey(handle, nome)
      `
      )
      .in("status", ["approved", "scheduled", "published", "pending_approval"])
      .gte("agendado_para", weekStart.toISOString())
      .lte("agendado_para", weekEnd.toISOString())
      .order("agendado_para", { ascending: true, nullsFirst: false });

    setCarousels((data as CalendarCarousel[] | null) ?? []);
    setLoading(false);
  }, [weekOffset]);

  useEffect(() => {
    fetchCarousels();
  }, [fetchCarousels]);

  function getCarouselsForDay(day: Date): CalendarCarousel[] {
    return carousels.filter((c) => {
      const dateStr = c.agendado_para ?? c.created_at;
      return isSameDay(new Date(dateStr), day);
    });
  }

  const weekLabel = `${format(start, "dd MMM", { locale: ptBR })} - ${format(end, "dd MMM yyyy", { locale: ptBR })}`;
  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Calendario Editorial
          </h2>
          <p className="text-muted-foreground">
            Visao semanal de todos os tenants
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="rounded-lg"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant={isCurrentWeek ? "default" : "outline"}
            size="sm"
            onClick={() => setWeekOffset(0)}
            className="min-w-[200px] rounded-lg"
          >
            <Calendar className="mr-2 size-4" />
            {weekLabel}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="rounded-lg"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {days.map((day, index) => {
          const dayCarousels = getCarouselsForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div key={day.toISOString()} className="flex flex-col gap-2">
              {/* Day Header */}
              <div
                className={`text-center rounded-xl px-2 py-2.5 text-sm font-medium transition-colors ${
                  isToday
                    ? "bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/20"
                    : "bg-card border border-border/50 text-muted-foreground"
                }`}
              >
                <div className="font-semibold">{DAY_LABELS[index]}</div>
                <div className={`text-xs ${isToday ? "text-white/80" : ""}`}>
                  {format(day, "dd/MM")}
                </div>
              </div>

              {/* Day Content */}
              <div className="flex flex-col gap-2 min-h-[140px] rounded-xl border border-border/30 bg-card/30 p-2">
                {loading ? (
                  <div className="flex items-center justify-center h-20">
                    <div className="size-4 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
                  </div>
                ) : dayCarousels.length === 0 ? (
                  <p className="text-xs text-muted-foreground/40 text-center py-8">
                    --
                  </p>
                ) : (
                  dayCarousels.map((carousel) => (
                    <Card
                      key={carousel.id}
                      className="border-border/40 bg-card/80 hover:border-orange-500/30 transition-colors cursor-pointer"
                    >
                      <CardContent className="p-2.5 space-y-1.5">
                        <div className="flex items-start gap-1.5">
                          <span
                            className={`mt-1 size-2 shrink-0 rounded-full ${
                              STATUS_COLORS[carousel.status] ?? "bg-gray-500"
                            }`}
                            title={STATUS_LABELS[carousel.status] ?? carousel.status}
                          />
                          <span className="text-xs font-medium leading-tight">
                            {truncate(
                              carousel.tema_refinado ?? carousel.tema,
                              40
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span>
                            @{carousel.tenant?.handle ?? "?"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1">
                          {carousel.agendado_para && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {formatTime(carousel.agendado_para)}
                            </span>
                          )}
                          {carousel.formato && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] px-1 py-0 h-4"
                            >
                              {carousel.formato}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground rounded-xl border border-border/30 bg-card/30 px-4 py-3">
        <span className="font-semibold text-muted-foreground/60 uppercase tracking-widest text-[10px]">Legenda</span>
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span
              className={`size-2.5 rounded-full ${STATUS_COLORS[status]}`}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
