'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { useTenantName } from '@/hooks/use-tenant-name';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const LEGAL_STATUSES = [
  'APPLIED',
  'PUBLISHED',
  'REGISTERED',
  'RENEWED',
  'EXPIRED',
  'CANCELLED',
  'OPPOSED',
  'IN_LITIGATION',
] as const;

const BRAND_TYPES = [
  'WORDMARK',
  'FIGURATIVE',
  'MIXED',
  'THREE_D',
  'SOUND',
  'HOLOGRAM',
  'TRADE_DRESS',
] as const;

const brandClassSchema = z.object({
  class_number: z.number().min(1).max(45),
  class_description: z.string().optional(),
});

const brandFormSchema = z.object({
  name: z.string().min(1, 'Campo requerido'),
  registration_number: z.string().optional(),
  application_number: z.string().optional(),
  application_date: z.string().optional(),
  registration_date: z.string().optional(),
  expiration_date: z.string().optional(),
  renewal_date: z.string().optional(),
  legal_status: z.enum(LEGAL_STATUSES),
  brand_type: z.enum(BRAND_TYPES),
  company_id: z.string().min(1, 'Campo requerido'),
  description: z.string().optional(),
  disclaimers: z.string().optional(),
  classes: z.array(brandClassSchema),
});

type BrandFormValues = z.infer<typeof brandFormSchema>;

interface Company {
  id: string;
  name: string;
}

interface NewBrandPageProps {
  params: Promise<{ 'tenant-id': string }>;
}

export default function NewBrandPage({ params }: NewBrandPageProps) {
  const { 'tenant-id': tenantId } = use(params);
  const router = useRouter();
  const tenantName = useTenantName(tenantId);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: '',
      legal_status: 'APPLIED',
      brand_type: 'WORDMARK',
      company_id: '',
      classes: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'classes',
  });

  useEffect(() => {
    async function fetchCompanies() {
      const res = await fetch(`/api/tenants/${tenantId}/brands`);
      if (res.ok) {
        const data = await res.json();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCompanies(data.companies || []);
      }
    }
    fetchCompanies();
  }, [tenantId]);

  async function onSubmit(data: BrandFormValues) {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/tenants/${tenantId}/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create brand');
      }
      router.push(`/tenants/${tenantId}/brands`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }

  const selectClasses =
    'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumb
        items={[
          { label: 'Clientes', href: '/tenants' },
          { label: tenantName || tenantId, href: `/tenants/${tenantId}/structure` },
          { label: 'Marcas', href: `/tenants/${tenantId}/brands` },
          { label: 'Nueva Marca' },
        ]}
      />

      <h1 className="mb-6 text-2xl font-bold text-slate-900">
        Crear nueva marca
      </h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Información básica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Nombre de la marca *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  aria-invalid={!!errors.name}
                  className="mt-1"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="legal_status">Estado legal *</Label>
                <select
                  id="legal_status"
                  {...register('legal_status')}
                  className={`mt-1 ${selectClasses}`}
                >
                  {LEGAL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="brand_type">Tipo de marca *</Label>
                <select
                  id="brand_type"
                  {...register('brand_type')}
                  className={`mt-1 ${selectClasses}`}
                >
                  {BRAND_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="company_id">Empresa *</Label>
                <select
                  id="company_id"
                  {...register('company_id')}
                  className={`mt-1 ${selectClasses}`}
                  aria-invalid={!!errors.company_id}
                >
                  <option value="">Selecciona una empresa...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.company_id && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.company_id.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Details */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Datos de registro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="registration_number">Número de registro</Label>
                <Input
                  id="registration_number"
                  {...register('registration_number')}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="application_number">Número de solicitud</Label>
                <Input
                  id="application_number"
                  {...register('application_number')}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="application_date">Fecha de solicitud</Label>
                <Input
                  id="application_date"
                  type="date"
                  {...register('application_date')}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="registration_date">Fecha de registro</Label>
                <Input
                  id="registration_date"
                  type="date"
                  {...register('registration_date')}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="expiration_date">Fecha de vencimiento</Label>
                <Input
                  id="expiration_date"
                  type="date"
                  {...register('expiration_date')}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="renewal_date">Fecha de renovación</Label>
                <Input
                  id="renewal_date"
                  type="date"
                  {...register('renewal_date')}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Detalles adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="disclaimers">Reservas</Label>
                <Textarea
                  id="disclaimers"
                  {...register('disclaimers')}
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand Classes */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Clases de Niza</CardTitle>
          </CardHeader>
          <CardContent>
            {fields.length === 0 && (
              <p className="mb-4 text-sm text-slate-400">
                Aún no hay clases agregadas. Agrega al menos una clase de Niza.
              </p>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 p-3"
                >
                  <div className="w-24">
                    <Label>Clase</Label>
                    <select
                      {...register(`classes.${index}.class_number`)}
                      className={`mt-1 ${selectClasses}`}
                    >
                      {Array.from({ length: 45 }, (_, i) => i + 1).map(
                        (n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div className="flex-1">
                    <Label>Descripción</Label>
                    <Input
                      {...register(`classes.${index}.class_description`)}
                      className="mt-1"
                      placeholder="Descripción de la clase..."
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(index)}
                    className="mt-6"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() =>
                append({ class_number: 1, class_description: '' })
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar clase
            </Button>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/tenants/${tenantId}/brands`)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creando...' : 'Crear marca'}
          </Button>
        </div>
      </form>
    </div>
  );
}
