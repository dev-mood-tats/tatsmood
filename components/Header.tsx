import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentCart } from "@/lib/cart-session";
import { getMenusSafe } from "@/lib/wordpress/content";
import { CartDrawer } from "./CartDrawer";
import { HeaderShell } from "./HeaderShell";
import { MobileMenu, NavMenu } from "./NavMenu";

/** Lee el carrito (cookie + Store API) y los menús de WordPress, por eso va dentro de <Suspense>. */
async function HeaderNav() {
  await connection();
  const [cart, menus] = await Promise.all([
    getCurrentCart().catch((e) => {
      console.error("[carrito] No se pudo cargar:", e);
      return null;
    }),
    getMenusSafe(),
  ]);
  return (
    <nav className="flex items-center gap-[15px] lg:gap-6">
      <NavMenu menus={menus} />
      <CartDrawer cart={cart} />
      <MobileMenu menus={menus} />
    </nav>
  );
}

export function Header() {
  return (
    <HeaderShell>
      <div className="flex h-[55px] items-center lg:h-16 justify-between px-5 lg:px-[15px]">
        <Link href="/" className="shrink-0">
          {/* Logo SVG de la web real, a 80px de ancho. Va en blanco: con el modo de fusión
              "exclusion" de la cabecera sale negro sobre blanco e invertido sobre fotos. En
              móvil no hay fusión, así que se invierte a negro; en las fichas de producto en
              móvil (cabecera siempre blanca) también. Es un SVG: <img> normal (next/image
              no lo optimizaría). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tatsmood-logo.svg" alt="tatsmood" width={80} height={29} className="h-auto w-[60px] group-data-[scrolled=true]/header:invert lg:w-20 lg:group-data-[scrolled=true]/header:invert-0" />
        </Link>
        <Suspense
          fallback={
            <nav className="flex items-center gap-[15px] lg:gap-6">
              <span className="hidden lg:inline">Search</span>
              <span className="hidden lg:inline">Menu</span>
              <span>
                <span className="hidden lg:inline">Cart </span>(·)
              </span>
            </nav>
          }
        >
          <HeaderNav />
        </Suspense>
      </div>
    </HeaderShell>
  );
}
