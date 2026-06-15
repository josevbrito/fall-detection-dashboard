"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Legend, AreaChart, Area,
} from "recharts";

const REFRESH_MS = 5000;
const fmtTime = (ts) => (ts ? new Date(ts).toLocaleTimeString("pt-BR") : "");

const tooltipStyle = {
  background: "#0b0e15",
  border: "1px solid #424754",
  borderRadius: 10,
  fontSize: 12,
};
const axis = { stroke: "#8c909f", fontSize: 11 };

export default function DeviceCharts({ deviceId, deviceName }) {
  const [series, setSeries] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!deviceId) return;
    let alive = true;
    async function load() {
      try {
        const res = await fetch(`/api/telemetry?deviceId=${deviceId}&minutes=30`).then((r) => r.json());
        if (alive) { setSeries(res.series || []); setLoaded(true); }
      } catch { if (alive) setSeries([]); }
    }
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { alive = false; clearInterval(id); };
  }, [deviceId]);

  if (!deviceId) {
    return <div className="text-on-surface-variant text-body-sm">Selecione um device para ver a telemetria.</div>;
  }
  const empty = loaded && series.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-label-caps text-on-surface-variant uppercase mb-2">
          Magnitude da aceleração (g) — últimos 30 min
        </p>
        <div className="w-full h-[200px]">
          <ResponsiveContainer>
            <AreaChart data={series}>
              <defs>
                <linearGradient id="gmag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2fd9f4" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2fd9f4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#424754" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="ts" tickFormatter={fmtTime} {...axis} />
              <YAxis {...axis} />
              <Tooltip labelFormatter={fmtTime} contentStyle={tooltipStyle} />
              <ReferenceLine y={2} stroke="#ffb4ab" strokeDasharray="4 4" label={{ value: "limiar queda", fill: "#ffb4ab", fontSize: 10, position: "insideTopRight" }} />
              <Area type="monotone" dataKey="magnitude" stroke="#2fd9f4" fill="url(#gmag)" strokeWidth={2} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <p className="text-label-caps text-on-surface-variant uppercase mb-2">
          Eixos do acelerômetro (g) — x / y / z
        </p>
        <div className="w-full h-[200px]">
          <ResponsiveContainer>
            <LineChart data={series}>
              <CartesianGrid stroke="#424754" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="ts" tickFormatter={fmtTime} {...axis} />
              <YAxis {...axis} />
              <Tooltip labelFormatter={fmtTime} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="accel_x" name="X" stroke="#adc6ff" dot={false} strokeWidth={1.6} isAnimationActive={false} />
              <Line type="monotone" dataKey="accel_y" name="Y" stroke="#d0bcff" dot={false} strokeWidth={1.6} isAnimationActive={false} />
              <Line type="monotone" dataKey="accel_z" name="Z" stroke="#ffb786" dot={false} strokeWidth={1.6} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {deviceName && (
        <div className="text-on-surface-variant text-[12px]">
          Device: <span className="font-mono-data text-on-surface">{deviceName}</span>
        </div>
      )}
      {empty && (
        <div className="text-on-surface-variant text-body-sm">
          Sem dados recentes para este device. Rode um load test para gerar telemetria.
        </div>
      )}
    </div>
  );
}
