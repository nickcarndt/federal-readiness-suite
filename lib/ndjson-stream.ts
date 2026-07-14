/**
 * Simple NDJSON event stream for LLM routes.
 * Each line is a JSON object with a `type` discriminator.
 */
export type StreamEvent =
  | { type: "text"; delta: string }
  | { type: "partial"; data: unknown }
  | { type: "result"; data: unknown }
  | { type: "metrics"; data: unknown }
  | { type: "error"; error: string };

export function encodeStreamEvent(event: StreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export function createNdjsonResponse(
  start: (controller: ReadableStreamDefaultController<Uint8Array>) => Promise<void>
): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        await start(controller);
        controller.close();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Stream failed unexpectedly.";
        try {
          controller.enqueue(encodeStreamEvent({ type: "error", error: message }));
          controller.close();
        } catch {
          controller.error(err);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** Client-side NDJSON reader. */
export async function readNdjsonStream(
  response: Response,
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  if (!response.body) {
    throw new Error("Response body is empty.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx = buffer.indexOf("\n");
    while (newlineIdx !== -1) {
      const line = buffer.slice(0, newlineIdx).trim();
      buffer = buffer.slice(newlineIdx + 1);
      if (line) {
        onEvent(JSON.parse(line) as StreamEvent);
      }
      newlineIdx = buffer.indexOf("\n");
    }
  }

  const trailing = buffer.trim();
  if (trailing) {
    onEvent(JSON.parse(trailing) as StreamEvent);
  }
}
