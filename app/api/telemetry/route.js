// GET /api/telemetry?deviceId=...&minutes=15 - séries temporais de um device.
import { tbGet } from "@/lib/thingsboard";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId");
  const minutes = Number(searchParams.get("minutes") || 15);
  if (!deviceId) {
    return Response.json({ error: "deviceId é obrigatório" }, { status: 400 });
  }

  const keys = "magnitude,accel_x,accel_y,accel_z";

  try {
    // Ancora a janela no último dado recebido, não no "agora": busca o ponto
    // mais recente (latest do TB) e usa o ts dele como fim da janela. Assim
    // "últimos 30 min" = 30 min até a última requisição, e o gráfico não fica
    // em branco quando o load test já terminou. Cai no now() se nunca houve dado.
    const latest = await tbGet(
      `/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${keys}`
    );
    const lastTs = Math.max(
      0,
      ...Object.values(latest).flatMap((points) => points.map((p) => Number(p.ts)))
    );
    const endTs = lastTs > 0 ? lastTs : Date.now();
    const startTs = endTs - minutes * 60 * 1000;

    const data = await tbGet(
      `/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries` +
        `?keys=${keys}&startTs=${startTs}&endTs=${endTs}&limit=1000&orderBy=ASC`
    );

    // Normaliza: TB devolve { magnitude:[{ts,value}], accel_x:[...] }.
    // Junta tudo num array por timestamp para o gráfico.
    const byTs = {};
    for (const key of Object.keys(data)) {
      for (const point of data[key]) {
        const t = Number(point.ts);
        byTs[t] = byTs[t] || { ts: t };
        byTs[t][key] = Number(point.value);
      }
    }
    const series = Object.values(byTs).sort((a, b) => a.ts - b.ts);
    return Response.json({ series });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 502 });
  }
}
