import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

// robots.txt: todo indexable salvo el checkout, las páginas de pedido y la API.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/checkout", "/order/", "/api/"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
