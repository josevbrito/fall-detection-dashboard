// GET /api/performance - métricas do load test nos últimos 30 min (device
// load-test-stats). O load test publica um snapshot a cada 5s, então isto
// mostra o desempenho AO VIVO + a série temporal da janela.
import { tbGet } from "@/lib/thingsboard";

export const dynamic = "force-dynamic";

const WINDOW_MS = 30 * 60 * 1000;
const LIVE_MS = 15 * 1000; // recebeu ponto nos últimos 15s => teste rodando

const KEYS = [
  "throughput_msg_per_s",
  "avg_latency_ms",
  "p50_latency_ms",
  "p70_latency_ms",
  "p95_latency_ms",
  "p99_latency_ms",
  "total_published",
  "total_errors",
  "error_rate_pct",
  "total_devices",
  "total_falls_simulated",
  "requests_per_device",
  "interval_ms",
];

// chaves que viram série temporal no gráfico ao vivo
const SERIES_KEYS = ["throughput_msg_per_s", "avg_latency_ms", "p99_latency_ms", "error_rate_pct"];

export async function GET() {
  const endTs = Date.now();
  const startTs = endTs - WINDOW_MS;
  try {
    const list = await tbGet(
      "/api/tenant/devices?pageSize=10&page=0&textSearch=load-test-stats"
    );
    const dev = (list.data || []).find((d) => d.name === "load-test-stats");
    if (!dev) return Response.json({ available: false });

    const ts = await tbGet(
      `/api/plugins/telemetry/DEVICE/${dev.id.id}/values/timeseries` +
        `?keys=${KEYS.join(",")}&startTs=${startTs}&endTs=${endTs}&limit=5000&orderBy=ASC`
    );

    // valores mais recentes (último ponto de cada chave dentro da janela)
    const metrics = {};
    let updatedAt = null;
    for (const k of Object.keys(ts)) {
      const arr = ts[k];
      if (arr && arr.length) {
        const last = arr[arr.length - 1];
        metrics[k] = Number(last.value);
        updatedAt = Math.max(updatedAt || 0, Number(last.ts));
      }
    }
    // sem nenhum ponto nos últimos 30 min => nada recente para mostrar
    if (updatedAt == null) return Response.json({ available: false });

    // série temporal (pontos agrupados por timestamp) para o gráfico
    const byTs = {};
    for (const k of SERIES_KEYS) {
      for (const p of ts[k] || []) {
        const t = Number(p.ts);
        byTs[t] = byTs[t] || { ts: t };
        byTs[t][k] = Number(p.value);
      }
    }
    const series = Object.values(byTs).sort((a, b) => a.ts - b.ts);

    return Response.json({
      available: true,
      live: endTs - updatedAt < LIVE_MS, // teste em andamento?
      metrics,
      updatedAt,
      series,
    });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 502 });
  }
}
