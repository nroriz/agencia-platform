const PIPELINE_URL = process.env.PIPELINE_API_URL || "http://localhost:3456";

export async function pipelineRequest(
  path: string,
  body: Record<string, unknown>
) {
  const res = await fetch(`${PIPELINE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pipeline error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function pipelineHealth() {
  const res = await fetch(`${PIPELINE_URL}/health`, { cache: "no-store" });
  return res.ok;
}
