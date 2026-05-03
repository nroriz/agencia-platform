import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pipelineRequest } from "@/lib/pipeline";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { tenant_id } = body;

  if (!tenant_id) {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  try {
    const result = await pipelineRequest("/pipeline/intelligence", body);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
