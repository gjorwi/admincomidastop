"use client";

import { useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  Building2,
  CalendarDays,
  KeyRound,
  Mail,
  Search,
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
} from "@/components/ui";

const emptyForm = { name: "", email: "", password: "" };

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos los estados" },
  { value: "active", label: "Activos" },
  { value: "suspended", label: "Suspendidos" },
  { value: "pending", label: "Pendientes" },
];

const ADMIN_ROLE_OPTIONS = [
  { value: "todos", label: "Todos los tipos" },
  { value: "admin", label: "Administradores" },
  { value: "business", label: "Negocios" },
];

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
  if (role === "admin") return "Administrador";
  if (role === "business") return "Cuenta de negocio";
  if (role === "client") return "Cliente";
  return "Usuario";
}

function roleShortLabel(role) {
  if (role === "admin") return "Admin";
  if (role === "business") return "Negocio";
  if (role === "client") return "Cliente";
  return "Usuario";
}

function roleTone(role) {
  if (role === "admin") return "accent";
  if (role === "client") return "dark";
  return "beige";
}

function statusLabel(status) {
  if (status === "active") return "Activo";
  if (status === "suspended") return "Suspendido";
  if (status === "pending") return "Pendiente";
  return status;
}

function statusTone(status) {
  if (status === "active") return "open";
  if (status === "pending") return "amber";
  return "red";
}

function filterUsers(users, { query, role = "todos", status = "todos" }) {
  const normalizedQuery = query.trim().toLowerCase();

  return users.filter((user) => {
    if (role !== "todos" && user.role !== role) return false;
    if (status !== "todos" && user.status !== status) return false;
    if (!normalizedQuery) return true;

    const text = `${user.name} ${user.email} ${user.businessName || ""}`
      .toLowerCase()
      .trim();
    return text.includes(normalizedQuery);
  });
}

function RoleIcon({ role }) {
  if (role === "admin") return <ShieldCheck className="h-5 w-5" />;
  if (role === "business") return <Building2 className="h-5 w-5" />;
  return <UserRound className="h-5 w-5" />;
}

function ToolbarSelect({ label, value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      className="min-h-11 rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink outline-none transition focus:border-accent/60"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function UserToolbar({
  query,
  onQueryChange,
  role,
  onRoleChange,
  status,
  onStatusChange,
  placeholder,
}) {
  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
      <label className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="min-h-11 w-full rounded-full border border-line bg-white pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent/60"
        />
      </label>

      {onRoleChange ? (
        <ToolbarSelect
          label="Filtrar por tipo de cuenta"
          value={role}
          onChange={onRoleChange}
          options={ADMIN_ROLE_OPTIONS}
        />
      ) : null}

      <ToolbarSelect
        label="Filtrar por estado"
        value={status}
        onChange={onStatusChange}
        options={STATUS_OPTIONS}
      />
    </div>
  );
}

function UserRow({ user, index, onSelect, onToggleStatus }) {
  const iconTone =
    user.role === "admin"
      ? "bg-accent-tint text-accent"
      : user.role === "business"
        ? "bg-beige text-ink"
        : "bg-soft text-muted";

  return (
    <div
      className={`flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center ${
        index > 0 ? "border-t border-line" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(user)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        aria-label={`Ver detalle de ${user.name}`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconTone}`}
        >
          <RoleIcon role={user.role} />
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
        <Pill tone={roleTone(user.role)}>{roleShortLabel(user.role)}</Pill>
        {user.authProvider === "google" ? (
          <Pill tone="beige">Google</Pill>
        ) : null}
        <Pill tone={statusTone(user.status)}>
          {statusLabel(user.status)}
        </Pill>
        <Button
          type="button"
          variant={user.status === "active" ? "danger" : "secondary"}
          onClick={() => onToggleStatus(user)}
        >
          {user.status === "active" ? "Suspender" : "Activar"}
        </Button>
      </div>
    </div>
  );
}

function UserList({
  users,
  total,
  emptyMessage,
  noMatchMessage,
  onSelect,
  onToggleStatus,
}) {
  if (!users.length) {
    return (
      <div className="mt-3 rounded-[24px] bg-soft p-6 text-center text-sm text-muted">
        {total === 0 ? emptyMessage : noMatchMessage}
      </div>
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-[24px] border border-line/70 bg-white/70 shadow-sm">
      {users.map((user, index) => (
        <UserRow
          key={user.id}
          user={user}
          index={index}
          onSelect={onSelect}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  );
}

export default function UsersClient() {
  const { mutate } = useSWRConfig();
  const { data, error } = useSWR("/admin/users", apiFetch);
  const users = useMemo(() => data?.users || [], [data]);
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
  const [activeTab, setActiveTab] = useState("staff");
  const [adminQuery, setAdminQuery] = useState("");
  const [adminRole, setAdminRole] = useState("todos");
  const [adminStatus, setAdminStatus] = useState("todos");
  const [clientQuery, setClientQuery] = useState("");
  const [clientStatus, setClientStatus] = useState("todos");

  const adminUsers = useMemo(
    () =>
      users.filter(
        (user) => user.role === "admin" || user.role === "business",
      ),
    [users],
  );
  const clientUsers = useMemo(
    () => users.filter((user) => user.role === "client"),
    [users],
  );
  const filteredAdminUsers = useMemo(
    () =>
      filterUsers(adminUsers, {
        query: adminQuery,
        role: adminRole,
        status: adminStatus,
      }),
    [adminQuery, adminRole, adminStatus, adminUsers],
  );
  const filteredClientUsers = useMemo(
    () =>
      filterUsers(clientUsers, {
        query: clientQuery,
        status: clientStatus,
      }),
    [clientQuery, clientStatus, clientUsers],
  );

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

  const handleTabKeyDown = (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextTab = activeTab === "staff" ? "clients" : "staff";
    setActiveTab(nextTab);
    event.currentTarget.querySelector(`#tab-${nextTab}`)?.focus();
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
        Gestiona las cuentas de administración, negocios y clientes. Las cuentas
        de negocio se crean al aprobar una solicitud.
      </p>

      <ErrorNotice error={error} className="mt-5" />

      <div
        role="tablist"
        aria-label="Tipo de usuario"
        onKeyDown={handleTabKeyDown}
        className="mt-5 flex flex-wrap gap-2"
      >
        <button
          id="tab-staff"
          type="button"
          role="tab"
          aria-selected={activeTab === "staff"}
          aria-controls="panel-staff"
          tabIndex={activeTab === "staff" ? 0 : -1}
          onClick={() => setActiveTab("staff")}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
            activeTab === "staff"
              ? "bg-ink text-white"
              : "bg-beige text-ink hover:bg-[#ebe0d4]"
          }`}
        >
          <span className="sm:hidden">Admin y negocios</span>
          <span className="hidden sm:inline">Administradores y negocios</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] ${
              activeTab === "staff"
                ? "bg-white/15 text-white"
                : "bg-white/70 text-ink"
            }`}
          >
            {adminUsers.length}
          </span>
        </button>

        <button
          id="tab-clients"
          type="button"
          role="tab"
          aria-selected={activeTab === "clients"}
          aria-controls="panel-clients"
          tabIndex={activeTab === "clients" ? 0 : -1}
          onClick={() => setActiveTab("clients")}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
            activeTab === "clients"
              ? "bg-ink text-white"
              : "bg-beige text-ink hover:bg-[#ebe0d4]"
          }`}
        >
          Clientes
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] ${
              activeTab === "clients"
                ? "bg-white/15 text-white"
                : "bg-white/70 text-ink"
            }`}
          >
            {clientUsers.length}
          </span>
        </button>
      </div>

      {activeTab === "staff" ? (
        <div
          id="panel-staff"
          role="tabpanel"
          aria-labelledby="tab-staff"
          className="mt-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {filteredAdminUsers.length} de {adminUsers.length} cuentas
            </p>
            <Button type="button" onClick={openForm}>
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Nuevo administrador
            </Button>
          </div>

          <UserToolbar
            query={adminQuery}
            onQueryChange={setAdminQuery}
            role={adminRole}
            onRoleChange={setAdminRole}
            status={adminStatus}
            onStatusChange={setAdminStatus}
            placeholder="Buscar admin, negocio o correo"
          />
          <UserList
            users={filteredAdminUsers}
            total={adminUsers.length}
            emptyMessage="No hay cuentas de administración ni negocios registrados."
            noMatchMessage="No hay cuentas que coincidan con la búsqueda o los filtros."
            onSelect={setSelectedUser}
            onToggleStatus={toggleStatus}
          />
        </div>
      ) : (
        <div
          id="panel-clients"
          role="tabpanel"
          aria-labelledby="tab-clients"
          className="mt-4"
        >
          <p className="text-sm text-muted">
            {filteredClientUsers.length} de {clientUsers.length} clientes
          </p>

          <UserToolbar
            query={clientQuery}
            onQueryChange={setClientQuery}
            status={clientStatus}
            onStatusChange={setClientStatus}
            placeholder="Buscar cliente por nombre o correo"
          />
          <UserList
            users={filteredClientUsers}
            total={clientUsers.length}
            emptyMessage="Aún no hay usuarios clientes registrados."
            noMatchMessage="No hay clientes que coincidan con la búsqueda o los filtros."
            onSelect={setSelectedUser}
            onToggleStatus={toggleStatus}
          />
        </div>
      )}

      {selectedUser ? (
        <Modal
          title={selectedUser.name}
          description="Detalle de la cuenta"
          onClose={() => setSelectedUser(null)}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Pill tone={roleTone(selectedUser.role)}>
                {roleLabel(selectedUser.role)}
              </Pill>
              <Pill tone={statusTone(selectedUser.status)}>
                {statusLabel(selectedUser.status)}
              </Pill>
              {selectedUser.authProvider === "google" ? (
                <Pill tone="beige">Google</Pill>
              ) : null}
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
                <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span className="min-w-0 text-ink">
                  Acceso:{" "}
                  {selectedUser.authProvider === "google"
                    ? "Google"
                    : "Correo y contraseña"}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span className="min-w-0 text-ink">
                  Creada el {formatDate(selectedUser.createdAt)}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span className="min-w-0 text-ink">
                  Último acceso: {formatDate(selectedUser.lastLoginAt)}
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
