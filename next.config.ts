import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * pdfkit en Vercel/serverless:
   *
   * El módulo carga sus archivos .afm (font metrics de Helvetica, Times, etc.)
   * de forma dinámica con `fs.readFileSync`. Next.js no los detecta en el
   * tracing y los excluye del bundle del lambda → ENOENT en runtime.
   *
   * Solución doble:
   * 1) `serverExternalPackages` evita que Next/Webpack intente bundlear
   *    pdfkit en el server build. Lo carga desde node_modules en runtime,
   *    junto con todos sus assets.
   * 2) `outputFileTracingIncludes` además fuerza a Vercel a copiar la
   *    carpeta completa de pdfkit (incluye `js/data/*.afm`) al lambda.
   *
   * Cinturón + tirantes para no volver a caer en este bug.
   */
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/api/**/*": [
      "./node_modules/pdfkit/**/*",
    ],
  },
};

export default nextConfig;
