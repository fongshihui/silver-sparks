import { ReactNode } from "react";

export function BottomBarCTA({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-6 border-t border-[var(--border)] bg-[var(--nav-bg)] px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">{children}</div>
    </div>
  );
}

