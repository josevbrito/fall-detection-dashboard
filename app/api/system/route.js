// GET /api/system - CPU% e RAM do host do servidor (lê /proc, Linux/WSL).
import { readFile } from "fs/promises";

export const dynamic = "force-dynamic";

async function cpuSnapshot() {
  const data = await readFile("/proc/stat", "utf8");
  const parts = data.split("\n")[0].trim().split(/\s+/).slice(1).map(Number);
  const idle = parts[3] + (parts[4] || 0); // idle + iowait
  const total = parts.reduce((a, b) => a + b, 0);
  return { idle, total };
}

export async function GET() {
  // Na Vercel (serverless) o /proc é do container efêmero da Vercel, não do
  // servidor (EC2). Retorna indisponível para não exibir CPU/RAM enganosos.
  if (process.env.VERCEL) {
    return Response.json(
      { error: "Métricas de sistema indisponíveis na Vercel (o dashboard não roda no servidor)." },
      { status: 503 }
    );
  }
  try {
    const a = await cpuSnapshot();
    await new Promise((r) => setTimeout(r, 200));
    const b = await cpuSnapshot();
    const dIdle = b.idle - a.idle;
    const dTotal = b.total - a.total;
    const cpuPct = dTotal > 0 ? (1 - dIdle / dTotal) * 100 : 0;

    const mem = await readFile("/proc/meminfo", "utf8");
    const get = (k) => Number((mem.match(new RegExp(k + ":\\s+(\\d+)")) || [])[1] || 0);
    const totalKb = get("MemTotal");
    const availKb = get("MemAvailable");
    const usedKb = totalKb - availKb;

    return Response.json({
      cpuPct: Math.round(cpuPct * 10) / 10,
      mem: {
        totalMb: Math.round(totalKb / 1024),
        usedMb: Math.round(usedKb / 1024),
        pct: totalKb ? Math.round((usedKb / totalKb) * 1000) / 10 : 0,
      },
    });
  } catch (e) {
    return Response.json(
      { error: "Métricas de sistema indisponíveis (host não-Linux?): " + String(e.message || e) },
      { status: 500 }
    );
  }
}
