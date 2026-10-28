"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, getConsent, type Consent } from "@/lib/consent";
import { GA_ID, META_PIXEL_ID } from "@/lib/cookies";

/**
 * Scripts que necesitan permiso: solo se cargan si su herramienta está configurada
 * (NEXT_PUBLIC_GA_ID, NEXT_PUBLIC_META_PIXEL_ID) y el visitante ha aceptado su categoría.
 * Sin permiso no se carga nada, así que no se crea ninguna de sus cookies.
 */
export function ConsentScripts() {
  const [consent, setConsent] = useState<Consent | null>(null);

  useEffect(() => {
    // La cookie solo se puede leer en el navegador, después de hidratar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(getConsent());
    const onChange = (e: Event) => setConsent((e as CustomEvent<Consent>).detail);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  return (
    <>
      {GA_ID && consent?.performance && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {META_PIXEL_ID && consent?.targeting && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
