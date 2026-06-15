// GET /api/performance — métricas do último load test (device load-test-stats).
import { tbGet } from "@/lib/thingsboard";

export const dynamic = "force-dynamic";

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

export async function GET() {
  try {
    const list = await tbGet(
      "/api/tenant/devices?pageSize=10&page=0&textSearch=load-test-stats"
    );
    const dev = (list.data || []).find((d) => d.name === "load-test-stats");
    if (!dev) return Response.json({ available: false });

    const ts = await tbGet(
      `/api/plugins/telemetry/DEVICE/${dev.id.id}/values/timeseries?keys=${KEYS.join(",")}`
    );

    const metrics = {};
    let updatedAt = null;
    for (const k of Object.keys(ts)) {
      const point = ts[k] && ts[k][0];
      if (point) {
        metrics[k] = Number(point.value);
        updatedAt = Math.max(updatedAt || 0, Number(point.ts));
      }
    }
    return Response.json({ available: true, metrics, updatedAt });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 502 });
  }
}
