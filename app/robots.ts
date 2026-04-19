import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/shadow" },
    sitemap: "https://jeetcreates.com/sitemap.xml",
  };
}
