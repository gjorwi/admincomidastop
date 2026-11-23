"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  Building2,
  CalendarDays,
  KeyRound,
  Mail,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  Button,
  ErrorNotice,
  Field,
  Modal,
  Pill,
  SectionTitle,
} from "@/components/ui";

const emptyForm = { name: "", email: "", password: "" };

function formatDate(value) {
  if (!value) return "No registrado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No registrado";
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function roleLabel(role) {
  return role === "admin" ? "Administrador" : "Cuenta de negocio";
}

export default function UsersClient() {
  const { mutate } = useSWRConfig();
  const { data, error } = useSWR("/admin/users", apiFetch);
  const users = data?.users || [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSaving, setResetSaving] = useState(false);
  const [resetCredentials, setResetCredentials] = useState(null);

  const toggleStatus = async (user) => {
    const nextStatus = user.status === "active" ? "suspended" : "active";
    await apiFetch(`/admin/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus }),
    });
    await mutate("/admin/users");
    await mutate("/admin/stats");
    setSelectedUser((current) =>
      current?.id === user.id ? { ...current, status: nextStatus } : current,
    );
  };

  const openReset = (user) => {
    setSelectedUser(null);
    setResetUser(user);
    setResetPassword("");
    setResetError("");
    setResetCredentials(null);
  };

  const closeReset = () => {
    setResetUser(null);
    setResetPassword("");
    setResetError("");
    setResetCredentials(null);
  };

  const resetUserPassword = async (event) => {
    event.preventDefault();
    if (!resetUser) return;
    setResetSaving(true);
    setResetError("");
    try {
      const payload = await apiFetch(
        `/admin/users/${resetUser.id}/reset-password`,
        {
          method: "POST",
          body: JSON.stringify(
            resetPassword ? { password: resetPassword } : {},
          ),
        },
      );
      setResetCredentials(payload.credentials);
    } catch (submitError) {
      setResetError(
        submitError.message || "No se pudo actualizar la contraseña.",
      );
    } finally {
      setResetSaving(false);
    }
  };

  const openForm = () => {
    setForm(emptyForm);
    setFormError("");
    setCredentials(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setCredentials(null);
  };

  const createAdmin = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = await apiFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password || undefined,
        }),
      });
      setCredentials(payload.credentials);
      await mutate("/admin/users");
      await mutate("/admin/stats");
    } catch (submitError) {
      setFormError(submitError.message || "No se pudo crear el administrador.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
        Accesos
      </p>
      <h1 className="mt-2 font-display text-[38px] leading-none tracking-[-0.045em] text-ink">
        Usuarios
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Administra las cuentas de administración. Las cuentas de negocio se
        crean automáticamente al aprobar una solicitud.
      </p>

      <ErrorNotice error={error} className="mt-5" />

      <div className="mt-5 flex justify-end">
        <Button type="button" onClick={openForm}>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Nuevo administrador
        </Button>
      </div>

      <SectionTitle
        title="Cuentas"
        description={`${users.length} registradas`}
      />

      <div className="overflow-hidden rounded-[24px] border border-line/70 bg-white/70 shadow-sm">
        {users.map((user, index) => (
          <div
            key={user.id}
            className={`flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center ${
              index > 0 ? "border-t border-line" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedUser(user)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
              aria-label={`Ver detalle de ${user.name}`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                  user.role === "admin"
                    ? "bg-accent-tint text-accent"
                    : "bg-beige text-ink"
                }`}
              >
                {user.role === "admin" ? (
                  <ShieldCheck className="h-5 w-5" />
                ) : (
                  <UserRound className="h-5 w-5" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">
                  {user.name}
                </span>
                <span className="block truncate text-xs text-muted">
                  {user.email}
                </span>
              </span>
              <span className="shrink-0 text-[11px] font-semibold text-accent sm:hidden">
                Ver
              </span>
            </button>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <Pill tone={user.role === "admin" ? "accent" : "beige"}>
                {user.role === "admin" ? "Admin" : "Negocio"}
              </Pill>
              <Pill tone={user.status === "active" ? "open" : "red"}>
                {user.status === "active" ? "Activo" : "Suspendido"}
              </Pill>
              <Button
                type="button"
                variant={user.status === "active" ? "danger" : "secondary"}
                onClick={() => toggleStatus(user)}
              >
                {user.status === "active" ? "Suspender" : "Activar"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!users.length && !error ? (
        <div className="rounded-[24px] bg-soft p-6 text-center text-sm text-muted">
          No hay usuarios registrados.
        </div>
      ) : null}

      {selectedUser ? (
        <Modal
          title={selectedUser.name}
          description="Detalle de la cuenta"
          onClose={() => setSelectedUser(null)}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Pill tone={selectedUser.role === "admin" ? "accent" : "beige"}>
                {roleLabel(selectedUser.role)}
              </Pill>
              <Pill tone={selectedUser.status === "active" ? "open" : "red"}>
                {selectedUser.status === "active" ? "Activo" : "Suspendido"}
              </Pill>
            </div>

            <div className="space-y-2 rounded-2xl bg-soft p-4 text-sm text-muted">
              <p className="flex items-start gap-2">
                <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span className="min-w-0 break-all text-ink">
                  {selectedUser.name}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span className="min-w-0 break-all text-ink">
                  {selectedUser.email}
                </span>
              </p>
              {selectedUser.role === "business" ? (
                <p className="flex items-start gap-2">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="min-w-0 text-ink">
                    {selectedUser.businessName ||
                      "Cuenta de negocio sin establecimiento asociado"}
                  </span>
                </p>
              ) : null}
              <p className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span className="min-w-0 text-ink">
                  Creada el {formatDate(selectedUser.createdAt)}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => openReset(selectedUser)}
            >
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              Resetear contraseña
            </Button>
            <Button
              type="button"
              variant={selectedUser.status === "active" ? "danger" : "secondary"}
              onClick={() => toggleStatus(selectedUser)}
            >
              {selectedUser.status === "active"
                ? "Suspender cuenta"
                : "Activar cuenta"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedUser(null)}
            >
              Cerrar
            </Button>
          </div>
        </Modal>
      ) : null}

      {resetUser ? (
        <Modal
          title="Resetear contraseña"
          description={`${resetUser.name} · ${resetUser.email}`}
          onClose={closeReset}
        >
          {resetCredentials ? (
            <div>
              <div className="rounded-2xl bg-green-tint p-4">
                <p className="text-sm font-semibold text-ink">
                  Contraseña actualizada
                </p>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Comparte estas credenciales con el usuario. La contraseña no
                  se volverá a mostrar.
                </p>
                <div className="mt-3 space-y-1 rounded-xl bg-white/70 p-3 font-mono text-xs text-ink">
                  <p>Email: {resetCredentials.email}</p>
                  <p>Contraseña: {resetCredentials.password}</p>
                </div>
              </div>
              <Button className="mt-4 w-full" onClick={closeReset}>
                Entendido
              </Button>
            </div>
          ) : (
            <form onSubmit={resetUserPassword} className="space-y-4">
              <Field
                label="Nueva contraseña"
                value={resetPassword}
                onChange={setResetPassword}
                placeholder="Déjala vacía para generar una automática"
              />
              <p className="text-[11px] leading-4 text-muted">
                Si escribes una contraseña, debe tener al menos 8 caracteres.
              </p>
              {resetError ? (
                <p className="text-sm font-semibold text-accent">{resetError}</p>
              ) : null}
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={closeReset}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={resetSaving}
                >
                  {resetSaving ? "Actualizando…" : "Actualizar contraseña"}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      ) : null}

      {showForm ? (
        <Modal
          title="Nuevo administrador"
          description="Crea una cuenta con acceso completo al panel."
          onClose={closeForm}
        >
          {credentials ? (
            <div>
              <div className="rounded-2xl bg-green-tint p-4">
                <p className="text-sm font-semibold text-ink">
                  Administrador creado
                </p>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Comparte estas credenciales. La contraseña no se volverá a
                  mostrar.
                </p>
                <div className="mt-3 space-y-1 rounded-xl bg-white/70 p-3 font-mono text-xs text-ink">
                  <p>Email: {credentials.email}</p>
                  <p>Contraseña: {credentials.password}</p>
                </div>
              </div>
              <Button className="mt-4 w-full" onClick={closeForm}>
                Entendido
              </Button>
            </div>
          ) : (
            <form onSubmit={createAdmin} className="space-y-4">
              <Field
                label="Nombre"
                value={form.name}
                onChange={(value) => setForm({ ...form, name: value })}
                placeholder="Nombre completo"
              />
              <Field
                label="Correo"
                type="email"
                value={form.email}
                onChange={(value) => setForm({ ...form, email: value })}
                placeholder="correo@comidastop.app"
              />
              <Field
                label="Contraseña temporal"
                value={form.password}
                onChange={(value) => setForm({ ...form, password: value })}
                placeholder="Mínimo 8 caracteres. Déjala vacía para generarla."
              />
              {formError ? (
                <p className="text-sm font-semibold text-accent">{formError}</p>
              ) : null}
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={closeForm}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={saving || !form.name || !form.email}
                >
                  {saving ? "Creando…" : "Crear administrador"}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      ) : null}
    </div>
  );
}
