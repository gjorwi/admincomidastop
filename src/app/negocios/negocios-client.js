"use client";

import { useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  BadgeCheck,
  Crown,
  Eye,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Search,
  Share2,
  Star,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button, Modal, Pill, SectionTitle } from "@/components/ui";

const statusFilters = [
  { id: "todos", label: "Todos" },
  { id: "approved", label: "Aprobados" },
  { id: "pending", label: "Pendientes" },
  { id: "suspended", label: "Suspendidos" },
  { id: "rejected", label: "Rechazados" },
];

const adPositions = Array.from({ length: 10 }, (_, index) => index + 1);

function statusTone(status) {
  if (status === "approved") return "open";
  if (status === "suspended" || status === "rejected") return "red";
  return "amber";
}

function statusLabel(status) {
  if (status === "approved") return "Aprobado";
  if (status === "suspended") return "Suspendido";
  if (status === "rejected") return "Rechazado";
  return "Pendiente";
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-soft p-3">
      <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
      <p className="mt-2 font-display text-2xl leading-none text-ink">
        {value ?? 0}
      </p>
      <p className="mt-1 text-[10px] leading-4 text-muted">{label}</p>
    </div>
  );
}

export default function BusinessesClient() {
  const { mutate } = useSWRConfig();
  const { data, error } = useSWR("/admin/businesses", apiFetch);
  const businesses = useMemo(() => data?.businesses || [], [data]);
  const [status, setStatus] = useState("todos");
  const [query, setQuery] = useState("");
  const [metricsBusiness, setMetricsBusiness] = useState(null);
  const [metricsRange, setMetricsRange] = useState(30);
  const {
    data: metricsData,
    error: metricsError,
    isLoading: metricsLoading,
  } = useSWR(
    metricsBusiness
      ? `/admin/businesses/${metricsBusiness._id}/metrics?range=${metricsRange}`
      : null,
    apiFetch,
  );

  const filteredBusinesses = useMemo(() => {
    const term = normalize(query.trim());
    return businesses.filter((business) => {
      if (status !== "todos" && business.status !== status) return false;
      if (!term) return true;
      const haystack = normalize(
        [
          business.name,
          business.category,
          business.zone,
          business.municipality,
          business.parish,
          business.sector,
          business.address,
        ].join(" "),
      );
      return haystack.includes(term);
    });
  }, [businesses, query, status]);

  const updateBusiness = async (business, changes) => {
    await apiFetch(`/admin/businesses/${business._id}`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
    await mutate("/admin/businesses");
    await mutate("/admin/stats");
  };

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
        Control de la plataforma
      </p>
      <h1 className="mt-2 font-display text-[38px] leading-none tracking-[-0.045em] text-ink">
        Negocios
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Administra el estado, la verificación, el acceso y las utilidades
        premium de cada establecimiento.
      </p>

      <SectionTitle
        title="Establecimientos"
        description={`${filteredBusinesses.length} de ${businesses.length} registrados`}
      />

      {error ? (
        <div className="rounded-[24px] bg-accent-tint p-4 text-sm text-accent">
          {error.message}
        </div>
      ) : null}

      <div className="mb-4 space-y-3">
        <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-line bg-white px-4 shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, categoría o zona"
            aria-label="Buscar negocios"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="px-1 text-lg leading-none text-muted hover:text-ink"
              aria-label="Limpiar búsqueda"
            >
              ×
            </button>
          ) : null}
        </label>

        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatus(filter.id)}
              aria-pressed={status === filter.id}
              className={`inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition ${
                status === filter.id
                  ? "bg-ink text-white"
                  : "bg-beige text-ink hover:bg-[#ebe0d4]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {filteredBusinesses.map((business) => (
          <article
            key={business._id}
            className="rounded-[24px] border border-line/70 bg-white/70 p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-tint text-[26px]">
                {business.emoji || "🍽️"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2 className="text-sm font-semibold text-ink">
                    {business.name}
                  </h2>
                  {business.isVerified ? (
                    <BadgeCheck className="h-4 w-4 text-open" />
                  ) : null}
                  {business.premiumPlan === "premium" ? (
                    <Pill tone="amber">
                      <Crown className="mr-1 h-3 w-3" />
                      Premium
                    </Pill>
                  ) : null}
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                  <MapPin className="h-3.5 w-3.5" />
                  {business.category} · {[
                    business.municipality,
                    business.parish,
                    business.sector,
                  ].filter(Boolean).join(" · ") || business.zone}
                </p>
              </div>
              <Pill tone={statusTone(business.status)}>
                {statusLabel(business.status)}
              </Pill>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-2xl bg-soft px-3 py-2.5">
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
                <Star className="h-4 w-4 fill-mustard text-mustard" />
                {business.score ?? "—"}
              </span>
              <span className="text-[11px] text-muted">
                {business.ratingsCount || 0} calificaciones ·{" "}
                {business.activeProducts || 0} platos
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {business.status === "approved" ? (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() =>
                    updateBusiness(business, { status: "suspended" })
                  }
                >
                  Suspender
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() =>
                    updateBusiness(business, { status: "approved" })
                  }
                >
                  Aprobar
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  updateBusiness(business, {
                    isVerified: !business.isVerified,
                  })
                }
              >
                {business.isVerified ? "Quitar verificación" : "Verificar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMetricsRange(30);
                  setMetricsBusiness(business);
                }}
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                Ver métricas
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  updateBusiness(business, {
                    premiumPlan:
                      business.premiumPlan === "premium" ? "none" : "premium",
                    premiumUntil:
                      business.premiumPlan === "premium"
                        ? null
                        : new Date(
                            new Date().setMonth(new Date().getMonth() + 6),
                          ).toISOString(),
                  })
                }
              >
                {business.premiumPlan === "premium"
                  ? "Quitar premium"
                  : "Dar premium"}
              </Button>
            </div>

            {business.recognition?.status ? (
              <p className="mt-3 rounded-2xl bg-amber-tint p-3 text-[11px] leading-5 text-[#6a4700]">
                🏅 Top {business.recognition.position} en{" "}
                {business.recognition.category} ·{" "}
                {business.recognition.productName}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-white px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink">
                  Publicidad en promociones
                </p>
                <p className="text-[10px] leading-4 text-muted">
                  Aparece en “Promociones destacadas” del inicio.
                </p>
              </div>
              <select
                value={
                  business.featuredAd?.isActive
                    ? String(business.featuredAd.position || 1)
                    : ""
                }
                onChange={(event) => {
                  const value = event.target.value;
                  updateBusiness(business, {
                    featuredAd: {
                      isActive: value !== "",
                      position: value === "" ? 1 : Number(value),
                    },
                  });
                }}
                aria-label={`Publicidad de ${business.name} en promociones destacadas`}
                className="min-h-9 shrink-0 rounded-full border border-line bg-white px-3 text-xs font-semibold text-ink outline-none focus:border-accent/60"
              >
                <option value="">No mostrar</option>
                {adPositions.map((position) => (
                  <option key={position} value={position}>
                    Posición {position}
                  </option>
                ))}
              </select>
            </div>
          </article>
        ))}
      </div>

      {!filteredBusinesses.length && !error ? (
        <div className="rounded-[24px] bg-soft p-6 text-center text-sm text-muted">
          {businesses.length
            ? "No hay negocios que coincidan con el filtro."
            : "No hay negocios registrados."}
        </div>
      ) : null}

      <div className="mt-5 flex items-center gap-2 rounded-[24px] bg-white p-4 text-xs text-muted shadow-sm">
        <Store className="h-4 w-4 text-accent" />
        La verificación confirma los datos del local; no modifica su puntuación
        ni su posición en los rankings.
      </div>

      {metricsBusiness ? (
        <Modal
          title={`Métricas de ${metricsBusiness.name}`}
          description="Actividad registrada desde la web de clientes."
          onClose={() => setMetricsBusiness(null)}
          size="wide"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Pill
                  tone={
                    metricsBusiness.premiumPlan === "premium"
                      ? "amber"
                      : "beige"
                  }
                >
                  {metricsBusiness.premiumPlan === "premium" ? (
                    <Crown className="mr-1 h-3 w-3" />
                  ) : null}
                  {metricsBusiness.premiumPlan === "premium"
                    ? "Premium"
                    : "Sin premium"}
                </Pill>
                <Pill tone={statusTone(metricsBusiness.status)}>
                  {statusLabel(metricsBusiness.status)}
                </Pill>
              </div>

              <select
                value={metricsRange}
                onChange={(event) => setMetricsRange(Number(event.target.value))}
                aria-label="Periodo de las métricas"
                className="min-h-10 rounded-full border border-line bg-white px-3 text-xs font-semibold text-ink outline-none focus:border-accent/60"
              >
                <option value={7}>Últimos 7 días</option>
                <option value={30}>Últimos 30 días</option>
                <option value={90}>Últimos 90 días</option>
              </select>
            </div>

            {metricsLoading ? (
              <div className="rounded-2xl bg-soft p-6 text-center text-sm text-muted">
                Cargando métricas…
              </div>
            ) : metricsError ? (
              <div className="rounded-2xl bg-accent-tint p-4 text-sm text-accent">
                {metricsError.message}
              </div>
            ) : metricsData ? (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <MetricCard
                    icon={Phone}
                    label="Llamadas"
                    value={metricsData.totals?.call}
                  />
                  <MetricCard
                    icon={MessageCircle}
                    label="Clics a WhatsApp"
                    value={metricsData.totals?.whatsapp}
                  />
                  <MetricCard
                    icon={Navigation}
                    label="Cómo llegar"
                    value={metricsData.totals?.directions}
                  />
                  <MetricCard
                    icon={UtensilsCrossed}
                    label="Vistas al menú"
                    value={metricsData.totals?.menu_view}
                  />
                  <MetricCard
                    icon={Share2}
                    label="Negocio compartido"
                    value={metricsData.totals?.business_share}
                  />
                  <MetricCard
                    icon={Share2}
                    label="Platos compartidos"
                    value={metricsData.totals?.dish_share}
                  />
                </div>

                <div className="rounded-2xl bg-soft p-4 text-xs leading-5 text-muted">
                  <p>
                    <span className="font-semibold text-ink">
                      {metricsData.uniqueUsers ?? 0}
                    </span>{" "}
                    usuarios registrados y{" "}
                    <span className="font-semibold text-ink">
                      {metricsData.uniqueDevices ?? 0}
                    </span>{" "}
                    dispositivos únicos realizaron estas acciones.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-ink">
                    Platos más compartidos
                  </p>
                  {metricsData.topSharedDishes?.length ? (
                    <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-white">
                      {metricsData.topSharedDishes.map((dish, index) => (
                        <div
                          key={dish.productId}
                          className={`flex items-center gap-3 px-3 py-2.5 ${
                            index > 0 ? "border-t border-line" : ""
                          }`}
                        >
                          <span className="text-xl">{dish.emoji}</span>
                          <span className="min-w-0 flex-1 truncate text-sm text-ink">
                            {dish.name}
                          </span>
                          <span className="text-xs font-semibold text-muted">
                            {dish.shares}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted">
                      Aún no hay platos compartidos en este periodo.
                    </p>
                  )}
                </div>

                <p className="text-[11px] leading-5 text-muted">
                  Estas métricas son visibles solo desde el panel de
                  administración.
                </p>
              </>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
