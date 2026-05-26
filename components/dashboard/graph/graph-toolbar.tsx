'use client';

import { useReactFlow } from '@xyflow/react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GraphToolbarProps {
  showHolders: boolean;
  showContracts: boolean;
  showAlerts: boolean;
  onToggleHolders: (v: boolean) => void;
  onToggleContracts: (v: boolean) => void;
  onToggleAlerts: (v: boolean) => void;
  search: string;
  onSearch: (v: string) => void;
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
      style={
        active
          ? { borderColor: '#0F2E3D', background: '#0F2E3D', color: '#ffffff' }
          : { borderColor: '#E2DED6', background: '#FBF6EC', color: '#355B6F' }
      }
    >
      {children}
    </button>
  );
}

export function GraphToolbar({
  showHolders,
  showContracts,
  showAlerts,
  onToggleHolders,
  onToggleContracts,
  onToggleAlerts,
  search,
  onSearch,
}: GraphToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="flex flex-wrap items-center gap-2 border-b p-3" style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}>
      <Input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Buscar en el grafo..."
        className="h-8 w-48 text-xs"
      />
      <div className="mx-1 h-6 w-px" style={{ background: '#E2DED6' }} />
      <Toggle active={showHolders} onClick={() => onToggleHolders(!showHolders)}>
        Mostrar titulares
      </Toggle>
      <Toggle
        active={showContracts}
        onClick={() => onToggleContracts(!showContracts)}
      >
        Mostrar contratos
      </Toggle>
      <Toggle active={showAlerts} onClick={() => onToggleAlerts(!showAlerts)}>
        Mostrar alertas
      </Toggle>
      <div className="ml-auto flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => zoomOut()}
          aria-label="Alejar"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => zoomIn()}
          aria-label="Acercar"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fitView({ duration: 200 })}
          aria-label="Ajustar vista"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
