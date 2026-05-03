import { NextResponse } from "next/server";

const API_BASE = process.env.PIPELINE_API_URL || "http://147.93.15.130:3456";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(`${API_BASE}/studio/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Servico de studio nao disponivel. Funcionalidade sera ativada em breve." },
        { status: 503 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Servico de studio nao disponivel. Funcionalidade sera ativada em breve." },
      { status: 503 }
    );
  }
}
