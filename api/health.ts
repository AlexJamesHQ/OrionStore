export default function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  return res.status(200).json({ ok: true, service: 'orionstore-api', version: 'v9', time: new Date().toISOString() });
}
