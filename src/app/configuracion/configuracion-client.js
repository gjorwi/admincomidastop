"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Check, Ruler, Settings2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button, ErrorNotice, SectionTitle } from "@/components/ui";

const DEFAULT_RADIUS = 15;
const MIN_RADIUS = 1;
const MAX_RADIUS = 500;

function formatDate(value) {
  if (!value) return "Sin actualizaciones";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin actualizaciones";
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function ConfiguracionClient() {
  const { mutate } = useSWRConfig();
  const { data, error, isLoading } = useSWR("/admin/settings", apiFetch);
  const settings = data?.settings;
  const [radiusDraft, setRadiusDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState("");

  const radius =
    radiusDraft ??
    (settings?.scanRadiusMeters !== undefined
      ? String(settings.scanRadiusMeters)
      : "");

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaved(false);
    setFormError("");

    const value = Number(radius);
    if (
      !Number.isInteger(value) ||
      value < MIN_RADIUS ||
      value > MAX_RADIUS
    ) {
      setFormError(
        `El radio debe ser un número entero entre ${MIN_RADIUS} y ${MAX_RADIUS} metros.`,
      );
      return;
    }

    setSaving(true);
    try {
      const payload = await apiFetch("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ scanRadiusMeters: value }),
      });
      await mutate("/admin/settings");
      setRadiusDraft(String(payload.settings.scanRadiusMeters));
      setSaved(true);
    } catch (saveError) {
      setFormError(
        saveError.message || "No se pudo guardar la configuración.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
        Configuración de la plataforma
      </p>
      <h1 className="mt-2 font-display text-[38px] leading-none tracking-[-0.045em] text-ink">
        Configuración
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Ajusta los parámetros generales que utilizan las aplicaciones de
        comidasTop.
      </p>

      <ErrorNotice error={error} className="mt-5" />

      <SectionTitle
        title="Validación de votaciones"
        description="Parámetros usados al escanear el QR de un local."
      />

      <form
        onSubmit={saveSettings}
        className="rounded-[24px] border border-line/70 bg-white/70 p-4 shadow-sm sm:p-5"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-tint text-accent">
            <Ruler className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">
              Radio de validación del escaneo
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              Distancia máxima entre el cliente y el negocio para habilitar los
              votos. Valor recomendado: {DEFAULT_RADIUS} m.
            </p>
          </div>
        </div>

        <label className="mt-5 block text-sm font-semibold text-ink">
          Radio permitido (metros)
          <input
            type="number"
            min={MIN_RADIUS}
            max={MAX_RADIUS}
            step="1"
            value={radius}
            onChange={(event) => {
              setSaved(false);
              setRadiusDraft(event.target.value);
            }}
            placeholder={String(DEFAULT_RADIUS)}
            disabled={isLoading}
            className="mt-1.5 w-full rounded-2xl border border-line bg-soft px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent/60 focus:bg-white disabled:opacity-60"
          />
          <span className="mt-1 block text-[11px] font-normal leading-4 text-muted">
            Entre {MIN_RADIUS} y {MAX_RADIUS} metros. El GPS del móvil suele
            tener un margen de error de 5 a 20 metros.
          </span>
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-soft px-4 py-3 text-xs text-muted">
          <Settings2 className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <span>
            Valor actual:{" "}
            <strong className="text-ink">
              {settings?.scanRadiusMeters ?? DEFAULT_RADIUS} m
            </strong>
          </span>
          <span className="text-line" aria-hidden="true">
            ·
          </span>
          <span>Última actualización: {formatDate(settings?.updatedAt)}</span>
        </div>

        {formError ? (
          <p className="mt-4 text-sm font-semibold text-accent">{formError}</p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving || isLoading}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={saving || isLoading}
            onClick={() => {
              setSaved(false);
              setRadiusDraft(String(DEFAULT_RADIUS));
            }}
          >
            Usar {DEFAULT_RADIUS} m
          </Button>
          {saved ? (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-open">
              <Check className="h-4 w-4" aria-hidden="true" />
              Guardado
            </span>
          ) : null}
        </div>
      </form>

      <div className="mt-4 rounded-[24px] bg-amber-tint p-4 text-xs leading-5 text-[#6a4700]">
        <p className="font-semibold">Importante</p>
        <p className="mt-1">
          El cambio aplica a los nuevos escaneos. Las visitas que ya están
          activas conservan su vigencia hasta que se usen sus votos o venzan las
          24 horas.
        </p>
      </div>
    </div>
  );
}
