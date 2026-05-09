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
    "inline-flex items-center justify-center rounded-2xl font-extrabold " +
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-ring)] " +
    "transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

  const sizes =
    size === "xl"
      ? "px-6 py-5 text-xl"
      : "px-5 py-4 text-lg leading-none";

  const variants: Record<NonNullable<Props["variant"]>, string> = {
    primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
    secondary:
      "bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50 " +
      "dark:bg-zinc-900 dark:text-zinc-50 dark:ring-zinc-800 dark:hover:bg-zinc-800",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  };

  return (
    <button
      {...props}
      disabled={disabled}
      className={[base, sizes, variants[variant], className].join(" ")}
    />
  );
}

