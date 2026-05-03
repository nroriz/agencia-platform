import { createClient } from "@/lib/supabase/server";
import { pipelineRequest } from "@/lib/pipeline";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { tenant_id, temas } = body;

  if (!tenant_id || !Array.isArray(temas) || temas.length === 0) {
    return Response.json(
      { error: "tenant_id and temas[] are required" },
      { status: 400 }
    );
  }

  try {
    const result = await pipelineRequest("/pipeline/batch", {
      tenant_id,
      temas,
    });
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline error";
    return Response.json({ error: message }, { status: 502 });
  }
}
