"use client";

import useSWR, { useSWRConfig } from "swr";
import { BadgeCheck, Crown, MapPin, Star, Store } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button, Pill, SectionTitle } from "@/components/ui";

function statusTone(status) {
  if (status === "approved") return "open";
  if (status === "suspended") return "red";
  return "amber";
}

export default function BusinessesClient() {
  const { mutate } = useSWRConfig();
  const { data, error } = useSWR("/admin/businesses", apiFetch);
  const businesses = data?.businesses || [];

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
        description={`${businesses.length} registrados`}
      />

      {error ? (
        <div className="rounded-[24px] bg-accent-tint p-4 text-sm text-accent">
          {error.message}
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {businesses.map((business) => (
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
                {business.status === "approved"
                  ? "Aprobado"
                  : business.status === "suspended"
                    ? "Suspendido"
                    : "Pendiente"}
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
          </article>
        ))}
      </div>

      {!businesses.length && !error ? (
        <div className="rounded-[24px] bg-soft p-6 text-center text-sm text-muted">
          No hay negocios registrados.
        </div>
      ) : null}

      <div className="mt-5 flex items-center gap-2 rounded-[24px] bg-white p-4 text-xs text-muted shadow-sm">
        <Store className="h-4 w-4 text-accent" />
        La verificación confirma los datos del local; no modifica su puntuación
        ni su posición en los rankings.
      </div>
    </div>
  );
}
