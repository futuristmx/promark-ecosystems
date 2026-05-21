'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { Breadcrumb } from '@/components/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const HOLDER_TYPES = ['INDIVIDUAL', 'CORPORATION'] as const;

const holderFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  holder_type: z.enum(HOLDER_TYPES),
  rfc: z.string().optional(),
  curp: z.string().optional(),
  nationality: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  notes: z.string().optional(),
});

type HolderFormValues = z.infer<typeof holderFormSchema>;

interface NewHolderPageProps {
  params: Promise<{ 'tenant-id': string }>;
}

export default function NewHolderPage({ params }: NewHolderPageProps) {
  const { 'tenant-id': tenantId } = use(params);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HolderFormValues>({
    resolver: zodResolver(holderFormSchema),
    defaultValues: {
      name: '',
      holder_type: 'CORPORATION',
      rfc: '',
      curp: '',
      nationality: '',
      contact_email: '',
      contact_phone: '',
      notes: '',
    },
  });

  async function onSubmit(data: HolderFormValues) {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/tenants/${tenantId}/holders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create holder');
      }
      router.push(`/tenants/${tenantId}/holders`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }

  const selectClasses =
    'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumb
        items={[
          { label: 'Tenants', href: '/tenants' },
          { label: '...', href: `/tenants/${tenantId}/structure` },
          { label: 'Holders', href: `/tenants/${tenantId}/holders` },
          { label: 'New Holder' },
        ]}
      />

      <h1 className="mb-6 text-2xl font-bold text-slate-900">
        Create New Holder
      </h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Holder Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Full Name / Company Name *</Label>
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
                <Label htmlFor="holder_type">Type *</Label>
                <select
                  id="holder_type"
                  {...register('holder_type')}
                  className={`mt-1 ${selectClasses}`}
                >
                  {HOLDER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  {...register('nationality')}
                  className="mt-1"
                  placeholder="e.g., Mexicana"
                />
              </div>

              <div>
                <Label htmlFor="rfc">RFC</Label>
                <Input
                  id="rfc"
                  {...register('rfc')}
                  className="mt-1"
                  placeholder="e.g., ABC1234567A1"
                />
              </div>

              <div>
                <Label htmlFor="curp">CURP</Label>
                <Input
                  id="curp"
                  {...register('curp')}
                  className="mt-1"
                  placeholder="Only for individuals"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  {...register('contact_email')}
                  aria-invalid={!!errors.contact_email}
                  className="mt-1"
                />
                {errors.contact_email && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.contact_email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="contact_phone">Phone</Label>
                <Input
                  id="contact_phone"
                  {...register('contact_phone')}
                  className="mt-1"
                  placeholder="+52 ..."
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/tenants/${tenantId}/holders`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Holder'}
          </Button>
        </div>
      </form>
    </div>
  );
}
