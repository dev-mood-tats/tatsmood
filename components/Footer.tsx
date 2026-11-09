import { getMenusSafe } from "@/lib/wordpress/content";
import { MenuLink } from "./MenuLink";

// Footer de la web real (el mismo en todas las páginas): una sola franja blanca con los
// enlaces legales a la izquierda, el copyright en el centro (con el crédito "Site by" en
// pequeño y al 30%) y las redes a la derecha.
// En la home va encima de la foto del final y en blanco, como en la web real. Eso lo
// hace el CSS (app/home.css) al detectar el bloque final de la home en la página, sin
// leer la URL: así el footer no impide que Next.js prerenderice las páginas.
// Enlaces de la izquierda y redes: WordPress → Apariencia → Menús («Footer» y «Redes sociales»).
export async function Footer() {
  const menus = await getMenusSafe();
  return (
    // En escritorio mide lo mismo que la cabecera (64px). La separación con el contenido
    // es fluida en escritorio: 10 % del alto de la pantalla, entre 60 y 150 px. Junto con
    // los márgenes de la tienda (también en svh), hace que en páginas cortas el footer
    // quepa en pantallas de portátil sin hacer scroll; en pantallas altas, 150 px.
    <footer
      className="site-footer mt-[100px] px-5 pb-[15px] pt-[15px] lg:mt-[clamp(60px,10svh,150px)] lg:flex lg:h-16 lg:items-center lg:px-[15px] lg:py-0"
    >
      {/* Móvil: todo en columna y alineado a la izquierda (legales, redes, copyright).
          Escritorio: una sola fila con los tres bloques. */}
      <div className="flex flex-col items-start lg:grid lg:w-full lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <nav className="flex flex-col gap-[5px] lg:flex-row lg:justify-self-start lg:gap-[15px]">
          {menus.footer.map((item) => (
            <MenuLink key={item.href + item.label} item={item} className="transition-opacity hover:opacity-60 duration-300" />
          ))}
        </nav>

        <div className="order-last mt-[20px] lg:order-none lg:mt-0 lg:text-center">
          <p>© 2026 by tatsmood</p>
          <a
            href="https://www.instagram.com/donthillhere/"
            target="_blank"
            rel="noreferrer"
            className="mt-[3px] block text-[10px] leading-[10px] opacity-30 transition-opacity duration-300 hover:opacity-60"
          >
            Site by Elvis Fabricio
          </a>
        </div>

        <nav className="mt-[30px] flex flex-col gap-[5px] lg:mt-0 lg:flex-row lg:justify-self-end lg:gap-[15px]">
          {menus.redes.map((item) => (
            <MenuLink key={item.href + item.label} item={item} className="transition-opacity hover:opacity-60 duration-300" />
          ))}
        </nav>
      </div>
    </footer>
  );
}
