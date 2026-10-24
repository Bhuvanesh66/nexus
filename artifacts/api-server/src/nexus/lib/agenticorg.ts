export function agentCogConfigured(): boolean {
  return Boolean(process.env.AGENTICORG_API_KEY);
}

export async function agentCogDraft(
  task: string,
  context?: Record<string, unknown>,
): Promise<{ status?: string; confidence?: number; output?: unknown }> {
  const response = await fetch(
    "https://agenticorg.hackathon.pinelabs.com/api/v1/agents/7ee03962-d726-477a-8fdb-0b98705596cd/run",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AGENTICORG_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "process", inputs: { task }, context: context ?? {} }),
      signal: AbortSignal.timeout(100_000),
    },
  );
  if (!response.ok) throw new Error(`AgenticOrg drafting failed (${response.status})`);
  return response.json();
}
