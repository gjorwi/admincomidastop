"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  LayoutDashboard,
  LogOut,
  Settings2,
  Store,
  Trophy,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";

const navigation = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/solicitudes", label: "Solicitudes", icon: Inbox },
  { href: "/negocios", label: "Negocios", icon: Store },
  { href: "/usuarios", label: "Usuarios", icon: Users },
  { href: "/rankings", label: "Rankings", icon: Trophy },
];

function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function AppShell({ children }) {
  const pathname = usePathname();
  const { user, ready, logout } = useAuth();

  if (pathname === "/login") {
    return <main className="min-h-dvh">{children}</main>;
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-soft text-sm text-muted">
        Cargando administración…
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-soft px-4">
        <div className="w-full max-w-md rounded-[28px] border border-line bg-white p-7 text-center shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            Administración general
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-[-0.04em] text-ink">
            Acceso restringido
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Inicia sesión con una cuenta administradora para continuar.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-white"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <Link
            href="/"
            aria-label="comidasTop Admin, ir al inicio"
            className="flex shrink-0 items-center gap-2 font-display text-[24px] leading-none tracking-[-0.055em] sm:gap-2.5 sm:text-[26px]"
          >
            <Image
              src="/logo.jpg"
              alt=""
              width={40}
              height={40}
              priority
              className="h-8 w-8 shrink-0 rounded-full object-contain sm:h-10 sm:w-10"
            />
            <span>
              <span className="text-ink">comidas</span>
              <span className="text-accent">Top</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Admin
            </span>
          </Link>

          <nav
            aria-label="Navegación de administración"
            className="hidden items-center gap-1 lg:flex"
          >
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                    active
                      ? "bg-accent text-white"
                      : "text-muted hover:bg-beige hover:text-ink"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
            <Link
              href="/configuracion"
              className={`flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                isActive(pathname, "/configuracion")
                  ? "bg-accent text-white"
                  : "text-muted hover:bg-beige hover:text-ink"
              }`}
            >
              <Settings2 className="h-[18px] w-[18px]" aria-hidden="true" />
              Configuración
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden max-w-[180px] truncate text-xs font-medium text-muted sm:block">
              {user.name}
            </span>
            <Link
              href="/configuracion"
              aria-label="Abrir configuración"
              className={`flex h-10 w-10 items-center justify-center rounded-full transition lg:hidden ${
                isActive(pathname, "/configuracion")
                  ? "bg-accent text-white"
                  : "text-muted hover:bg-beige hover:text-ink"
              }`}
            >
              <Settings2 className="h-4 w-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition hover:bg-beige hover:text-ink"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6 md:pb-14">
        {children}
      </main>

      <nav
        aria-label="Navegación inferior de administración"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white px-1 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 lg:hidden"
      >
        <div className="mx-auto flex max-w-xl items-stretch justify-between gap-0.5">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold transition ${
                  active
                    ? "bg-accent text-white"
                    : "text-muted hover:bg-soft hover:text-ink"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
