import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * The app's logo. Sourced from {@link BRAND} – change it there (or swap the file in
 * `public/`) and every instance updates at once. Size/shape via `className`.
 */
export function Logo({ className, alt = BRAND.name }: { className?: string; alt?: string }) {
  return (
    <img
      src={BRAND.logo}
      alt={alt}
      draggable={false}
      className={cn("object-contain select-none", className)}
    />
  );
}
