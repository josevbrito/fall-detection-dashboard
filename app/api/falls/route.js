// GET /api/falls - quedas dos últimos N minutos (default 30), via alarmes.
// Usa os alarmes QUEDA_DETECTADA que o device profile gera quando
// fall_detected=true. Indexado por tempo no TB → rápido e não perde quedas
// transitórias (o fall_detected fica true por só ~500ms).
import { tbGet } from "@/lib/thingsboard";

export const dynamic = "force-dynamic";

const ALARM_TYPE = "QUEDA_DETECTADA";
const DEFAULT_WINDOW_MIN = 30;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const windowMin = Number(searchParams.get("minutes")) || DEFAULT_WINDOW_MIN;
  const now = Date.now();
  const start = now - windowMin * 60 * 1000;

  try {
    const data = await tbGet(
      `/api/v2/alarms?pageSize=200&page=0&sortProperty=createdTime&sortOrder=DESC` +
        `&startTime=${start}&endTime=${now}&searchStatus=ANY&typeList=${ALARM_TYPE}`
    );

    const falls = (data.data || [])
      .filter((a) => a.type === ALARM_TYPE)
      .map((a) => {
        const active =
          typeof a.status === "string" && a.status.startsWith("ACTIVE");
        return {
          name: a.originatorName,
          ts: a.createdTime,
          status: a.status,
          active,
        };
      });

    const active = falls.filter((f) => f.active).length;

    return Response.json({
      total: data.totalElements ?? falls.length, // quedas na janela
      active, // ainda em queda agora
      windowMin,
      falls,
    });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 502 });
  }
}