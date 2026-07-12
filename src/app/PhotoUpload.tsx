import { Camera, User } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A clickable photo slot – shows the photo (or a silhouette), with a camera overlay on hover so
 * it reads as settable. Used in the person note (alongside an explicit button) and the new-card flow.
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
      <span className="absolute inset-0 grid place-items-center bg-foreground/30 opacity-0 transition group-hover/photo:opacity-100">
        <Camera className="size-2/5 max-h-6 max-w-6 text-white" strokeWidth={2} />
      </span>
    </button>
  );
}
