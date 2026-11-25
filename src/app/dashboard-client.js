"use client";

import Link from "next/link";
import useSWR from "swr";
import {
  ArrowRight,
  Inbox,
  ShieldCheck,
  Star,
  Store,
  UserRound,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ErrorNotice, Pill, SectionTitle, StatCard } from "@/components/ui";

export default function AdminDashboardClient() {
  const { data: statsData, error: statsError } = useSWR("/admin/stats", apiFetch);
  const { data: requestsData, error: requestsError } = useSWR(
    "/admin/requests?status=pending",
    apiFetch,
  );
  const stats = statsData?.stats || {};
  const requests = requestsData?.requests || [];

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
        Administración general
      </p>
      <h1 className="mt-2 font-display text-[38px] leading-none tracking-[-0.045em] text-ink">
        Todo bajo control.
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Revisa solicitudes, aprueba negocios, administra el acceso y publica los
        rankings mensuales.
      </p>

      <ErrorNotice error={statsError || requestsError} className="mt-5" />

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Solicitudes pendientes"
          value={stats.pendingRequests ?? 0}
          icon={Inbox}
          tone="amber"
        />
        <StatCard
          label="Negocios aprobados"
          value={stats.approvedBusinesses ?? 0}
          icon={Store}
          tone="green"
        />
        <StatCard
          label="Productos activos"
          value={stats.products ?? 0}
          icon={UtensilsCrossed}
          tone="accent"
        />
        <StatCard
          label="Calificaciones"
          value={stats.ratings ?? 0}
          icon={Star}
          tone="beige"
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <Link
          href="/solicitudes"
          className="group flex min-h-[104px] items-center gap-3 rounded-[24px] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-tint">
            <Inbox className="h-5 w-5 text-[#8a5a00]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink">
              Revisar solicitudes
            </span>
            <span className="block text-xs text-muted">
              {stats.pendingRequests ?? 0} pendientes
            </span>
          </span>
          <ArrowRight className="h-5 w-5 text-muted group-hover:text-accent" />
        </Link>

        <Link
          href="/negocios"
          className="group flex min-h-[104px] items-center gap-3 rounded-[24px] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-tint">
            <Store className="h-5 w-5 text-open" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink">
              Administrar negocios
            </span>
            <span className="block text-xs text-muted">
              Verificación, estado y premium
            </span>
          </span>
          <ArrowRight className="h-5 w-5 text-muted group-hover:text-accent" />
        </Link>

        <Link
          href="/rankings"
          className="group flex min-h-[104px] items-center gap-3 rounded-[24px] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-tint">
            <ShieldCheck className="h-5 w-5 text-accent" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink">
              Publicar rankings
            </span>
            <span className="block text-xs text-muted">
              Cierre y reconocimientos del mes
            </span>
          </span>
          <ArrowRight className="h-5 w-5 text-muted group-hover:text-accent" />
        </Link>
      </div>

      <SectionTitle
        title="Solicitudes recientes"
        description="Negocios esperando revisión."
        action="Ver todas"
        href="/solicitudes"
      />

      {requests.length ? (
        <div className="overflow-hidden rounded-[24px] border border-line/70 bg-white/70 shadow-sm">
          {requests.slice(0, 5).map((request, index) => (
            <Link
              key={request.id}
              href="/solicitudes"
              className={`flex items-center gap-3 px-4 py-3.5 transition hover:bg-soft ${
                index > 0 ? "border-t border-line" : ""
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-tint text-sm font-semibold text-[#8a5a00]">
                {request.businessName.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">
                  {request.businessName}
                </span>
                <span className="block truncate text-xs text-muted">
                  {request.ownerName} · {request.email}
                </span>
              </span>
              <Pill tone="amber">Pendiente</Pill>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] bg-soft p-6 text-center text-sm text-muted">
          No hay solicitudes pendientes.
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-[24px] bg-white p-4 shadow-sm">
          <Users className="h-5 w-5 text-accent" />
          <div>
            <p className="font-display text-2xl text-ink">
              {stats.users ?? 0}
            </p>
            <p className="text-[11px] text-muted">cuentas registradas</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[24px] bg-white p-4 shadow-sm">
          <UserRound className="h-5 w-5 text-open" />
          <div>
            <p className="font-display text-2xl text-ink">
              {stats.clients ?? 0}
            </p>
            <p className="text-[11px] text-muted">clientes registrados</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[24px] bg-white p-4 shadow-sm">
          <ShieldCheck className="h-5 w-5 text-open" />
          <div>
            <p className="font-display text-2xl text-ink">
              {stats.snapshots ?? 0}
            </p>
            <p className="text-[11px] text-muted">rankings publicados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
