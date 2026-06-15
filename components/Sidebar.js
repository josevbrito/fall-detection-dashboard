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

export default function Sidebar({ tab, setTab, open = false, onClose }) {
  const pick = (id) => {
    setTab(id);
    onClose?.();
  };
  return (
    <>
      {/* overlay escurece o conteúdo quando o drawer está aberto no mobile */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          aria-hidden="true"
        />
      )}

      <nav
        className={
          "bg-surface-container-lowest fixed left-0 top-0 h-full w-[260px] border-r border-outline-variant flex flex-col py-6 px-4 z-50 transition-transform duration-300 md:translate-x-0 " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="mb-10 px-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-container/10 border border-primary-container/30 flex items-center justify-center text-primary">
            <Icon name="shield" className="filled" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-on-surface text-[22px] tracking-tight leading-none">FallGuard</h1>
            <p className="text-on-surface-variant mt-1 text-[10px] font-semibold tracking-wider">MONITORAMENTO IOT</p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-on-surface-variant hover:text-on-surface p-1"
            aria-label="Fechar menu"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="flex-1 space-y-2">
          {NAV.map((n) => {
            const active = tab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => pick(n.id)}
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
    </>
  );
}
