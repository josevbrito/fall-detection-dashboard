// GET /api/falls — devices cujo último fall_detected = true, via entitiesQuery.
import { tbPost } from "@/lib/thingsboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const body = {
    entityFilter: { type: "entityType", entityType: "DEVICE" },
    pageLink: {
      pageSize: 100,
      page: 0,
      sortOrder: {
        key: { type: "TIME_SERIES", key: "fall_detected" },
        direction: "DESC",
      },
    },
    entityFields: [{ type: "ENTITY_FIELD", key: "name" }],
    latestValues: [
      { type: "TIME_SERIES", key: "fall_detected" },
      { type: "TIME_SERIES", key: "magnitude" },
      { type: "TIME_SERIES", key: "impact_magnitude" },
    ],
    keyFilters: [
      {
        key: { type: "TIME_SERIES", key: "fall_detected" },
        valueType: "BOOLEAN",
        predicate: {
          operation: "EQUAL",
          value: { defaultValue: true },
          type: "BOOLEAN",
        },
      },
    ],
  };

  try {
    const data = await tbPost("/api/entitiesQuery/find", body);
    const falls = (data.data || []).map((row) => {
      const ts = (row.latest && row.latest.TIME_SERIES) || {};
      const ef = (row.latest && row.latest.ENTITY_FIELD) || {};
      return {
        name: ef.name && ef.name.value,
        magnitude: ts.magnitude && Number(ts.magnitude.value),
        impact: ts.impact_magnitude && Number(ts.impact_magnitude.value),
        ts: ts.fall_detected && Number(ts.fall_detected.ts),
      };
    });
    falls.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    return Response.json({ total: data.totalElements, falls });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 502 });
  }
}
