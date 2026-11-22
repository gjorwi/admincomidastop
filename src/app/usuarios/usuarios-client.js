"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { ShieldCheck, UserPlus, UserRound } from "lucide-react";
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

export default function UsersClient() {
  const { mutate } = useSWRConfig();
  const { data, error } = useSWR("/admin/users", apiFetch);
  const users = data?.users || [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const toggleStatus = async (user) => {
    await apiFetch(`/admin/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: user.status === "active" ? "suspended" : "active",
      }),
    });
    await mutate("/admin/users");
    await mutate("/admin/stats");
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
            className={`flex flex-wrap items-center gap-3 px-4 py-3.5 ${
              index > 0 ? "border-t border-line" : ""
            }`}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
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
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                {user.name}
              </p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
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
        ))}
      </div>

      {!users.length && !error ? (
        <div className="rounded-[24px] bg-soft p-6 text-center text-sm text-muted">
          No hay usuarios registrados.
        </div>
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
