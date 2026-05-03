"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CarouselStatus } from "@/types/database";

const ACCENT = "#FF4103";
const COLORS = ["#FF4103", "#FF6B3D", "#FF9A7A", "#22c55e", "#3b82f6", "#a855f7"];

interface DailyCount {
  date: string;
  count: number;
}

interface StatusCount {
  status: CarouselStatus;
  count: number;
}

const STATUS_LABELS: Record<CarouselStatus, string> = {
  draft: "Rascunho",
  pending_approval: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  scheduled: "Agendado",
  published: "Publicado",
  downloaded: "Baixado",
  failed: "Falha",
};

interface CarouselsPerDayChartProps {
  data: DailyCount[];
}

export function CarouselsPerDayChart({ data }: CarouselsPerDayChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Carrosseis por Dia (30d)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0a0a0a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "#ffffff",
                }}
              />
              <Bar
                dataKey="count"
                name="Carrosseis"
                fill={ACCENT}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatusPieChartProps {
  data: StatusCount[];
}

function renderLabel(entry: { name?: string; percent?: number }) {
  return `${entry.name ?? ""} ${((entry.percent ?? 0) * 100).toFixed(0)}%`;
}

export function StatusPieChart({ data }: StatusPieChartProps) {
  const chartData = data.map((item) => ({
    name: STATUS_LABELS[item.status],
    value: item.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Distribuicao por Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                label={renderLabel}
                labelLine={false}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0a0a0a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "#ffffff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
