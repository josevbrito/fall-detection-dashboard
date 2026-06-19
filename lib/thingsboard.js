// lib/thingsboard.js
// Cliente server-side da API REST do ThingsBoard. O JWT é obtido e cacheado
// aqui (no servidor Next), nunca exposto ao navegador.

const TB_URL = process.env.TB_URL || "http://localhost:8090";
const TB_USER = process.env.TB_TENANT_EMAIL || "fall-tenant@thingsboard.org";
const TB_PASS = process.env.TB_TENANT_PASSWORD || "tenant2026";

let cachedToken = null;
let tokenExpiresAt = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const res = await fetch(`${TB_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: TB_USER, password: TB_PASS }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`ThingsBoard login falhou (${res.status}). Verifique TB_URL/credenciais.`);
  }
  const data = await res.json();
  cachedToken = data.token;
  // Token do TB dura ~2.5h por padrão; renovamos com folga a cada ~30min.
  tokenExpiresAt = Date.now() + 30 * 60 * 1000;
  return cachedToken;
}

export async function tbGet(path) {
  const token = await getToken();
  const res = await fetch(`${TB_URL}${path}`, {
    headers: { "X-Authorization": `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`TB GET ${path} -> ${res.status}`);
  return res.json();
}

export async function tbPost(path, body) {
  const token = await getToken();
  const res = await fetch(`${TB_URL}${path}`, {
    method: "POST",
    headers: {
      "X-Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`TB POST ${path} -> ${res.status}`);
  return res.json();
}

// "Última requisição" do load test = ts (ms) da telemetria mais recente do
// device load-test-stats, que publica um snapshot a cada 5s enquanto o teste
// roda. Serve de âncora ÚNICA para travar todas as janelas de 30 min no fim do
// último teste, em vez de no "agora" (senão os gráficos ficam em branco depois
// que o teste termina). Retorna null se o device não existe ou nunca publicou —
// nesse caso quem chama cai no Date.now().
export async function lastLoadTestTs() {
  try {
    const list = await tbGet(
      "/api/tenant/devices?pageSize=10&page=0&textSearch=load-test-stats"
    );
    const dev = (list.data || []).find((d) => d.name === "load-test-stats");
    if (!dev) return null;
    const latest = await tbGet(
      `/api/plugins/telemetry/DEVICE/${dev.id.id}/values/timeseries?keys=throughput_msg_per_s`
    );
    const tss = Object.values(latest).flatMap((pts) => pts.map((p) => Number(p.ts)));
    return tss.length ? Math.max(...tss) : null;
  } catch {
    return null;
  }
}

export { TB_URL };
