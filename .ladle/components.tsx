import type { GlobalProvider } from '@ladle/react';
import '../app/globals.css';

/**
 * Provider global de Ladle — inyecta los estilos del producto en cada story.
 * Carga globals.css (tokens + tailwind v4 + design system layer).
 */
export const Provider: GlobalProvider = ({ children }) => {
  return (
    <div className="font-sans antialiased" style={{ background: '#FAFBFC', minHeight: '100vh', padding: '40px' }}>
      {children}
    </div>
  );
};
