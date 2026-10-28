import { HomeFooterFlag } from "./HomeFooterFlag";
import { focalPosition, getHomeSettings, getMenusSafe, type MenuItem } from "@/lib/wordpress/content";
import { MenuLink } from "./MenuLink";

// Final de la home de la web real: foto a pantalla completa con el texto de bienvenida y
// las listas de Collections / Type en blanco, centrado en vertical. El footer normal se
// pinta encima, abajo del todo (ver components/Footer.tsx). Posiciones en % del ancho
// medidas en tatsmood.com.
export async function HomeClosing() {
  // Texto y foto: «Web tatsmood» en WordPress. Listas: menús Collections y Type.
  const [menus, settings] = await Promise.all([getMenusSafe(), getHomeSettings().catch(() => null)]);

  const list = (items: MenuItem[]) => (
    <ul className="space-y-[5px]">
      {items.map((item) => (
        <li key={item.href + item.label}>
          <MenuLink item={item} className="transition-opacity hover:opacity-60 duration-300" />
        </li>
      ))}
    </ul>
  );


  return (
    <section
      id="home-closing"
      className="relative flex flex-col bg-cover bg-top px-5 pb-[323px] pt-[140px] text-white lg:block lg:h-screen lg:p-0"
      style={
        settings?.background
          ? { backgroundImage: `url(${settings.background.url})`, backgroundPosition: focalPosition(settings.background) }
          : undefined
      }
    >
      <HomeFooterFlag />
      {/* Velo negro al 30% sobre la foto, igual que en la web real */}
      <div aria-hidden className="absolute inset-0 bg-black/30" />
      <div className="reveal relative lg:absolute lg:inset-x-0 lg:top-1/2 lg:h-[127px] lg:-translate-y-1/2">
        <p className="lg:absolute lg:left-[20.26%] lg:top-0 lg:w-[29.4%] lg:max-w-none">{settings?.intro}</p>

        <div className="mt-[44px] grid grid-cols-2 gap-6 lg:mt-0 lg:contents">
          <div className="flex flex-col gap-[8px] lg:absolute lg:left-[54.73%] lg:top-0 lg:flex-row lg:gap-[15px]">
            <p>Collections</p>
            {list(menus.colecciones)}
          </div>
          <div className="flex flex-col gap-[8px] lg:absolute lg:left-[71.54%] lg:top-0 lg:flex-row lg:gap-[15px]">
            <p>Type</p>
            {list(menus.tienda)}
          </div>
        </div>
      </div>
    </section>
  );
}
