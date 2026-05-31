import { Camera, User } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A clickable photo slot — shows the photo (or a silhouette) with a small camera badge so it's
 * always obviously settable, plus a hover overlay. Used in the person note and the new-card flow.
 */
export function PhotoUpload({
  src,
  onClick,
  className,
  round = "full",
  label = "Set photo",
}: {
  src?: string;
  onClick: () => void;
  className?: string;
  round?: "full" | "md";
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "group/photo relative grid shrink-0 place-items-center overflow-hidden bg-muted text-muted-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring/60",
        round === "full" ? "rounded-full" : "rounded-md",
        className,
      )}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" draggable={false} />
      ) : (
        <User className="size-1/2 text-muted-foreground/50" strokeWidth={1.75} />
      )}
      {/* hover dim + camera, so changing is obvious */}
      <span className="absolute inset-0 grid place-items-center bg-foreground/35 opacity-0 transition group-hover/photo:opacity-100">
        <Camera className="size-2/5 max-h-6 max-w-6 text-white" strokeWidth={2} />
      </span>
      {/* always-on badge: this is a photo slot */}
      <span
        className={cn(
          "absolute bottom-0 right-0 grid size-2/5 max-h-[18px] max-w-[18px] place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-card transition group-hover/photo:opacity-0",
          round === "md" && "bottom-0.5 right-0.5",
        )}
      >
        <Camera className="size-1/2" strokeWidth={2.25} />
      </span>
    </button>
  );
}
