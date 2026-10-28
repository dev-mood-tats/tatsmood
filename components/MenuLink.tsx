import Link from "next/link";
import type { MenuItem } from "@/lib/wordpress/content";

/** Elemento de un menú de WordPress: enlace interno de Next.js o externo en otra pestaña. */
export function MenuLink({ item, className, onClick }: { item: MenuItem; className?: string; onClick?: () => void }) {
  return item.external ? (
    <a href={item.href} target="_blank" rel="noreferrer" className={className} onClick={onClick}>
      {item.label}
    </a>
  ) : (
    <Link href={item.href} className={className} onClick={onClick}>
      {item.label}
    </Link>
  );
}
