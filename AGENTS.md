<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Supabase pooler — connection strings (CRÍTICO)

Dos URLs distintas, con propósitos NO intercambiables:

- **`DATABASE_URL`** → transaction pooler, puerto **6543**. Usar en runtime serverless (Prisma client de la app, route handlers, server components).
- **`DIRECT_DATABASE_URL`** → session pooler, puerto **5432**. Usar **solo** para migraciones (`prisma db push`, `prisma migrate`, `prisma db seed`).

El session pooler tiene un límite duro de 15 conexiones en plan Free. Si Prisma client de la app lo usa en serverless, cualquier ráfaga de queries paralelas → `EMAXCONNSESSION` → 500 en producción.

`lib/prisma/client.ts` debe preferir `DATABASE_URL` y usar `pg.Pool` con `max: 1` por invocación. No cambiar este orden ni quitar el cap del pool sin discutir las implicaciones.

## Git — push policy en este repo

- Rama `main`: protegida. Solo se actualiza via PR mergeado (`gh pr merge`) tras aprobación explícita del usuario.
- Branches `sprint-N/...`, `fix/...`, `feat/...`, `docs/...`: trabajo normal. Cada `git push origin <branch-name>`, NUNCA `git push origin HEAD:main`.
- Worktrees (`git worktree add ...`): excepción. Ahí sí aplica push directo a main según la regla global de `~/.claude/CLAUDE.md`.

## Política de commits

- **NO** agregar `Co-Authored-By:` con asistentes (Claude / GPT / etc.) en commits ni PRs.
- Mensajes concisos: describir el **qué** y **por qué** sin firmas externas.

## Seguridad — reglas duras

- **NUNCA** commitear `DATABASE_URL`, contraseñas, JWTs, API keys, PINs ni secretos en archivos markdown, docs, código o ejemplos. Usar siempre `<placeholder>` o referencia a `.env`.
- Cookies de sesión: `httpOnly: true`, `secure: NODE_ENV === 'production'`, `sameSite: 'lax'`. **NO** setear desde `document.cookie`.
- Si un secreto se filtra al repo: **rotar inmediatamente** la credencial, aunque se borre del HEAD (la historia git sigue exponiéndola).

## Bug conocido — Turbopack y `®` en path local

Next.js 16.2.6 con Turbopack hace panic cuando el path del proyecto contiene caracteres multibyte como `®`:
```
start byte index 27 is not a char boundary; it is inside '®'
```

Solo afecta builds locales. Vercel construye en path ASCII y no se ve afectado. Workaround: build en Vercel preview o renombrar el directorio.
