"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Award, CalendarDays, RefreshCw, Star } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button, Pill, SectionTitle } from "@/components/ui";

function periodLabel(period) {
  if (!period) return "Sin periodo";
  const [year, month] = period.split("-").map(Number);
  return new Intl.DateTimeFormat("es-VE", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export default function RankingsClient() {
  const { mutate } = useSWRConfig();
  const { data: snapshotsData, error } = useSWR("/admin/rankings", apiFetch);
  const { data: categoriesData } = useSWR("/admin/categories", apiFetch);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const snapshots = snapshotsData?.snapshots || [];
  const categories = categoriesData?.categories || [];
  const categoryMap = new Map(
    categories.map((category) => [category.id, category]),
  );
  const grouped = new Map();
  for (const snapshot of snapshots) {
    if (!grouped.has(snapshot.period)) grouped.set(snapshot.period, []);
    grouped.get(snapshot.period).push(snapshot);
  }

  const publish = async () => {
    setLoading(true);
    setMessage("");
    setErrorMessage("");
    try {
      const payload = await apiFetch("/admin/rankings/publish", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setMessage(payload.message || "Rankings publicados.");
      await mutate("/admin/rankings");
      await mutate("/admin/stats");
      await mutate("/admin/businesses");
    } catch (publishError) {
      setErrorMessage(
        publishError.message || "No se pudieron publicar los rankings.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
        Reputación y reconocimientos
      </p>
      <h1 className="mt-2 font-display text-[38px] leading-none tracking-[-0.045em] text-ink">
        Rankings
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Cierra el periodo actual y publica una captura del Top 3 por categoría.
        Las puntuaciones del próximo mes alimentarán la siguiente selección.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[24px] border border-line/70 bg-white/70 p-4 shadow-sm">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-tint">
          <Award className="h-5 w-5 text-accent" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">
            Publicar rankings del mes
          </p>
          <p className="text-xs text-muted">
            Genera la captura y actualiza el reconocimiento de los primeros
            lugares.
          </p>
        </div>
        <Button type="button" onClick={publish} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Publicando…" : "Publicar ahora"}
        </Button>
      </div>

      {message ? (
        <p className="mt-3 rounded-2xl bg-green-tint p-3 text-sm font-semibold text-open">
          {message}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="mt-3 rounded-2xl bg-accent-tint p-3 text-sm font-semibold text-accent">
          {errorMessage}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-2xl bg-accent-tint p-3 text-sm text-accent">
          {error.message}
        </p>
      ) : null}

      <SectionTitle
        title="Capturas publicadas"
        description={`${snapshots.length} registros`}
      />

      {[...grouped.entries()].map(([period, periodSnapshots]) => (
        <section
          key={period}
          className="mb-4 rounded-[24px] border border-line/70 bg-white/70 p-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold capitalize text-ink">
              {periodLabel(period)}
            </h2>
            <Pill tone="beige">{periodSnapshots.length} categorías</Pill>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {periodSnapshots.map((snapshot) => (
              <div
                key={snapshot._id}
                className="rounded-2xl bg-soft p-3"
              >
                <p className="text-xs font-semibold text-ink">
                  {categoryMap.get(snapshot.categoryKey)?.label ||
                    snapshot.categoryKey}
                </p>
                <div className="mt-2 space-y-1.5">
                  {snapshot.rankings?.map((item) => (
                    <div
                      key={`${snapshot._id}-${item.position}`}
                      className="flex items-center gap-2 text-[11px]"
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full font-semibold ${
                          item.position === 1
                            ? "bg-accent text-white"
                            : "bg-beige text-ink"
                        }`}
                      >
                        {item.position}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-ink">
                        {item.productName}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-muted">
                        <Star className="h-3 w-3 fill-mustard text-mustard" />
                        {item.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {!snapshots.length && !error ? (
        <div className="rounded-[24px] bg-soft p-6 text-center text-sm text-muted">
          Todavía no se ha publicado ningún ranking.
        </div>
      ) : null}
    </div>
  );
}
