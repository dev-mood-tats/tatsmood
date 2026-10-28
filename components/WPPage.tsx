import { notFound } from "next/navigation";
import { getPage } from "@/lib/wordpress/content";
import { pageMetadata, plainText } from "@/lib/seo";

/** SEO de una página de WordPress: su título y el principio del texto como descripción. */
export async function wpPageMetadata(slug: string) {
  const page = await getPage(slug);
  return page ? pageMetadata({ title: page.title, description: plainText(page.html), path: `/${slug}` }) : {};
}

/**
 * Páginas de texto (Legal notice, Privacy policy, Cookie policy): título y contenido de la
 * página de WordPress con el mismo slug. Tat las edita en WordPress → Páginas.
 */
export async function WPPage({ slug }: { slug: string }) {
  const page = await getPage(slug);
  if (!page) notFound();
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6 lg:px-[15px]">
      <p className="reveal">{page.title}</p>
      <div className="wp-page reveal-children mt-8" dangerouslySetInnerHTML={{ __html: page.html }} />
    </main>
  );
}
