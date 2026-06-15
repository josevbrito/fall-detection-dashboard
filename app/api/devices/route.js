// GET /api/devices — lista devices (id, nome) e total.
import { tbGet } from "@/lib/thingsboard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await tbGet(
      "/api/tenant/devices?pageSize=500&page=0&sortProperty=name&sortOrder=ASC"
    );
    const devices = (data.data || []).map((d) => ({
      id: d.id.id,
      name: d.name,
    }));
    return Response.json({ total: data.totalElements, devices });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 502 });
  }
}
