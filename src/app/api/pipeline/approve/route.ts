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
  const { tenant_id, carousel_id } = body;

  if (!tenant_id || !carousel_id) {
    return Response.json(
      { error: "tenant_id and carousel_id are required" },
      { status: 400 }
    );
  }

  try {
    const result = await pipelineRequest("/pipeline/approve", {
      tenant_id,
      carousel_id,
    });
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline error";
    return Response.json({ error: message }, { status: 502 });
  }
}
