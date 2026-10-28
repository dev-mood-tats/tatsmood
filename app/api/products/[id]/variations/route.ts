import { NextResponse } from "next/server";
import { getProductVariations } from "@/lib/woocommerce/catalog";

// Variaciones (tallas) de un producto, para el selector rápido de las fichas de producto
// en los grids (se piden solo al pasar el ratón por encima, no en cada carga de página).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  try {
    const variations = await getProductVariations(productId);
    return NextResponse.json(variations);
  } catch (e) {
    console.error("[variaciones] Error:", e);
    return NextResponse.json({ error: "Variations could not be loaded" }, { status: 502 });
  }
}
