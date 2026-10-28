"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OPEN_CONSENT_EVENT, getConsent, saveConsent } from "@/lib/consent";
import { COOKIE_CATEGORIES, OPTIONAL_CATEGORIES, type CookieCategory, type OptionalCategory } from "@/lib/cookies";
import { IconChevronDown } from "./Icons";

type Choice = Record<OptionalCategory, boolean>;
const none: Choice = { performance: false, targeting: false };
const all: Choice = { performance: true, targeting: true };

const link = "underline underline-offset-2 transition-opacity duration-300 hover:opacity-60";
const button = "h-[45px] flex-1 bg-surface px-[10px] leading-[20px] transition-colors duration-300 hover:bg-foreground hover:text-background";

/**
 * Banner de cookies. Funciona como el de palomawool.com:
 * - Aviso pequeño (diseño de tatsmood.com: caja blanca abajo, a la derecha y a 15px de los
 *   bordes en escritorio; en móvil respeta la barra inferior del iPhone)
 *   con «Learn more», «Accept», «Decline» (si hay cookies opcionales) y «Preferences».
 * - «Preferences» abre el panel «Manage consent preferences»: cada categoría con su
 *   explicación, su interruptor y el detalle de cada cookie (nombre, quién la pone, cuánto
 *   dura y para qué sirve). Las categorías salen de lib/cookies.ts.
 * Las cookies opcionales empiezan apagadas (el RGPD no admite casillas marcadas de antemano)
 * y sus scripts solo se cargan con permiso (components/ConsentScripts.tsx).
 * Sale hasta que el visitante elige; cualquier enlace a «#cookie-settings» abre el panel.
 */
export function CookieBanner() {
  const [view, setView] = useState<"closed" | "banner" | "prefs">("closed");
  const [choice, setChoice] = useState<Choice>(none);

  useEffect(() => {
    // La cookie solo se puede leer en el navegador: se decide aquí, después de hidratar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!getConsent()) setView("banner");
    const openPrefs = () => {
      const c = getConsent();
      setChoice(c ? { performance: c.performance, targeting: c.targeting } : none);
      setView("prefs");
    };
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest?.('a[href$="#cookie-settings"]')) {
        e.preventDefault();
        openPrefs();
      }
    };
    window.addEventListener(OPEN_CONSENT_EVENT, openPrefs);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener(OPEN_CONSENT_EVENT, openPrefs);
      document.removeEventListener("click", onClick);
    };
  }, []);

  if (view === "closed") return null;

  const save = (value: Choice) => {
    setView("closed");
    saveConsent(value);
  };
  const hasOptional = OPTIONAL_CATEGORIES.length > 0;

  if (view === "banner") {
    return (
      <div
        role="dialog"
        aria-label="Cookies"
        className="fixed inset-x-0 bottom-0 z-50 grid gap-[25px] bg-background px-5 pb-[calc(26px+env(safe-area-inset-bottom))] pt-[36px] lg:inset-x-auto lg:bottom-[15px] lg:right-[15px] lg:w-[500px] lg:pb-[26px]"
      >
        <p className="leading-[18px]">
          {hasOptional
            ? "We use cookies to make the shop work and, with your permission, to understand how the website is used and to measure our campaigns. "
            : "We only use the cookies the shop needs to work: your cart, the checkout and your session. "}
          <Link href="/cookie-policy" className={link}>
            Learn more
          </Link>
        </p>
        <div className="flex gap-[10px]">
          <button type="button" className={button} onClick={() => save(all)}>
            Accept
          </button>
          {hasOptional && (
            <button type="button" className={button} onClick={() => save(none)}>
              Decline
            </button>
          )}
          <button type="button" className={button} onClick={() => setView("prefs")}>
            Preferences
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-white/[0.56]" onClick={(e) => e.target === e.currentTarget && setView(getConsent() ? "closed" : "banner")}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-prefs-title"
        className="flex max-h-[85svh] w-full flex-col gap-[25px] bg-background px-5 pb-[calc(25px+env(safe-area-inset-bottom))] pt-[25px] lg:max-h-[70vh] lg:px-[50px] lg:py-[30px]"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-[30px] gap-y-[10px]">
          <p id="cookie-prefs-title">Manage consent preferences</p>
          {hasOptional && (
            <div className="flex gap-[30px]">
              <button type="button" className={link} onClick={() => save(none)}>
                Reject all
              </button>
              <button type="button" className={link} onClick={() => save(all)}>
                Accept all
              </button>
            </div>
          )}
        </div>

        <p className="max-w-[800px] leading-[18px]">
          We use cookies to make the website work{hasOptional ? ", to analyze its performance and to measure our campaigns" : ""}. Some
          cookies are essential for the shop to work correctly and cannot be disabled. Here you can see what each one does
          {hasOptional ? " and choose which ones you allow" : ""}. More information in our{" "}
          <Link href="/cookie-policy" className={link} onClick={() => setView(getConsent() ? "closed" : "banner")}>
            Cookie policy
          </Link>
          .
        </p>

        <div className="-mr-[10px] grid gap-[12px] overflow-y-auto pr-[10px]">
          {COOKIE_CATEGORIES.map((cat) => (
            <Category
              key={cat.id}
              category={cat}
              checked={cat.id === "necessary" ? true : choice[cat.id]}
              onChange={cat.id === "necessary" ? undefined : (v) => setChoice((c) => ({ ...c, [cat.id]: v }))}
            />
          ))}
        </div>

        <div className="flex justify-between">
          <button type="button" className={link} onClick={() => setView(getConsent() ? "closed" : "banner")}>
            Close
          </button>
          <button type="button" className={link} onClick={() => save(choice)}>
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
}

function Category({
  category,
  checked,
  onChange,
}: {
  category: CookieCategory;
  checked: boolean;
  onChange?: (value: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-[10px]">
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex flex-1 items-center gap-[10px] text-left">
          <IconChevronDown className={`shrink-0 transition-transform duration-300 ${open ? "" : "-rotate-90"}`} />
          {category.title}
        </button>
        {onChange ? (
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={category.title}
            onClick={() => onChange(!checked)}
            className={`relative h-[14px] w-[28px] shrink-0 rounded-full transition-colors duration-300 ${checked ? "bg-foreground" : "bg-line"}`}
          >
            <span className={`absolute top-[2px] size-[10px] rounded-full bg-white transition-[left] duration-300 ${checked ? "left-[16px]" : "left-[2px]"}`} />
          </button>
        ) : (
          <span className="shrink-0">Always allowed</span>
        )}
      </div>

      {open && (
        <div className="grid gap-[10px] pb-[6px] pl-[20px] pt-[10px]">
          <p className="max-w-[800px] leading-[18px]">{category.description}</p>
          <button type="button" className={`justify-self-start ${link}`} onClick={() => setDetails((v) => !v)} aria-expanded={details}>
            {details ? "Hide cookies details" : "Cookies details"}
          </button>
          {details && (
            <ul className="grid gap-[8px]">
              {category.cookies.map((c) => (
                <li key={c.name} className="bg-surface p-[10px]">
                  <dl className="grid grid-cols-[90px_1fr] gap-x-[10px] gap-y-[2px] leading-[18px]">
                    <dt className="text-foreground/50">Name</dt>
                    <dd>{c.name}</dd>
                    <dt className="text-foreground/50">Provider</dt>
                    <dd>{c.provider}</dd>
                    <dt className="text-foreground/50">Type</dt>
                    <dd>{c.type}</dd>
                    <dt className="text-foreground/50">Retention</dt>
                    <dd>{c.retention}</dd>
                    <dt className="text-foreground/50">Purpose</dt>
                    <dd>{c.purpose}</dd>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
