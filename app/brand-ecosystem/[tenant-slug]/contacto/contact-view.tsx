'use client';

import { useState } from 'react';
import { MessageCircle, Mail, Send, Phone } from 'lucide-react';
import { useToast } from '@/components/ds';

interface ContactViewProps {
  tenantSlug: string;
  userName: string;
  userEmail: string | null;
  contact: {
    whatsapp: string;
    email: string;
    phone: string;
  };
}

export function ContactView({ tenantSlug, userName, userEmail, contact }: ContactViewProps) {
  const toast = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const whatsappLink = `https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Hola Promark, soy ${userName} (${tenantSlug}) y necesito ayuda con: `
  )}`;
  const emailLink = `mailto:${contact.email}?subject=${encodeURIComponent(
    'Consulta desde el Portal de Clientes'
  )}&body=${encodeURIComponent(
    `Hola,\n\nSoy ${userName} (${tenantSlug}).\n\n`
  )}`;

  async function handleSendMessage() {
    if (!subject.trim() || !message.trim()) {
      toast.error('Completa el asunto y el mensaje');
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`/api/client/${tenantSlug}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error('No se pudo enviar', d.error ?? 'Intenta de nuevo.');
        return;
      }
      toast.success('Mensaje enviado', 'Promark recibió tu consulta y te contactará pronto.');
      setSubject('');
      setMessage('');
    } catch {
      toast.error('Error de red');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: 'var(--tenant-primary, #D39A2B)' }}
        >
          Soporte
        </p>
        <h1 className="mt-1 text-2xl font-bold" style={{ color: '#0F2E3D' }}>
          Contacto con Promark
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#355B6F' }}>
          ¿Tienes dudas sobre tu portafolio marcario? Estamos aquí para ayudarte.
        </p>
      </div>

      {/* Canales rápidos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ChannelCard
          icon={<MessageCircle className="size-6" />}
          title="WhatsApp"
          description="Respuesta inmediata en horario hábil"
          actionLabel="Abrir WhatsApp"
          href={whatsappLink}
          accent="#25D366"
          external
        />
        <ChannelCard
          icon={<Mail className="size-6" />}
          title="Correo electrónico"
          description={contact.email}
          actionLabel="Enviar correo"
          href={emailLink}
          accent="#355B6F"
          external
        />
        <ChannelCard
          icon={<Phone className="size-6" />}
          title="Teléfono"
          description={contact.phone}
          actionLabel="Llamar"
          href={`tel:${contact.phone.replace(/\s+/g, '')}`}
          accent="#0F2E3D"
          external
        />
      </div>

      {/* Mensaje directo */}
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
      >
        <div className="mb-4">
          <h2 className="text-lg font-bold" style={{ color: '#0F2E3D' }}>
            Enviar mensaje directo
          </h2>
          <p className="mt-1 text-sm" style={{ color: '#355B6F' }}>
            Te responderemos a {userEmail ?? 'tu correo registrado'} dentro del siguiente día hábil.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
              Asunto
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Renovación de marca, alerta de vencimiento, etc."
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: '#E2DED6', background: '#FBF6EC', color: '#0F2E3D' }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
              Mensaje
            </label>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe tu consulta o solicitud..."
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: '#E2DED6', background: '#FBF6EC', color: '#0F2E3D' }}
            />
          </div>
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={sending || !subject.trim() || !message.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
              style={{ background: '#0F2E3D', color: '#FBF6EC' }}
            >
              <Send className="size-4" />
              {sending ? 'Enviando…' : 'Enviar mensaje'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelCard({
  icon,
  title,
  description,
  actionLabel,
  href,
  accent,
  external = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  accent: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="group flex flex-col rounded-2xl border p-5 transition-all hover:shadow-md"
      style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
    >
      <span
        className="mb-3 flex size-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
        style={{ background: `${accent}15`, color: accent }}
      >
        {icon}
      </span>
      <h3 className="text-base font-bold" style={{ color: '#0F2E3D' }}>
        {title}
      </h3>
      <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
        {description}
      </p>
      <span
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold transition-colors"
        style={{ color: accent }}
      >
        {actionLabel} →
      </span>
    </a>
  );
}
