"use client";

import { useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Gift, Pencil, Plus, Trophy } from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  Button,
  ErrorNotice,
  Field,
  Modal,
  Pill,
} from "@/components/ui";

const requirementOptions = [
  ["ratings_count", "Puntuaciones realizadas"],
  ["categories_count", "Categorías distintas"],
  ["businesses_count", "Negocios distintos"],
  ["active_days", "Días con actividad"],
  ["coupons_acquired", "Cupones adquiridos"],
  ["coupons_used", "Cupones usados"],
];

const requirementLabels = Object.fromEntries(requirementOptions);

const emptyAchievement = {
  id: "",
  code: "",
  title: "",
  description: "",
  icon: "🏆",
  requirementType: "ratings_count",
  requirementValue: "1",
  rewardPoints: "10",
  order: "0",
  isActive: true,
};

const emptyCoupon = {
  id: "",
  businessId: "",
  title: "",
  description: "",
  emoji: "🎁",
  pointsCost: "50",
  stock: "10",
  perUserLimit: "1",
  validityDays: "30",
  availableFrom: "",
  availableUntil: "",
  status: "active",
};

function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function statusTone(status) {
  if (status === "active") return "open";
  if (status === "paused") return "amber";
  return "beige";
}

export default function RewardsAdminClient() {
  const { mutate } = useSWRConfig();
  const [tab, setTab] = useState("achievements");
  const [error, setError] = useState("");
  const [achievementForm, setAchievementForm] = useState(null);
  const [couponForm, setCouponForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const {
    data: achievementsData,
    error: achievementsError,
    isLoading: achievementsLoading,
  } = useSWR("/admin/achievements", apiFetch);
  const {
    data: couponsData,
    error: couponsError,
    isLoading: couponsLoading,
  } = useSWR("/admin/coupons", apiFetch);
  const { data: businessesData } = useSWR("/admin/businesses", apiFetch);

  const achievements = achievementsData?.achievements || [];
  const coupons = couponsData?.coupons || [];
  const businesses = useMemo(
    () =>
      (businessesData?.businesses || []).filter(
        (business) => business.status === "approved",
      ),
    [businessesData],
  );

  const openAchievement = (achievement = null) => {
    setError("");
    if (!achievement) {
      setAchievementForm({ ...emptyAchievement });
      return;
    }
    setAchievementForm({
      id: achievement.id,
      code: achievement.code,
      title: achievement.title,
      description: achievement.description || "",
      icon: achievement.icon || "🏆",
      requirementType: achievement.requirementType,
      requirementValue: String(achievement.requirementValue),
      rewardPoints: String(achievement.rewardPoints),
      order: String(achievement.order || 0),
      isActive: achievement.isActive !== false,
    });
  };

  const openCoupon = (coupon = null) => {
    setError("");
    if (!coupon) {
      setCouponForm({
        ...emptyCoupon,
        businessId: businesses[0]?._id || "",
      });
      return;
    }
    setCouponForm({
      id: coupon.id,
      businessId: coupon.business?.id || "",
      title: coupon.title,
      description: coupon.description || "",
      emoji: coupon.emoji || "🎁",
      pointsCost: String(coupon.pointsCost),
      stock: String(coupon.stock),
      perUserLimit: String(coupon.perUserLimit),
      validityDays: String(coupon.validityDays),
      availableFrom: toDateInput(coupon.availableFrom),
      availableUntil: toDateInput(coupon.availableUntil),
      status: coupon.status,
    });
  };

  const saveAchievement = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        code: achievementForm.code,
        title: achievementForm.title,
        description: achievementForm.description,
        icon: achievementForm.icon,
        requirementType: achievementForm.requirementType,
        requirementValue: Number(achievementForm.requirementValue),
        rewardPoints: Number(achievementForm.rewardPoints),
        order: Number(achievementForm.order),
        isActive: achievementForm.isActive,
      };
      await apiFetch(
        achievementForm.id
          ? `/admin/achievements/${achievementForm.id}`
          : "/admin/achievements",
        {
          method: achievementForm.id ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );
      await mutate("/admin/achievements");
      setAchievementForm(null);
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar el logro.");
    } finally {
      setSaving(false);
    }
  };

  const saveCoupon = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: couponForm.title,
        description: couponForm.description,
        emoji: couponForm.emoji,
        pointsCost: Number(couponForm.pointsCost),
        stock: Number(couponForm.stock),
        perUserLimit: Number(couponForm.perUserLimit),
        validityDays: Number(couponForm.validityDays),
        availableFrom: couponForm.availableFrom || null,
        availableUntil: couponForm.availableUntil || null,
        status: couponForm.status,
      };
      if (!couponForm.id) payload.businessId = couponForm.businessId;

      await apiFetch(
        couponForm.id
          ? `/admin/coupons/${couponForm.id}`
          : "/admin/coupons",
        {
          method: couponForm.id ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );
      await mutate("/admin/coupons");
      setCouponForm(null);
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar el cupón.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
        Fidelización
      </p>
      <h1 className="mt-2 font-display text-[38px] leading-none tracking-[-0.045em] text-ink">
        Recompensas
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Crea los logros que desbloquean puntos e insignias y administra los
        cupones que los clientes pueden adquirir con sus puntos.
      </p>

      <ErrorNotice error={achievementsError || couponsError} className="mt-5" />
      {error ? (
        <div className="mt-4 rounded-[20px] bg-accent-tint p-4 text-sm font-semibold text-accent">
          {error}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("achievements")}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
            tab === "achievements"
              ? "bg-ink text-white"
              : "bg-beige text-ink hover:bg-[#ebe0d4]"
          }`}
        >
          <Trophy className="h-4 w-4" aria-hidden="true" />
          Logros
        </button>
        <button
          type="button"
          onClick={() => setTab("coupons")}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
            tab === "coupons"
              ? "bg-ink text-white"
              : "bg-beige text-ink hover:bg-[#ebe0d4]"
          }`}
        >
          <Gift className="h-4 w-4" aria-hidden="true" />
          Cupones
        </button>
      </div>

      {tab === "achievements" ? (
        <section className="mt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-[24px] leading-tight tracking-[-0.03em] text-ink">
                Logros
              </h2>
              <p className="mt-1 text-sm text-muted">
                Los logros desbloqueados otorgan puntos e insignia.
              </p>
            </div>
            <Button type="button" onClick={() => openAchievement()}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nuevo logro
            </Button>
          </div>

          {achievementsLoading ? (
            <div className="mt-3 rounded-[24px] bg-soft p-6 text-center text-sm text-muted">
              Cargando logros…
            </div>
          ) : achievements.length ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {achievements.map((achievement) => (
                <article
                  key={achievement.id}
                  className="rounded-[24px] border border-line/70 bg-white/70 p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-tint text-[24px]">
                      {achievement.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-sm font-semibold text-ink">
                          {achievement.title}
                        </h3>
                        <Pill tone={achievement.isActive ? "open" : "beige"}>
                          {achievement.isActive ? "Activo" : "Inactivo"}
                        </Pill>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        {achievement.description}
                      </p>
                      <p className="mt-1 text-[11px] text-muted">
                        {requirementLabels[achievement.requirementType] ||
                          achievement.requirementType}{" "}
                        · {achievement.requirementValue} ·{" "}
                        <span className="font-semibold text-accent">
                          +{achievement.rewardPoints} pts
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAchievement(achievement)}
                      className="rounded-full bg-white p-2 text-muted shadow-sm transition hover:text-accent"
                      aria-label={`Editar ${achievement.title}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-muted">
                    {achievement.code}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-[24px] bg-soft p-6 text-center text-sm text-muted">
              Aún no hay logros. Crea el primero.
            </div>
          )}
        </section>
      ) : (
        <section className="mt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-[24px] leading-tight tracking-[-0.03em] text-ink">
                Cupones
              </h2>
              <p className="mt-1 text-sm text-muted">
                Los cupones pertenecen a un negocio y se canjean solo allí.
              </p>
            </div>
            <Button type="button" onClick={() => openCoupon()}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nuevo cupón
            </Button>
          </div>

          {couponsLoading ? (
            <div className="mt-3 rounded-[24px] bg-soft p-6 text-center text-sm text-muted">
              Cargando cupones…
            </div>
          ) : coupons.length ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {coupons.map((coupon) => (
                <article
                  key={coupon.id}
                  className="rounded-[24px] border border-line/70 bg-white/70 p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-tint text-[24px]">
                      {coupon.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-sm font-semibold text-ink">
                          {coupon.title}
                        </h3>
                        <Pill tone={statusTone(coupon.status)}>
                          {coupon.status === "active"
                            ? "Activo"
                            : coupon.status === "paused"
                              ? "Pausado"
                              : "Finalizado"}
                        </Pill>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {coupon.business?.name || "Negocio"} ·{" "}
                        {coupon.pointsCost} puntos
                      </p>
                      <p className="mt-1 text-[11px] text-muted">
                        Stock: {coupon.stock} · Adquiridos:{" "}
                        {coupon.stats?.acquired || 0} · Activados:{" "}
                        {coupon.stats?.activated || 0} · Usados:{" "}
                        {coupon.stats?.used || 0}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCoupon(coupon)}
                      className="rounded-full bg-white p-2 text-muted shadow-sm transition hover:text-accent"
                      aria-label={`Editar ${coupon.title}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-[24px] bg-soft p-6 text-center text-sm text-muted">
              Aún no hay cupones configurados.
            </div>
          )}
        </section>
      )}

      {achievementForm ? (
        <Modal
          title={achievementForm.id ? "Editar logro" : "Nuevo logro"}
          description="El progreso empieza a contar desde la creación del logro."
          onClose={() => setAchievementForm(null)}
          size="wide"
        >
          <form onSubmit={saveAchievement} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Código"
                value={achievementForm.code}
                onChange={(value) =>
                  setAchievementForm((form) => ({ ...form, code: value }))
                }
                placeholder="primer-plato"
              />
              <Field
                label="Título"
                value={achievementForm.title}
                onChange={(value) =>
                  setAchievementForm((form) => ({ ...form, title: value }))
                }
                placeholder="Primer plato puntuado"
              />
            </div>
            <Field
              label="Descripción"
              value={achievementForm.description}
              onChange={(value) =>
                setAchievementForm((form) => ({ ...form, description: value }))
              }
              placeholder="Describe cómo se desbloquea"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Emoji / insignia"
                value={achievementForm.icon}
                onChange={(value) =>
                  setAchievementForm((form) => ({ ...form, icon: value }))
                }
                placeholder="🏆"
              />
              <label className="block text-sm font-semibold text-ink">
                Tipo de requisito
                <select
                  value={achievementForm.requirementType}
                  onChange={(event) =>
                    setAchievementForm((form) => ({
                      ...form,
                      requirementType: event.target.value,
                    }))
                  }
                  className="mt-1.5 w-full rounded-2xl border border-line bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent/60 focus:bg-white"
                >
                  {requirementOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field
                label="Valor requerido"
                type="number"
                value={achievementForm.requirementValue}
                onChange={(value) =>
                  setAchievementForm((form) => ({
                    ...form,
                    requirementValue: value,
                  }))
                }
              />
              <Field
                label="Puntos de recompensa"
                type="number"
                value={achievementForm.rewardPoints}
                onChange={(value) =>
                  setAchievementForm((form) => ({
                    ...form,
                    rewardPoints: value,
                  }))
                }
              />
              <Field
                label="Orden"
                type="number"
                value={achievementForm.order}
                onChange={(value) =>
                  setAchievementForm((form) => ({ ...form, order: value }))
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                checked={achievementForm.isActive}
                onChange={(event) =>
                  setAchievementForm((form) => ({
                    ...form,
                    isActive: event.target.checked,
                  }))
                }
              />
              Logro activo
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAchievementForm(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Guardando…" : "Guardar logro"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {couponForm ? (
        <Modal
          title={couponForm.id ? "Editar cupón" : "Nuevo cupón"}
          description="El cupón solo podrá canjearse en el negocio seleccionado."
          onClose={() => setCouponForm(null)}
          size="wide"
        >
          <form onSubmit={saveCoupon} className="space-y-4">
            {!couponForm.id ? (
              <label className="block text-sm font-semibold text-ink">
                Negocio
                <select
                  value={couponForm.businessId}
                  onChange={(event) =>
                    setCouponForm((form) => ({
                      ...form,
                      businessId: event.target.value,
                    }))
                  }
                  className="mt-1.5 w-full rounded-2xl border border-line bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent/60 focus:bg-white"
                >
                  <option value="">Selecciona un negocio</option>
                  {businesses.map((business) => (
                    <option key={business._id} value={business._id}>
                      {business.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Título"
                value={couponForm.title}
                onChange={(value) =>
                  setCouponForm((form) => ({ ...form, title: value }))
                }
                placeholder="Postre gratis"
              />
              <Field
                label="Emoji"
                value={couponForm.emoji}
                onChange={(value) =>
                  setCouponForm((form) => ({ ...form, emoji: value }))
                }
                placeholder="🎁"
              />
            </div>
            <Field
              label="Descripción"
              value={couponForm.description}
              onChange={(value) =>
                setCouponForm((form) => ({ ...form, description: value }))
              }
              placeholder="Qué incluye el cupón y condiciones"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <Field
                label="Costo en puntos"
                type="number"
                value={couponForm.pointsCost}
                onChange={(value) =>
                  setCouponForm((form) => ({ ...form, pointsCost: value }))
                }
              />
              <Field
                label="Stock"
                type="number"
                value={couponForm.stock}
                onChange={(value) =>
                  setCouponForm((form) => ({ ...form, stock: value }))
                }
              />
              <Field
                label="Límite por cliente"
                type="number"
                value={couponForm.perUserLimit}
                onChange={(value) =>
                  setCouponForm((form) => ({ ...form, perUserLimit: value }))
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field
                label="Días de validez"
                type="number"
                value={couponForm.validityDays}
                onChange={(value) =>
                  setCouponForm((form) => ({ ...form, validityDays: value }))
                }
              />
              <Field
                label="Disponible desde"
                type="date"
                value={couponForm.availableFrom}
                onChange={(value) =>
                  setCouponForm((form) => ({ ...form, availableFrom: value }))
                }
              />
              <Field
                label="Disponible hasta"
                type="date"
                value={couponForm.availableUntil}
                onChange={(value) =>
                  setCouponForm((form) => ({ ...form, availableUntil: value }))
                }
              />
            </div>
            <label className="block text-sm font-semibold text-ink">
              Estado
              <select
                value={couponForm.status}
                onChange={(event) =>
                  setCouponForm((form) => ({
                    ...form,
                    status: event.target.value,
                  }))
                }
                className="mt-1.5 w-full rounded-2xl border border-line bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent/60 focus:bg-white"
              >
                <option value="active">Activo</option>
                <option value="paused">Pausado</option>
                <option value="ended">Finalizado</option>
              </select>
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCouponForm(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Guardando…" : "Guardar cupón"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
