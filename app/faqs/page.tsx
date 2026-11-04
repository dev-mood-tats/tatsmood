import { notFound } from "next/navigation";
import { getPage } from "@/lib/wordpress/content";
import { wpPageMetadata } from "@/components/WPPage";

export const generateMetadata = () => wpPageMetadata("faqs");

// Contenido: WordPress → Páginas → «FAQs». Cada título agrupa preguntas y cada bloque
// «Detalles» es una pregunta (lo de fuera) con su respuesta (lo de dentro).
export default async function FaqsPage() {
  const page = await getPage("faqs");
  if (!page) notFound();
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="reveal">{page.title}</h1>
      <div className="reveal-children mt-10 space-y-10">
        {(page.faqs ?? []).map((group, g) => (
          <section key={`${group.title}-${g}`}>
            {group.title && <h2>{group.title}</h2>}
            <dl className="mt-4 space-y-6">
              {group.items.map((item, i) => (
                <div key={`${item.question}-${i}`}>
                  <dt>{item.question}</dt>
                  <dd className="wp-page mt-1" dangerouslySetInnerHTML={{ __html: item.answer }} />
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </main>
  );
}
