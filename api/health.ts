export function GET(): Response {
  return Response.json({ ok: true, service: 'orionstore-api', time: new Date().toISOString() });
}
