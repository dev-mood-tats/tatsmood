"use client";

import { useState } from "react";
import { IconMinus, IconPlus } from "./Icons";

// Acordeón para "Fabric and care" / "Size guide" en la ficha de producto, con el
// contenido de los campos ACF desplegable_1 / desplegable_2. Como en la web real:
// sin líneas separadoras y con el icono (+ / —) justo al lado del título.
// Se abre y se cierra con una transición suave de altura y opacidad
// (grid-template-rows de 0fr a 1fr), no de golpe.
export function ProductAccordion({
  title,
  html,
  defaultOpen = false,
}: {
  title: string;
  html: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (!html) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-4 text-left"
      >
        <span>{title}</span>
        <span aria-hidden className="flex h-[9px] w-[9px] items-center justify-center">
          {open ? <IconMinus /> : <IconPlus />}
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden" inert={!open}>
          <div className="wp-content pt-1 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
}
