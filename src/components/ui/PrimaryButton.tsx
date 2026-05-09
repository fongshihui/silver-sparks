import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  size?: "lg" | "xl";
};

export function PrimaryButton({
  className = "",
  variant = "primary",
  size = "lg",
  disabled,
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-bold " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] " +
    "transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed";

  const sizes =
    size === "xl"
      ? "px-7 py-4 text-lg"
      : "px-5 py-3 text-base leading-none";

  const variants: Record<NonNullable<Props["variant"]>, string> = {
    primary:
      "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-sm hover:shadow-md",
    secondary:
      "bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] " +
      "hover:bg-[var(--surface-hover)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
    danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
  };

  return (
    <button
      {...props}
      disabled={disabled}
      className={[base, sizes, variants[variant], className].join(" ")}
    />
  );
}

