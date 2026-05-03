"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const COLORS = {
  reach: "#3b82f6",
  saves: "#FF4103",
  shares: "#22c55e",
  comments: "#a855f7",
};

interface EngagementDataPoint {
  tema: string;
  reach: number;
  saves: number;
  shares: number;
  comments: number;
}

interface EngagementChartProps {
  data: EngagementDataPoint[];
}

export function EngagementChart({ data }: EngagementChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Engajamento por Carrossel (ultimos 10)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis
                  dataKey="tema"
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  angle={-20}
                  textAnchor="end"
                  height={60}
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
                <Legend
                  wrapperStyle={{ color: "#888888", fontSize: 12 }}
                />
                <Bar
                  dataKey="reach"
                  name="Reach"
                  fill={COLORS.reach}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="saves"
                  name="Saves"
                  fill={COLORS.saves}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="shares"
                  name="Shares"
                  fill={COLORS.shares}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="comments"
                  name="Comments"
                  fill={COLORS.comments}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">
                Nenhum dado de engajamento disponivel.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
