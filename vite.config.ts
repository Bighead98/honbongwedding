import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { invitation } from "./src/config/invitation.ts";

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
export default defineConfig({
  plugins: [
    react(),
    {
      name: "fontsource-woff2-only",
      enforce: "pre",
      transform(code, id) {
        if (id.includes("@fontsource") && id.endsWith(".css"))
          return code.replace(/,\s*url\([^)]*\.woff\)\s*format\('woff'\)/g, "");
      },
    },
    {
      name: "invitation-static-metadata",
      transformIndexHtml(html, context) {
        let origin = context.server ? "http://localhost:5173" : "";
        try {
          const site = new URL(invitation.share.siteUrl);
          if (["http:", "https:"].includes(site.protocol)) origin = site.origin;
        } catch { /* 미정 주소로도 로컬 초안과 빌드를 유지합니다. */ }
        const image = origin
          ? new URL(invitation.share.image, origin).href
          : invitation.share.image;
        const metadata = {
          TITLE: invitation.share.title,
          DESCRIPTION: invitation.share.description,
          IMAGE: image,
          URL: origin,
          CANONICAL: origin
            ? `<link rel="canonical" href="${escape(origin)}" />`
            : "",
        };
        return html.replace(/__([A-Z]+)__/g, (_, key: keyof typeof metadata) =>
          key === "CANONICAL" ? metadata[key] : escape(metadata[key] ?? ""),
        );
      },
    },
  ],
  build: { target: ["es2020", "safari14"], sourcemap: false },
});
