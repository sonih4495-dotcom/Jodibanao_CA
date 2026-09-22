import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/browse", "/success-stories", "/membership", "/login", "/register"],
      disallow: ["/dashboard", "/messages", "/profile/edit", "/admin"],
    },
    sitemap: "https://jodibanao.com/sitemap.xml",
  };
}
