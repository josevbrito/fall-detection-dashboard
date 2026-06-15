"use client";

export default function TopBar({ title, online, updatedText }) {
  return (
    <header className="bg-surface-container-low/80 sticky top-0 z-40 w-full border-b border-outline-variant backdrop-blur-md flex justify-between items-center h-16 px-gutter">
      <div className="flex items-center gap-4">
        <h2 className="text-title-sm font-bold text-on-surface">{title}</h2>
        <div className="hidden sm:flex items-center gap-2 bg-surface-container-highest px-3 py-1.5 rounded-full border border-outline-variant/50">
          <span
            className={
              "w-2 h-2 rounded-full " +
              (online ? "bg-ok status-pulse" : "bg-error")
            }
          />
          <span className="text-on-surface-variant text-[10px] font-semibold tracking-wider">
            {online ? "SISTEMA OPERACIONAL" : "SEM CONEXÃO"}
          </span>
        </div>
        {updatedText && (
          <span className="hidden lg:inline text-on-surface-variant text-[11px]">{updatedText}</span>
        )}
      </div>
    </header>
  );
}
