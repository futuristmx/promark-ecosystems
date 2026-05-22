'use client';

import { useState, useEffect, useCallback } from 'react';
import { Upload, Download, Trash2, History, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface DocumentRow {
  id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  description: string | null;
  uploaded_at: string;
  expires_at: string | null;
  version_number: number;
  uploaded_by: string;
}

interface DocumentsPanelProps {
  tenantId: string;
  entityType: 'BRAND' | 'COMPANY' | 'CONTRACT';
  entityId: string;
  canUpload: boolean;
  canDelete: boolean;
  canDownload: boolean;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getExpiryStatus(expiresAt: string | null): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
} | null {
  if (!expiresAt) return null;
  const days = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (days < 0) return { label: 'Vencido', variant: 'destructive' };
  if (days <= 30) return { label: `Vence en ${days}d`, variant: 'destructive' };
  if (days <= 90) return { label: `Vence en ${days}d`, variant: 'outline' };
  return { label: `Vence ${new Date(expiresAt).toLocaleDateString('es-MX')}`, variant: 'secondary' };
}

export function DocumentsPanel({
  tenantId,
  entityType,
  entityId,
  canUpload,
  canDelete,
  canDownload,
}: DocumentsPanelProps) {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Upload modal
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'new' | 'version'>('new');
  const [targetDocId, setTargetDocId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Versions drawer
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<DocumentRow[]>([]);
  const [versionsDocId, setVersionsDocId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/tenants/${tenantId}/documents?entityType=${entityType}&entityId=${entityId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId, entityType, entityId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  function resetUpload() {
    setFile(null);
    setDescription('');
    setExpiresAt('');
    setUploadMode('new');
    setTargetDocId(null);
    setError('');
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Seleccione un archivo');
      return;
    }
    setSubmitting(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    if (expiresAt) formData.append('expiresAt', new Date(expiresAt).toISOString());

    try {
      let res: Response;
      if (uploadMode === 'new') {
        formData.append('entityType', entityType);
        formData.append('entityId', entityId);
        res = await fetch(`/api/tenants/${tenantId}/documents/upload`, {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch(`/api/tenants/${tenantId}/documents/${targetDocId}`, {
          method: 'PUT',
          body: formData,
        });
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Upload failed');
      }

      setUploadOpen(false);
      resetUpload();
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownload(docId: string) {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/documents/${docId}`);
      if (!res.ok) throw new Error('Failed to get download URL');
      const { document } = await res.json();
      window.open(document.signed_url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm('¿Eliminar este documento? Se mantendrá en el historial pero no será visible.')) {
      return;
    }
    try {
      const res = await fetch(`/api/tenants/${tenantId}/documents/${docId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  async function openVersions(docId: string) {
    setVersionsDocId(docId);
    setVersionsOpen(true);
    setVersions([]);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/documents/${docId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch {
      /* swallow */
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <CardTitle>Documentos</CardTitle>
            {documents.length > 0 && (
              <Badge variant="secondary">{documents.length}</Badge>
            )}
          </div>
          {canUpload && (
            <Button
              size="sm"
              onClick={() => {
                resetUpload();
                setUploadOpen(true);
              }}
            >
              <Upload className="h-4 w-4" />
              Subir
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        )}

        {loading ? (
          <p className="py-6 text-center text-sm text-slate-400">Cargando…</p>
        ) : documents.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Sin documentos adjuntos</p>
            {canUpload && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => {
                  resetUpload();
                  setUploadOpen(true);
                }}
              >
                <Upload className="h-4 w-4" />
                Subir documento
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => {
              const expiry = getExpiryStatus(doc.expires_at);
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
                >
                  <FileText className="h-5 w-5 flex-shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {doc.file_name}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        v{doc.version_number}
                      </Badge>
                      {expiry && (
                        <Badge variant={expiry.variant} className="text-xs">
                          {expiry.label}
                        </Badge>
                      )}
                    </div>
                    {doc.description && (
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {doc.description}
                      </p>
                    )}
                    <p className="text-xs text-slate-400">
                      {formatBytes(doc.file_size)} ·{' '}
                      {new Date(doc.uploaded_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {canDownload && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleDownload(doc.id)}
                        title="Descargar"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {canUpload && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => {
                          setUploadMode('version');
                          setTargetDocId(doc.id);
                          setDescription(doc.description || '');
                          setUploadOpen(true);
                        }}
                        title="Nueva versión"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => openVersions(doc.id)}
                          title="Historial de versiones"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => handleDelete(doc.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Upload modal */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {uploadMode === 'new' ? 'Subir documento' : 'Nueva versión'}
            </DialogTitle>
            <DialogDescription>
              {uploadMode === 'new'
                ? 'Adjunte un archivo PDF, imagen o documento Word (máx. 50 MB).'
                : 'Reemplace el archivo existente con una nueva versión.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <Label htmlFor="file">Archivo *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1"
              />
              {file && (
                <p className="mt-1 text-xs text-slate-500">
                  {file.name} ({formatBytes(file.size)})
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="expiresAt">Fecha de vencimiento (opcional)</Label>
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUploadOpen(false);
                  resetUpload();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Subiendo…' : 'Subir'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Versions drawer */}
      <Sheet open={versionsOpen} onOpenChange={setVersionsOpen}>
        <SheetContent side="right" className="w-[400px]">
          <SheetHeader>
            <SheetTitle>Historial de versiones</SheetTitle>
            <SheetDescription>
              Versiones anteriores del documento.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {versions.length === 0 ? (
              <p className="text-sm text-slate-400">Sin versiones anteriores.</p>
            ) : (
              versions.map((v) => (
                <div
                  key={v.id}
                  className="rounded-lg border border-slate-100 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900">
                      v{v.version_number}
                    </p>
                    {v.id === versionsDocId && (
                      <Badge variant="default">Actual</Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {v.file_name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(v.uploaded_at).toLocaleString('es-MX')}
                  </p>
                  {canDownload && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => handleDownload(v.id)}
                    >
                      <Download className="h-3 w-3" />
                      Descargar
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
