"use client";

import { useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import Image from "next/image";
import { Check, Clock3, Mail, MapPin, Phone, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button, ErrorNotice, Field, Modal, Pill, SectionTitle } from "@/components/ui";

const statuses = [
  { id: "pending", label: "Pendientes" },
  { id: "approved", label: "Aprobadas" },
  { id: "rejected", label: "Rechazadas" },
];

function statusTone(status) {
  if (status === "approved") return "open";
  if (status === "rejected") return "red";
  return "amber";
}

function getRequestCategory(request, categoryMap) {
  if (request.categoryKey === "otro") return request.categoryOther || "Otro";
  return categoryMap.get(request.categoryKey)?.label || request.categoryKey;
}

function formatDate(value) {
  if (!value) return "No registrado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No registrado";
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getMapUrl(request) {
  const lat = request.location?.lat;
  const lng = request.location?.lng;
  const query =
    typeof lat === "number" && Number.isFinite(lat) &&
    typeof lng === "number" && Number.isFinite(lng)
      ? `${lat},${lng}`
      : request.address;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function RequestsClient() {
  const { mutate } = useSWRConfig();
  const [status, setStatus] = useState("pending");
  const { data: categoriesData, error: categoriesError } = useSWR("/admin/categories", apiFetch);
  const { data, error: requestsError } = useSWR(`/admin/requests?status=${status}`, apiFetch);
  const [action, setAction] = useState(null);
  const [notes, setNotes] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const { data: detailData, error: detailError, isLoading: detailLoading } = useSWR(
    detailRequest ? `/admin/requests/${detailRequest.id}` : null,
    apiFetch,
  );
  const [detailRequest, setDetailRequest] = useState(null);

  const requests = data?.requests || [];
  const categories = useMemo(
    () => categoriesData?.categories || [],
    [categoriesData],
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const requestDetail = detailData?.request || detailRequest;

  const openAction = (request, type) => {
    setAction({ request, type });
    setNotes(request.notes || "");
    setPassword("");
    setError("");
    setCredentials(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!action) return;
    setLoading(true);
    setError("");
    try {
      const payload = await apiFetch(`/admin/requests/${action.request.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: action.type === "approve" ? "approved" : "rejected",
          notes,
          ...(action.type === "approve" && password
            ? { password }
            : {}),
        }),
      });
      await mutate(`/admin/requests?status=${status}`);
      await mutate("/admin/requests?status=pending");
      await mutate("/admin/stats");
      if (payload.credentials) {
        setCredentials(payload.credentials);
      } else {
        setAction(null);
      }
    } catch (submitError) {
      setError(submitError.message || "No se pudo procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
        Incorporación de negocios
      </p>
      <h1 className="mt-2 font-display text-[38px] leading-none tracking-[-0.045em] text-ink">
        Solicitudes
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Revisa la información y aprueba las credenciales de acceso al panel de
        negocios.
      </p>

      <ErrorNotice error={requestsError || categoriesError} className="mt-5" />

      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
        {statuses.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStatus(item.id)}
            className={`inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition ${
              status === item.id
                ? "bg-ink text-white"
                : "bg-beige text-ink hover:bg-[#ebe0d4]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <SectionTitle
        title="Listado"
        description={`${requests.length} solicitudes en esta vista`}
      />

      {requests.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-[24px] border border-line/70 bg-white/70 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl tracking-[-0.03em] text-ink">
                    {request.businessName}
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                  {getRequestCategory(request, categoryMap)} · {request.municipality || request.zone || "Venezuela"}
                  </p>
                </div>
                <Pill tone={statusTone(request.status)}>
                  {request.status === "pending"
                    ? "Pendiente"
                    : request.status === "approved"
                      ? "Aprobada"
                      : "Rechazada"}
                </Pill>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-muted">
                <p className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {request.ownerName} · {request.email}
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {request.phone} · WhatsApp {request.whatsapp}
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {request.address}
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  {request.hours || "Horario no indicado"}
                </p>
              </div>

              {request.description ? (
                <p className="mt-3 line-clamp-3 text-xs leading-5 text-muted">
                  {request.description}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDetailRequest(request)}
                >
                  Ver detalle
                </Button>
                {request.status === "pending" ? (
                  <>
                  <Button
                    type="button"
                    onClick={() => openAction(request, "approve")}
                  >
                    <Check className="h-4 w-4" />
                    Aprobar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => openAction(request, "reject")}
                  >
                    <X className="h-4 w-4" />
                    Rechazar
                  </Button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] bg-soft p-6 text-center text-sm text-muted">
          No hay solicitudes en esta vista.
        </div>
      )}

      {action ? (
        <Modal
          title={action.type === "approve" ? "Aprobar negocio" : "Rechazar solicitud"}
          description={
            action.type === "approve"
              ? "Se creará el negocio y su cuenta de acceso."
              : "La solicitud quedará cerrada sin crear acceso."
          }
          onClose={() => setAction(null)}
        >
          {credentials ? (
            <div>
              <div className="rounded-2xl bg-green-tint p-4">
                <p className="text-sm font-semibold text-ink">
                  Negocio aprobado
                </p>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Comparte estas credenciales con el negocio. La contraseña no
                  se volverá a mostrar.
                </p>
                <div className="mt-3 space-y-1 rounded-xl bg-white/70 p-3 font-mono text-xs text-ink">
                  <p>Email: {credentials.email}</p>
                  <p>Contraseña: {credentials.password}</p>
                </div>
              </div>
              <Button className="mt-4" onClick={() => setAction(null)}>
                Entendido
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {action.type === "approve" ? (
                <Field
                  label="Contraseña temporal"
                  value={password}
                  onChange={setPassword}
                  type="text"
                  placeholder="Déjala vacía para generar una automática"
                />
              ) : null}
              <Field
                label="Notas internas"
                value={notes}
                onChange={setNotes}
                placeholder="Observaciones de la revisión"
                multiline
              />
              {error ? (
                <p className="text-sm font-semibold text-accent">{error}</p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setAction(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant={action.type === "approve" ? "primary" : "danger"}
                  className="flex-1"
                  disabled={loading}
                >
                  {loading
                    ? "Procesando…"
                    : action.type === "approve"
                      ? "Aprobar y crear acceso"
                      : "Rechazar solicitud"}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      ) : null}

      {detailRequest ? (
        <Modal
          size="wide"
          title={requestDetail.businessName}
          description="Detalle de la solicitud de registro"
          onClose={() => setDetailRequest(null)}
        >
          {detailError ? <ErrorNotice error={detailError} /> : null}
          {detailLoading && !detailData ? (
            <p className="rounded-2xl bg-soft p-5 text-center text-sm text-muted">
              Cargando detalle de la solicitud…
            </p>
          ) : null}
          <div className="space-y-5">
            {requestDetail.coverImage ? (
              <Image
                src={requestDetail.coverImage}
                alt={`Portada de ${requestDetail.businessName}`}
                width={1200}
                height={540}
                unoptimized
                className="h-48 w-full rounded-[20px] object-cover sm:h-64"
              />
            ) : (
              <div className="flex h-40 items-center justify-center rounded-[20px] bg-accent-tint text-5xl">
                🍽️
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-soft p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Tipo de negocio
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {getRequestCategory(requestDetail, categoryMap)}
                </p>
                {requestDetail.categoryKey === "otro" && requestDetail.categoryOther ? (
                  <p className="mt-1 text-xs text-muted">Categoría declarada: {requestDetail.categoryOther}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted">
                  Domicilio: {requestDetail.hasDelivery ? "Sí" : "No"}
                </p>
              </div>
              <div className="rounded-2xl bg-soft p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Ubicación
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {[requestDetail.municipality, requestDetail.parish, requestDetail.sector]
                    .filter(Boolean)
                    .join(" · ") || requestDetail.zone || "No especificada"}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">{requestDetail.address}</p>
                <a
                  href={getMapUrl(requestDetail)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
                >
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  Ver ubicación en el mapa
                </a>
                {typeof requestDetail.location?.lat === "number" &&
                Number.isFinite(requestDetail.location.lat) &&
                typeof requestDetail.location?.lng === "number" &&
                Number.isFinite(requestDetail.location.lng) ? (
                  <p className="mt-1 text-[10px] text-muted">
                    {requestDetail.location.lat.toFixed(6)}, {requestDetail.location.lng.toFixed(6)}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-line/70 p-4">
              <h3 className="text-sm font-semibold text-ink">Contacto del responsable</h3>
              <div className="mt-2 grid gap-2 text-xs text-muted sm:grid-cols-2">
                <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" />{requestDetail.ownerName}</p>
                <a className="flex items-center gap-2 hover:text-accent" href={`mailto:${requestDetail.email}`}><Mail className="h-3.5 w-3.5 shrink-0" />{requestDetail.email}</a>
                <a className="flex items-center gap-2 hover:text-accent" href={`tel:${requestDetail.phone.replace(/[^0-9+]/g, "")}`}><Phone className="h-3.5 w-3.5 shrink-0" />{requestDetail.phone}</a>
                <a className="flex items-center gap-2 hover:text-accent" href={`https://wa.me/${requestDetail.whatsapp}`} target="_blank" rel="noreferrer"><Phone className="h-3.5 w-3.5 shrink-0" />WhatsApp {requestDetail.whatsapp}</a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-soft p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Horario</p>
                <p className="mt-1 text-sm text-ink">{requestDetail.hours || "No indicado"}</p>
              </div>
              <div className="rounded-2xl bg-soft p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Solicitud recibida</p>
                <p className="mt-1 text-sm text-ink">{formatDate(requestDetail.createdAt)}</p>
              </div>
            </div>

            {requestDetail.description ? (
              <div>
                <h3 className="text-sm font-semibold text-ink">Descripción</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted">{requestDetail.description}</p>
              </div>
            ) : null}

            <div className="rounded-2xl bg-amber-tint p-4 text-xs leading-5 text-[#6a4700]">
              <p className="font-semibold">Aceptación legal</p>
              <p className="mt-1">Aceptó términos y política el {formatDate(requestDetail.termsAcceptedAt)} · versión {requestDetail.termsVersion || "no registrada"}.</p>
            </div>

            {requestDetail.status === "pending" ? (
              <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
                <Button type="button" variant="danger" onClick={() => { setDetailRequest(null); openAction(requestDetail, "reject"); }}>
                  <X className="h-4 w-4" /> Rechazar
                </Button>
                <Button type="button" onClick={() => { setDetailRequest(null); openAction(requestDetail, "approve"); }}>
                  <Check className="h-4 w-4" /> Aprobar
                </Button>
              </div>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
