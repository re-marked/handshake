"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Gift, Laptop, Lock, Share2, Sparkles, WifiOff } from "lucide-react";
import { FAQS } from "@/lib/seo";
import { asset } from "@/lib/asset";

// One icon per FAQ, parallel to FAQS by index.
const FAQ_ICONS = [Share2, Gift, Lock, Laptop, WifiOff, FileText, Sparkles];

/**
 * The FAQ, with a scroll-spy: every icon badge sits gray except the one whose row is nearest the
 * vertical center of the viewport, which lights up rose. As you scroll, the active badge hands off
 * to the next and both cross-fade (transition-colors), so exactly one is ever pink.
 */
export function Faq() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const center = window.innerHeight / 2;
        let best = 0;
        let bestDist = Infinity;
        refs.current.forEach((el, i) => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const dist = Math.abs(rect.top + rect.height / 2 - center);
          if (dist < bestDist) {
            bestDist = dist;
            best = i;
          }
        });
        setActive(best);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="py-20 lg:py-28">
      <h2 className="text-center font-display text-3xl font-semibold sm:text-4xl">
        Questions &amp; answers
      </h2>
      <div className="mt-14 space-y-14 lg:space-y-20">
        {FAQS.map((f, i) => {
          const Icon = FAQ_ICONS[i] ?? Share2;
          const reverse = i % 2 === 1; // odd rows put the Q+A on the right
          const on = active === i;
          return (
            <div
              key={f.q}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className="grid items-center gap-8 lg:grid-cols-2 lg:gap-20"
            >
              <div className={reverse ? "lg:order-2 lg:text-right" : ""}>
                <h3 className="font-display text-xl font-medium text-foreground">{f.q}</h3>
                <p
                  className={`mt-3 max-w-xl leading-relaxed text-muted-foreground ${
                    reverse ? "lg:ml-auto" : ""
                  }`}
                >
                  {f.a}
                </p>
              </div>
              <div className={`flex justify-center ${reverse ? "lg:order-1" : ""}`}>
                <Icon
                  className={`size-12 transition-colors duration-500 ease-out ${
                    on ? "text-primary" : "text-muted-foreground/40"
                  }`}
                  aria-hidden
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-14 text-center">
        <a
          href={asset("/faq")}
          className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          More questions? Read the full FAQ →
        </a>
      </p>
    </section>
  );
}
