import { cn } from "@/frontend/utils/cn";

/** Centered page-width wrapper with responsive side padding (public pages). */
export default function Container({ className, children }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}
