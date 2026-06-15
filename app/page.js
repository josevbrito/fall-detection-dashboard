"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  ResponsiveContainer, ComposedChart, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine,
} from "recharts";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import SearchSelect from "@/components/SearchSelect";
import DeviceCharts from "@/components/DeviceCharts";

const REFRESH_MS = 5000;
const SYS_REFRESH_MS = 3000;
const ALERT_THRESHOLD = 90; // % de CPU/RAM que dispara alerta

const TITLES = {
  overview: "Visão Geral",
  falls: "Quedas",
  performance: "Desempenho",
  system: "Sistema",
};

const fmtTime = (ts) => (ts ? new Date(ts).toLocaleTimeString("pt-BR") : "-");
const num = (v, d = 0) =>
  v == null || Number.isNaN(Number(v)) ? "-" : Number(v).toLocaleString("pt-BR", { maximumFractionDigits: d });

/* ============ áudio (Web Audio API, sem assets) ============ */
let _audioCtx = null;
function getAudioCtx() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!_audioCtx) _audioCtx = new AC();
  if (_audioCtx.state === "suspended") _audioCtx.resume().catch(() => {});
  return _audioCtx;
}
function tone(freq, durMs, type = "sine", gainVal = 0.18, delay = 0) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain).connect(ctx.destination);
  const t0 = ctx.currentTime + delay;
  gain.gain.setValueAtTime(gainVal, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
  osc.start(t0);
  osc.stop(t0 + durMs / 1000);
}
// sirene curta descendente para quedas
const playFallAlert = () => { tone(880, 180, "square", 0.16, 0); tone(620, 240, "square", 0.16, 0.18); };
// bip agudo para CPU/RAM acima do limiar
const playThresholdAlert = () => { tone(1040, 160, "sine", 0.2, 0); tone(1040, 160, "sine", 0.2, 0.22); };

export default function Page() {
  const [tab, setTab] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [devices, setDevices] = useState([]);
  const [totalDevices, setTotalDevices] = useState(null);
  const [falls, setFalls] = useState([]);
  const [fallTotal, setFallTotal] = useState(0);
  const [fallActive, setFallActive] = useState(0);
  const [fallWindow, setFallWindow] = useState(30);
  const [perf, setPerf] = useState(null);
  const [sys, setSys] = useState(null);
  const [sysHistory, setSysHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const selRef = useRef(null);
  selRef.current = selected;
  const soundRef = useRef(true);
  soundRef.current = soundOn;
  const lastFallTsRef = useRef(null); // maior ts de queda já visto
  const sysAlarmRef = useRef(false);  // já está acima do limiar?

  // Libera o áudio no primeiro gesto do usuário (política de autoplay).
  useEffect(() => {
    const unlock = () => getAudioCtx();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  const loadCore = useCallback(async () => {
    try {
      const [d, f, p] = await Promise.all([
        fetch("/api/devices").then((r) => r.json()),
        fetch("/api/falls").then((r) => r.json()),
        fetch("/api/performance").then((r) => r.json()),
      ]);
      if (d.error) throw new Error(d.error);
      setTotalDevices(d.total);
      setDevices(d.devices || []);
      setFalls(f.falls || []);
      setFallTotal(f.total || 0);
      setFallActive(f.active || 0);
      setFallWindow(f.windowMin || 30);
      setPerf(p && p.available ? p : null);
      setError(null);
      setUpdatedAt(Date.now());

      // alerta sonoro de nova queda
      const maxTs = (f.falls || []).reduce((m, x) => Math.max(m, x.ts || 0), 0);
      if (lastFallTsRef.current != null && maxTs > lastFallTsRef.current && soundRef.current) {
        playFallAlert();
      }
      if (maxTs > 0) lastFallTsRef.current = maxTs;

      if (!selRef.current && d.devices?.length) setSelected({ id: d.devices[0].id, name: d.devices[0].name });
    } catch (e) {
      setError(String(e.message || e));
    }
  }, []);

  const loadSys = useCallback(async () => {
    try {
      const s = await fetch("/api/system").then((r) => r.json());
      if (s.error) return;
      setSys(s);
      setSysHistory((h) => [...h, { ts: Date.now(), cpu: s.cpuPct, ram: s.mem.pct }].slice(-40));

      // alerta sonoro ao cruzar o limiar (só na transição, sem spam)
      const over = s.cpuPct >= ALERT_THRESHOLD || s.mem.pct >= ALERT_THRESHOLD;
      if (over && !sysAlarmRef.current && soundRef.current) playThresholdAlert();
      sysAlarmRef.current = over;
    } catch {}
  }, []);

  useEffect(() => { loadCore(); const id = setInterval(loadCore, REFRESH_MS); return () => clearInterval(id); }, [loadCore]);
  useEffect(() => { loadSys(); const id = setInterval(loadSys, SYS_REFRESH_MS); return () => clearInterval(id); }, [loadSys]);

  const deviceName = (id) => (devices.find((d) => d.id === id) || {}).name;

  return (
    <>
      <Sidebar tab={tab} setTab={setTab} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen md:ml-[260px] w-full">
        <TopBar
          title={TITLES[tab]}
          online={!error}
          updatedText={error ? null : `atualizado ${fmtTime(updatedAt)} · auto ${REFRESH_MS / 1000}s`}
          onMenu={() => setMenuOpen(true)}
        />
        <main className="p-gutter md:p-8 w-full max-w-[1440px] mx-auto">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { getAudioCtx(); setSoundOn((s) => !s); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 text-label-caps uppercase text-on-surface-variant hover:bg-surface-container-high transition-colors"
              title={soundOn ? "Alertas sonoros ligados" : "Alertas sonoros desligados"}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{soundOn ? "volume_up" : "volume_off"}</span>
              Som {soundOn ? "ligado" : "desligado"}
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-error/40 bg-error-container/20 text-error px-4 py-3 text-body-sm">
              Erro ao falar com o ThingsBoard: {error}
              <div className="text-on-surface-variant mt-1 text-[12px]">Confira se o servidor está no ar e o TB_URL no .env.local.</div>
            </div>
          )}

          {tab === "overview" && <Overview totalDevices={totalDevices} fallTotal={fallTotal} fallActive={fallActive} fallWindow={fallWindow} perf={perf} sys={sys} falls={falls} onOpenFalls={() => setTab("falls")} />}
          {tab === "falls" && <Falls devices={devices} selected={selected} setSelected={setSelected} falls={falls} fallWindow={fallWindow} deviceName={deviceName} />}
          {tab === "performance" && <Performance perf={perf} />}
          {tab === "system" && <System sys={sys} history={sysHistory} />}
        </main>
      </div>
    </>
  );
}

/* ============ componentes de UI ============ */

function Card({ children, className = "" }) {
  return <div className={"bg-surface-container rounded-lg border border-outline-variant " + className}>{children}</div>;
}

function Kpi({ label, icon, value, unit, accent = "on-surface", children }) {
  return (
    <div className="bg-surface-container rounded-lg border border-outline-variant p-5 relative overflow-hidden group hover:bg-surface-container-high transition-colors">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-label-caps text-on-surface-variant uppercase">{label}</h3>
        <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">{icon}</span>
      </div>
      <div className="relative z-10">
        <div className={`text-display-lg text-${accent}`}>
          {value}
          {unit && <span className="text-body-sm text-on-surface-variant font-normal ml-1">{unit}</span>}
        </div>
        {children}
      </div>
    </div>
  );
}

function FallBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-error-container/20 text-error border border-error/30">
      queda
    </span>
  );
}

function FallsTable({ falls, onPick, selectedName, compact }) {
  if (!falls?.length) {
    return <div className="text-on-surface-variant text-body-sm px-6 py-6">Nenhuma queda nos últimos 30 min. Rode o load test com --fall-prob &gt; 0.</div>;
  }
  const showImpact = !compact && falls.some((f) => f.impact != null || f.magnitude != null);
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-outline-variant/50 bg-surface-container-lowest/50">
            <th className="py-3 px-6 text-label-caps text-on-surface-variant uppercase">Device</th>
            <th className="py-3 px-6 text-label-caps text-on-surface-variant uppercase">Horário</th>
            {showImpact && <th className="py-3 px-6 text-label-caps text-on-surface-variant uppercase">Impacto (g)</th>}
            <th className="py-3 px-6 text-label-caps text-on-surface-variant uppercase text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/30 text-body-sm">
          {falls.map((f, i) => (
            <tr
              key={i}
              onClick={onPick ? () => onPick(f.name) : undefined}
              className={
                "transition-colors group " +
                (onPick ? "cursor-pointer hover:bg-surface-container-high " : "") +
                (selectedName === f.name ? "bg-primary/10" : "")
              }
            >
              <td className="py-3 px-6 font-mono-data text-on-surface-variant group-hover:text-primary transition-colors">{f.name}</td>
              <td className="py-3 px-6 text-on-surface-variant">{fmtTime(f.ts)}</td>
              {showImpact && <td className="py-3 px-6 font-mono-data">{f.impact != null ? f.impact.toFixed(2) : f.magnitude != null ? f.magnitude.toFixed(2) : "-"}</td>}
              <td className="py-3 px-6 text-right"><FallBadge /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============ Visão Geral ============ */
function Overview({ totalDevices, fallTotal, fallActive, fallWindow, perf, sys, falls, onOpenFalls }) {
  return (
    <>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-gap md:gap-gutter mb-8">
        <Kpi label="Devices" icon="router" value={num(totalDevices)}>
          <div className="flex items-center gap-1 mt-2">
            <span className="material-symbols-outlined text-ok" style={{ fontSize: 14 }}>trending_up</span>
            <span className="text-label-caps text-ok">monitorando</span>
          </div>
        </Kpi>
        <Kpi label={`Quedas (${fallWindow} min)`} icon="warning" value={num(fallTotal)} accent="error">
          <div className="mt-2"><span className="text-label-caps text-error-container">{fallActive > 0 ? `${num(fallActive)} ainda em queda agora` : "Nenhuma queda ativa agora"}</span></div>
        </Kpi>
        <Kpi label="Throughput (último teste)" icon="speed" value={perf ? num(perf.metrics.throughput_msg_per_s, 0) : "-"} unit="msg/s" accent="secondary-fixed-dim">
          <div className="mt-3 h-8 w-full">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 30">
              <defs>
                <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2fd9f4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2fd9f4" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,25 L10,20 L20,22 L30,15 L40,18 L50,10 L60,12 L70,5 L80,15 L90,8 L100,2 L100,30 L0,30 Z" fill="url(#spark)" />
              <path d="M0,25 L10,20 L20,22 L30,15 L40,18 L50,10 L60,12 L70,5 L80,15 L90,8 L100,2" fill="none" stroke="#2fd9f4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </div>
        </Kpi>
        <Kpi label="CPU servidor" icon="memory" value={sys ? num(sys.cpuPct, 1) : "-"} unit="%">
          <div className="mt-4 w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
            <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${sys?.cpuPct || 0}%` }} />
          </div>
        </Kpi>
      </section>

      <Card className="overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/50 flex justify-between items-center">
          <h2 className="text-title-sm text-on-surface flex items-center gap-2"><span>🚨</span> Quedas recentes <span className="text-on-surface-variant text-body-sm">(últimos {fallWindow} min)</span></h2>
          <button onClick={onOpenFalls} className="text-primary hover:text-primary-fixed transition-colors text-label-caps uppercase">Ver Relatório Completo</button>
        </div>
        <FallsTable falls={falls.slice(0, 8)} />
      </Card>
    </>
  );
}

/* ============ Quedas ============ */
function Falls({ devices, selected, setSelected, falls, fallWindow, deviceName }) {
  const pick = (name) => { const d = devices.find((x) => x.name === name); if (d) setSelected({ id: d.id, name: d.name }); };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
      <Card className="lg:col-span-2 p-6">
        <h2 className="text-title-sm text-on-surface flex items-center gap-2 mb-4"><span className="material-symbols-outlined text-secondary-fixed-dim">monitoring</span> Telemetria do device</h2>
        <div className="max-w-md mb-6">
          <SearchSelect options={devices} value={selected?.id} onChange={(id) => setSelected({ id, name: deviceName(id) })} placeholder="Buscar device (ex: fall-sensor-000123)" />
        </div>
        <DeviceCharts deviceId={selected?.id} deviceName={selected?.name} />
      </Card>

      <Card className="overflow-hidden self-start">
        <div className="px-6 py-5 border-b border-outline-variant/50 flex items-center gap-2">
          <span className="material-symbols-outlined text-error">emergency_home</span>
          <h2 className="text-title-sm text-on-surface">Quedas detectadas <span className="text-on-surface-variant text-body-sm">· últimos {fallWindow} min ({falls.length})</span></h2>
        </div>
        <FallsTable falls={falls} onPick={pick} selectedName={selected?.name} compact />
        <div className="px-6 py-3 border-t border-outline-variant/50 text-center">
          <span className="text-on-surface-variant text-[12px]">Clique numa linha para ver os gráficos</span>
        </div>
      </Card>
    </div>
  );
}

/* ============ Desempenho ============ */
function Performance({ perf }) {
  if (!perf) {
    return (
      <Card className="p-6">
        <h2 className="text-title-sm mb-2">Sem dados de desempenho ainda</h2>
        <p className="text-on-surface-variant text-body-sm">Rode um load test (<span className="font-mono-data">client.sh</span>/<span className="font-mono-data">client.ps1</span>) - ao terminar, ele publica o resumo no ThingsBoard e aparece aqui.</p>
      </Card>
    );
  }
  const m = perf.metrics;
  const maxP = Math.max(m.p50_latency_ms, m.p70_latency_ms, m.p95_latency_ms, m.p99_latency_ms, 1);
  const rows = [["p50", m.p50_latency_ms], ["p70", m.p70_latency_ms], ["p95", m.p95_latency_ms], ["p99", m.p99_latency_ms]];
  const chartTip = { background: "#0b0e15", border: "1px solid #424754", borderRadius: 10, fontSize: 12 };
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className={"w-2 h-2 rounded-full " + (perf.live ? "bg-ok status-pulse" : "bg-outline")} />
          <span className="text-label-caps uppercase text-on-surface-variant">
            {perf.live ? "Teste em andamento - ao vivo" : "Nenhum teste rodando agora"}
          </span>
        </div>
        <span className="text-[12px] text-on-surface-variant">
          {perf.live ? "atualizando a cada 5s" : `última atualização ${fmtTime(perf.updatedAt)}`}
        </span>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-stack-gap md:gap-gutter mb-8">
        <Kpi label="Throughput" icon="speed" value={num(m.throughput_msg_per_s, 0)} unit="msg/s" accent="secondary-fixed-dim" />
        <Kpi label="Mensagens" icon="bar_chart" value={num(m.total_published)} />
        <Kpi label="Latência média" icon="timer" value={num(m.avg_latency_ms, 1)} unit="ms" />
        <Kpi label="Taxa de erro" icon="check_circle" value={num(m.error_rate_pct, 2)} unit="%" accent={m.error_rate_pct > 0 ? "error" : "ok"} />
      </section>

      <Card className="p-6 mb-8">
        <h2 className="text-title-sm mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-secondary-fixed-dim">show_chart</span> Throughput ao vivo <span className="text-on-surface-variant text-body-sm">(msg/s · últimos 30 min)</span></h2>
        {perf.series && perf.series.length > 1 ? (
          <div className="w-full h-[240px]">
            <ResponsiveContainer>
              <AreaChart data={perf.series}>
                <defs>
                  <linearGradient id="gthr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2fd9f4" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2fd9f4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#424754" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="ts" tickFormatter={fmtTime} stroke="#8c909f" fontSize={11} />
                <YAxis stroke="#8c909f" fontSize={11} />
                <Tooltip labelFormatter={fmtTime} contentStyle={chartTip} />
                <Area type="monotone" dataKey="throughput_msg_per_s" name="msg/s" stroke="#2fd9f4" fill="url(#gthr)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-on-surface-variant text-body-sm py-8 text-center">Aguardando pontos do teste - o load test publica a cada 5s enquanto roda.</div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <Card className="p-6">
          <h2 className="text-title-sm mb-5 flex items-center gap-2"><span className="material-symbols-outlined text-primary">leaderboard</span> Latência por percentil</h2>
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center gap-3 mb-4">
              <span className="w-10 text-on-surface-variant text-body-sm">{k}</span>
              <div className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(v / maxP) * 100}%`, background: "linear-gradient(90deg,#4d8eff,#ffb786)" }} />
              </div>
              <span className="w-20 text-right text-body-sm font-semibold font-mono-data">{num(v, 1)} ms</span>
            </div>
          ))}
        </Card>
        <Card className="p-6">
          <h2 className="text-title-sm mb-5 flex items-center gap-2"><span className="material-symbols-outlined text-secondary-fixed-dim">description</span> Resumo do experimento</h2>
          <table className="w-full text-body-sm">
            <tbody>
              <Row k="Devices no teste" v={num(m.total_devices)} />
              <Row k="Requisições/device" v={num(m.requests_per_device)} />
              <Row k="Intervalo" v={`${num(m.interval_ms)} ms`} />
              <Row k="Total publicado" v={num(m.total_published)} />
              <Row k="Erros" v={num(m.total_errors)} />
              <Row k="Quedas simuladas" v={num(m.total_falls_simulated)} />
            </tbody>
          </table>
          {perf.updatedAt && (
            <div className="mt-4 pt-3 border-t border-outline-variant/50 flex justify-between text-[12px] text-on-surface-variant">
              <span>Status: <span className={perf.live ? "text-ok" : "text-on-surface-variant"}>{perf.live ? "Em andamento" : "Concluído"}</span></span>
              <span>{perf.live ? "Atualizado" : "Último teste"}: {new Date(perf.updatedAt).toLocaleString("pt-BR")}</span>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function Row({ k, v }) {
  return (
    <tr className="border-b border-outline-variant/30 last:border-0">
      <td className="py-2.5 text-on-surface-variant">{k}</td>
      <td className="py-2.5 text-right font-semibold font-mono-data">{v}</td>
    </tr>
  );
}

/* ============ Sistema ============ */
function System({ sys, history }) {
  if (!sys) {
    return (
      <Card className="p-6">
        <h2 className="text-title-sm mb-2">Métricas de sistema indisponíveis</h2>
        <p className="text-on-surface-variant text-body-sm">Disponível quando o dashboard roda no servidor (Linux/WSL). Lê CPU/RAM do host via /proc.</p>
      </Card>
    );
  }
  const tooltipStyle = { background: "#0b0e15", border: "1px solid #424754", borderRadius: 10, fontSize: 12 };
  const axis = { stroke: "#8c909f", fontSize: 11 };
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter mb-8">
        <Card className="p-6">
          <h2 className="text-title-sm flex items-center gap-2 mb-4"><span className="material-symbols-outlined text-primary">memory</span> CPU do servidor</h2>
          <div className="text-display-lg">{num(sys.cpuPct, 1)}<span className="text-body-sm text-on-surface-variant font-normal ml-1">%</span></div>
          <div className="mt-4 w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
            <div className="h-2 rounded-full transition-all" style={{ width: `${sys.cpuPct}%`, background: "linear-gradient(90deg,#4d8eff,#2fd9f4)" }} />
          </div>
          <div className="mt-2 text-[12px] text-on-surface-variant">Carga atual do host do middleware</div>
        </Card>
        <Card className="p-6">
          <h2 className="text-title-sm flex items-center gap-2 mb-4"><span className="material-symbols-outlined text-secondary-fixed-dim">developer_board</span> Memória RAM</h2>
          <div className="text-display-lg">{num(sys.mem.pct, 1)}<span className="text-body-sm text-on-surface-variant font-normal ml-1">%</span></div>
          <div className="mt-4 w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
            <div className="h-2 rounded-full transition-all" style={{ width: `${sys.mem.pct}%`, background: "linear-gradient(90deg,#2fd9f4,#5de6ff)" }} />
          </div>
          <div className="mt-2 text-[12px] text-on-surface-variant">{num(sys.mem.usedMb)} MB usados / {num(sys.mem.totalMb)} MB total</div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-title-sm">Uso ao vivo <span className="text-on-surface-variant text-body-sm">(CPU % e RAM %)</span></h2>
          <div className="flex items-center gap-4 text-[12px]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-primary-container" /> CPU</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-secondary-fixed-dim" /> RAM</span>
            <span className="flex items-center gap-1.5"><span className="w-3 border-t-2 border-dashed" style={{ borderColor: "#ff5449" }} /> limiar {ALERT_THRESHOLD}%</span>
          </div>
        </div>
        <div className="w-full h-[280px]">
          <ResponsiveContainer>
            <ComposedChart data={history}>
              <defs>
                <linearGradient id="gcpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4d8eff" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#4d8eff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#424754" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="ts" tickFormatter={fmtTime} {...axis} />
              <YAxis domain={[0, 100]} {...axis} />
              <Tooltip labelFormatter={fmtTime} contentStyle={tooltipStyle} />
              <ReferenceLine y={ALERT_THRESHOLD} stroke="#ff5449" strokeDasharray="5 4" strokeWidth={1.5} label={{ value: `limiar ${ALERT_THRESHOLD}%`, fill: "#ff5449", fontSize: 11, position: "insideTopRight" }} />
              <Area type="monotone" dataKey="cpu" name="CPU %" stroke="#4d8eff" fill="url(#gcpu)" strokeWidth={2} isAnimationActive={false} />
              <Line type="monotone" dataKey="ram" name="RAM %" stroke="#2fd9f4" dot={false} strokeWidth={2} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}
