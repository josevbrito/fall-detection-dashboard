"use client";

import { useState, useRef, useEffect, useMemo } from "react";

// Combobox com busca (estilo select2), tema Stitch.
export default function SearchSelect({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options;
    return list.slice(0, 60);
  }, [options, query]);

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 18 }}>
          search
        </span>
        <input
          className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant rounded-md pl-10 pr-3 py-2.5 text-body-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
          value={open ? query : selected ? selected.name : ""}
          placeholder={placeholder || "Buscar device..."}
          onFocus={() => { setOpen(true); setQuery(""); }}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        />
      </div>
      {open && (
        <div className="absolute z-30 top-[calc(100%+6px)] left-0 right-0 bg-surface-container-high border border-outline-variant rounded-md max-h-[260px] overflow-y-auto shadow-2xl">
          {filtered.length === 0 && (
            <div className="px-3 py-3 text-on-surface-variant text-body-sm">Nenhum device encontrado</div>
          )}
          {filtered.map((o) => (
            <div
              key={o.id}
              onClick={() => { onChange(o.id); setOpen(false); }}
              className={
                "px-3 py-2 text-body-sm cursor-pointer font-mono-data " +
                (o.id === value ? "bg-primary text-on-primary" : "hover:bg-primary hover:text-on-primary text-on-surface-variant")
              }
            >
              {o.name}
            </div>
          ))}
          {query.trim() === "" && options.length > 60 && (
            <div className="px-3 py-2 text-on-surface-variant text-[12px]">
              +{options.length - 60} devices… digite para filtrar
            </div>
          )}
        </div>
      )}
    </div>
  );
}
