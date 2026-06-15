"use client";

const NAV = [
  { id: "overview", label: "Visão Geral", icon: "dashboard" },
  { id: "falls", label: "Quedas", icon: "emergency_home" },
  { id: "performance", label: "Desempenho", icon: "insights" },
  { id: "system", label: "Sistema", icon: "memory" },
];

function Icon({ name, className = "" }) {
  return <span className={"material-symbols-outlined " + className}>{name}</span>;
}

export default function Sidebar({ tab, setTab }) {
  return (
    <nav className="bg-surface-container-lowest fixed left-0 top-0 h-full w-[260px] border-r border-outline-variant flex-col py-6 px-4 z-50 hidden md:flex">
      <div className="mb-10 px-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-container/10 border border-primary-container/30 flex items-center justify-center text-primary">
          <Icon name="shield" className="filled" />
        </div>
        <div>
          <h1 className="font-bold text-on-surface text-[22px] tracking-tight leading-none">FallGuard</h1>
          <p className="text-on-surface-variant mt-1 text-[10px] font-semibold tracking-wider">MONITORAMENTO IOT</p>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {NAV.map((n) => {
          const active = tab === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-200 text-left " +
                (active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high")
              }
            >
              <Icon name={n.icon} />
              <span className="text-body-md">{n.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
