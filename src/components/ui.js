import Link from "next/link";
import { ChevronRight } from "lucide-react";

const pillTones = {
  beige: "bg-beige text-ink",
  accent: "bg-accent text-white",
  open: "bg-green-tint text-open",
  amber: "bg-amber-tint text-[#6a4700]",
  dark: "bg-ink text-white",
  red: "bg-accent-tint text-accent",
};

export function Pill({ children, tone = "beige", className = "" }) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${pillTones[tone] || pillTones.beige} ${className}`}
    >
      {children}
    </span>
  );
}

export function ErrorNotice({ error, className = "" }) {
  if (!error) return null;
  return (
    <div
      className={`rounded-[24px] border border-accent/20 bg-accent-tint p-4 text-sm leading-6 text-accent ${className}`}
      role="alert"
    >
      {error.message || "No se pudo completar la solicitud."}
    </div>
  );
}

export function SectionTitle({ title, description, action, href }) {
  return (
    <div className="mb-3 mt-7 flex items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-[24px] leading-tight tracking-[-0.03em] text-ink">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-5 text-muted">{description}</p>
        ) : null}
      </div>
      {action && href ? (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-accent hover:underline"
        >
          {action}
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const variants = {
    primary: "bg-accent text-white hover:bg-[#b33a0d]",
    secondary: "bg-beige text-ink hover:bg-[#ebe0d4]",
    outline: "border border-line bg-white text-ink hover:bg-soft",
    danger: "bg-accent-tint text-accent hover:bg-[#f7d4c8]",
  };
  return (
    <button
      {...props}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  multiline = false,
}) {
  const inputClass =
    "mt-1.5 w-full rounded-2xl border border-line bg-soft px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent/60 focus:bg-white";
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${inputClass} resize-y`}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          className={inputClass}
        />
      )}
    </label>
  );
}

export function StatCard({ label, value, icon: Icon, tone = "accent" }) {
  const tones = {
    accent: "bg-accent-tint text-accent",
    green: "bg-green-tint text-open",
    amber: "bg-amber-tint text-[#6a4700]",
    beige: "bg-beige text-ink",
  };
  return (
    <div className="rounded-[24px] border border-line/70 bg-white/70 p-4 shadow-sm">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tones[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 font-display text-3xl leading-none text-ink">{value}</p>
      <p className="mt-1 text-[11px] text-muted">{label}</p>
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="rounded-[24px] bg-soft p-8 text-center">
      <p className="text-lg font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-5 text-muted">
        {description}
      </p>
    </div>
  );
}

export function Modal({ title, description, children, onClose, size = "default" }) {
  const widthClass = size === "wide" ? "max-w-2xl" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
      <div className={`max-h-[92dvh] w-full ${widthClass} overflow-y-auto rounded-[28px] bg-white p-5 shadow-2xl sm:p-6`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl tracking-[-0.03em] text-ink">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-5 text-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soft text-lg text-muted hover:text-ink"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
