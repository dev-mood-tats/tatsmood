"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { Menus } from "@/lib/wordpress/content";
import { MenuLink } from "./MenuLink";
import { IconClose, IconMenu, IconMinus, IconPlus } from "./Icons";
import { lockPageScroll } from "@/lib/scroll-lock";

// "Search" y "Menu" del header: igual que la web real, una abre un buscador a
// pantalla completa y la otra despliega un panel con las mismas listas del footer
// (Type / Collections / redes), que se editan en WordPress → Apariencia → Menús.
export function NavMenu({ menus }: { menus: Menus }) {
  const [open, setOpen] = useState<"search" | "menu" | null>(null);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const menuPanel = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  // Al abrir el buscador, el cursor ya está en el campo.
  useEffect(() => {
    if (open === "search") searchInput.current?.focus({ preventScroll: true });
  }, [open]);
  // Los paneles se pintan en <body> (portal): dentro de la cabecera heredarían su
  // modo de fusión "exclusion" y se verían invertidos.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Menú abierto: un clic en cualquier parte de la web que no sea el propio panel (ni el
  // botón «Menu», que ya lo abre y lo cierra) lo cierra. Con un listener en el documento y no
  // con una capa por encima, para que funcione también en la cabecera y el clic siga
  // haciendo lo suyo (un enlace navega, «Search» abre el buscador…).
  useEffect(() => {
    if (open !== "menu") return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (menuPanel.current?.contains(t) || menuButton.current?.contains(t)) return;
      setOpen(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function closeAll() {
    setOpen(null);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    closeAll();
    router.push(`/store?search=${encodeURIComponent(query.trim())}`);
    // La próxima vez que se abra el buscador, vacío.
    setQuery("");
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(open === "search" ? null : "search")} className="hidden hover:opacity-60 lg:inline">
        Search
      </button>
      <button ref={menuButton} type="button" onClick={() => setOpen(open === "menu" ? null : "menu")} className="hidden hover:opacity-60 lg:inline">
        Menu
      </button>

      {/* Buscador a pantalla completa: siempre montado, con la misma entrada que el menú
          (fundido de 0,3 s del panel y el contenido un instante después). */}
      {mounted && createPortal(
        // Campo centrado con el 59,2% del ancho (medidas de la web real) y línea gris de 0,5px.
        <div
          inert={open !== "search"}
          className={`fixed inset-0 z-30 bg-background transition-opacity duration-300 ease-out ${
            open === "search" ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {/* Misma X y misma posición que la del carrito lateral */}
          <button type="button" onClick={closeAll} className="absolute right-5 top-4 z-10 flex h-6 items-center lg:right-[15px]" aria-label="Close search">
            <IconClose />
          </button>
          <form
            onSubmit={handleSearchSubmit}
            className={`absolute left-[20.4%] top-1/2 w-[59.2%] -translate-y-1/2 transition-opacity duration-300 ${
              open === "search" ? "opacity-100 delay-100" : "opacity-0"
            }`}
          >
            <input
              ref={searchInput}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="h-6 w-full border-b-[0.5px] border-muted bg-transparent text-foreground outline-none placeholder:text-foreground"
            />
          </form>
        </div>,
        document.body,
      )}

      {/* El panel está siempre montado para poder animarlo al abrir y al cerrar con un
          fundido (solo opacidad, sin movimiento); el contenido aparece un instante después. */}
      {mounted && createPortal(
        <div
          ref={menuPanel}
          inert={open !== "menu"}
          className={`fixed inset-x-0 top-0 z-10 hidden border-b border-line bg-background px-5 pb-[52px] pt-[105px] transition-opacity duration-300 ease-out lg:px-[15px] lg:block lg:pl-[15.5%] ${
            open === "menu" ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div
            className={`flex flex-wrap gap-x-10 gap-y-8 leading-[22px] transition-opacity duration-300 lg:gap-0 [&>ul]:lg:w-[11.1vw] ${
              open === "menu" ? "opacity-100 delay-100" : "opacity-0"
            }`}
          >
            {[menus.tienda, menus.colecciones, menus.redes].map((items, i) => (
              <ul key={i}>
                {items.map((item) => (
                  <li key={item.href + item.label}>
                    <MenuLink item={item} onClick={item.external ? undefined : closeAll} className="transition-opacity hover:opacity-60 duration-300" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

// Menú de móvil/tablet (la web real lo usa por debajo de 1025px): icono de dos rayas
// que abre una capa blanca a pantalla completa con el buscador, los tipos, las
// colecciones plegadas en un desplegable y las redes, todo centrado en vertical.
export function MobileMenu({ menus }: { menus: Menus }) {
  const [open, setOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    return lockPageScroll();
  }, [open]);

  // Al cerrarse el menú, «Collections» vuelve a plegarse para la próxima vez. Cuando ya
  // ha terminado el fundido de salida (0,3 s), para que no se vea cómo se pliega.
  useEffect(() => {
    if (open || !collectionsOpen) return;
    const t = window.setTimeout(() => setCollectionsOpen(false), 300);
    return () => window.clearTimeout(t);
  }, [open, collectionsOpen]);

  function close() {
    setOpen(false);
  }

  // Al pulsar un enlace el menú no se cierra en el acto: se queda abierto hasta que la
  // página nueva ya está pintada debajo (Next cambia la URL justo cuando la muestra), y
  // entonces se va con su fundido. Así no se ve la página anterior ni un hueco en blanco.
  const navTimer = useRef<number | null>(null);
  function closeAfterNavigation(href: string) {
    const here = () => location.pathname + location.search;
    const target = new URL(href, location.href);
    if (target.pathname + target.search === here()) {
      close();
      return;
    }
    const from = here();
    const started = performance.now();
    if (navTimer.current) window.clearInterval(navTimer.current);
    navTimer.current = window.setInterval(() => {
      // 8 s como máximo, por si la navegación fallara.
      if (here() !== from || performance.now() - started > 8000) {
        window.clearInterval(navTimer.current!);
        navTimer.current = null;
        requestAnimationFrame(() => close());
      }
    }, 30);
  }
  useEffect(() => () => {
    if (navTimer.current) window.clearInterval(navTimer.current);
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    const href = `/store?search=${encodeURIComponent(query.trim())}`;
    closeAfterNavigation(href);
    router.push(href);
    // La próxima vez que se abra el menú, el buscador vacío.
    setQuery("");
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex h-6 items-center lg:hidden" aria-label="Open menu">
        <IconMenu className="h-[7px] w-[14px]" />
      </button>

      {/* Siempre montado: entra y sale con el mismo fundido (0,3 s) */}
      {mounted &&
        createPortal(
          <div
            inert={!open}
            className={`fixed inset-0 z-30 overflow-y-auto overscroll-contain bg-background transition-opacity duration-300 ease-out lg:hidden ${
              open ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <button type="button" onClick={close} className="absolute right-5 top-4 z-10 flex h-6 items-center lg:right-[15px]" aria-label="Close menu">
              <IconClose />
            </button>
            <div className="flex min-h-full flex-col justify-center px-5 py-20 lg:px-[15px]">
              <form onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full border-b-[0.5px] border-muted bg-transparent pb-1 text-foreground outline-none placeholder:text-foreground"
                />
              </form>

              {/* Tipos: se pliegan cuando se abre "Collections" (y vuelven al cerrarlo) */}
              <div
                className={`mt-[52px] grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                  collectionsOpen ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
                }`}
              >
                <ul className="overflow-hidden leading-[27px]" inert={collectionsOpen}>
                  {menus.tienda.map((item) => (
                    <li key={item.href + item.label}>
                      <MenuLink item={item} onClick={item.external ? undefined : () => closeAfterNavigation(item.href)} />
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setCollectionsOpen((v) => !v)}
                className="mt-[10px] flex items-center gap-2 text-left leading-[27px]"
                aria-expanded={collectionsOpen}
              >
                <span aria-hidden className="flex w-3 items-center">{collectionsOpen ? <IconMinus /> : <IconPlus />}</span>
                Collections
              </button>
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                  collectionsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <ul className="overflow-hidden leading-[27px]" inert={!collectionsOpen}>
                  {menus.colecciones.map((item) => (
                    <li key={item.href + item.label}>
                      <MenuLink item={item} onClick={item.external ? undefined : () => closeAfterNavigation(item.href)} />
                    </li>
                  ))}
                </ul>
              </div>

              <ul className="mt-[30px] leading-[22px]">
                {menus.redes.map((item) => (
                  <li key={item.href + item.label}>
                    <MenuLink item={item} onClick={item.external ? undefined : () => closeAfterNavigation(item.href)} />
                  </li>
                ))}
              </ul>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
