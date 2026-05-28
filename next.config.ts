import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * pdfkit en Vercel/serverless:
   * El módulo carga sus archivos .afm (font metrics de Helvetica, Times, etc.)
   * de forma dinámica con `fs.readFileSync`. Next.js no los detecta en el
   * tracing y los excluye del bundle del lambda → ENOENT en runtime.
   *
   * Solución: incluir explícitamente los archivos de fonts de pdfkit en
   * cualquier endpoint que use pdfkit (en este caso las rutas /api/**).
   */
  outputFileTracingIncludes: {
    "/api/**": [
      "./node_modules/pdfkit/js/data/**/*",
    ],
  },
};

export default nextConfig;
