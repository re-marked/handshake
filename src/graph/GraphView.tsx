import { useEffect, useRef } from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
} from "d3-force";
import type { Strength, Switchboard } from "@/switchboard";
import { toGraphModel, type GraphLink, type GraphNode } from "@/graph/model";

const NODE_R = 7;
const SELF_R = 11;

interface Palette {
  fg: string;
  muted: string;
  border: string;
  primary: string;
}

function readPalette(el: HTMLElement): Palette {
  const s = getComputedStyle(el);
  const read = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
  return {
    fg: read("--foreground", "oklch(0.92 0 0)"),
    muted: read("--muted-foreground", "oklch(0.66 0 0)"),
    border: read("--border", "oklch(0.3 0 0)"),
    primary: read("--primary", "oklch(0.62 0.16 350)"),
  };
}

function strengthStyle(strength: Strength): { width: number; alpha: number; dash: number[] } {
  switch (strength) {
    case "close": return { width: 1.8, alpha: 0.85, dash: [] };
    case "warm": return { width: 1.3, alpha: 0.65, dash: [] };
    case "cold": return { width: 1, alpha: 0.45, dash: [] };
    case "dormant": return { width: 1, alpha: 0.3, dash: [4, 4] };
  }
}

/**
 * The connections graph — the hero view. A clean 2D force-directed graph drawn to a
 * canvas: people are nodes (opacity = recency), handshakes are edges (weight = warmth),
 * you are ringed in the rose accent. Pan, zoom, drag, hover, select. No WebGL.
 */
export function GraphView({ switchboard }: { switchboard: Switchboard }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const palette = readPalette(canvas);
    const { nodes, links } = toGraphModel(switchboard, new Date());

    // View transform (world -> screen): screen = world * k + (tx, ty).
    let k = 1;
    let tx = 0;
    let ty = 0;
    let dpr = 1;

    function resize() {
      dpr = window.devicePixelRatio || 1;
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      canvas!.width = Math.max(1, Math.floor(w * dpr));
      canvas!.height = Math.max(1, Math.floor(h * dpr));
      if (tx === 0 && ty === 0 && w > 0) {
        tx = w / 2; // center the world origin on first real layout
        ty = h / 2;
      }
      draw();
    }

    const sim: Simulation<GraphNode, GraphLink> = forceSimulation<GraphNode, GraphLink>(nodes)
      .force("charge", forceManyBody().strength(-260))
      .force(
        "link",
        forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(90)
          .strength(0.5),
      )
      .force("center", forceCenter(0, 0))
      .force("collide", forceCollide(NODE_R * 2.4))
      .on("tick", draw);

    let hover: GraphNode | null = null;
    let selected: GraphNode | null = null;

    function toWorld(sx: number, sy: number) {
      return { x: (sx - tx) / k, y: (sy - ty) / k };
    }

    function nodeAt(sx: number, sy: number): GraphNode | null {
      const p = toWorld(sx, sy);
      let best: GraphNode | null = null;
      let bestDist = Infinity;
      for (const n of nodes) {
        if (n.x == null || n.y == null) continue;
        const hitR = (n.isSelf ? SELF_R : NODE_R) + 4;
        const dx = n.x - p.x;
        const dy = n.y - p.y;
        const dist = dx * dx + dy * dy;
        if (dist < hitR * hitR && dist < bestDist) {
          best = n;
          bestDist = dist;
        }
      }
      return best;
    }

    function draw() {
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      ctx!.save();
      ctx!.scale(dpr, dpr);
      ctx!.clearRect(0, 0, w, h);
      ctx!.translate(tx, ty);
      ctx!.scale(k, k);

      for (const l of links) {
        const s = l.source as GraphNode;
        const t = l.target as GraphNode;
        if (s.x == null || t.x == null) continue;
        const st = strengthStyle(l.strength);
        ctx!.beginPath();
        ctx!.moveTo(s.x, s.y!);
        ctx!.lineTo(t.x!, t.y!);
        ctx!.lineWidth = st.width / k;
        ctx!.strokeStyle = palette.border;
        ctx!.globalAlpha = st.alpha;
        ctx!.setLineDash(st.dash.map((d) => d / k));
        ctx!.stroke();
      }
      ctx!.setLineDash([]);
      ctx!.globalAlpha = 1;

      for (const n of nodes) {
        if (n.x == null || n.y == null) continue;
        const r = n.isSelf ? SELF_R : NODE_R;
        const active = n === hover || n === selected;

        ctx!.globalAlpha = n.freshness;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx!.fillStyle = palette.fg;
        ctx!.fill();
        ctx!.globalAlpha = 1;

        if (n.isSelf || active) {
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, r + 3 / k + 1, 0, Math.PI * 2);
          ctx!.lineWidth = 2 / k;
          ctx!.strokeStyle = n.isSelf ? palette.primary : palette.muted;
          ctx!.stroke();
        }

        ctx!.globalAlpha = Math.max(0.55, n.freshness);
        ctx!.fillStyle = palette.fg;
        ctx!.font = `${12 / k}px ui-sans-serif, system-ui, sans-serif`;
        ctx!.textAlign = "center";
        ctx!.textBaseline = "top";
        ctx!.fillText(n.label, n.x, n.y + r + 4 / k);
        ctx!.globalAlpha = 1;
      }

      ctx!.restore();
    }

    let dragging: GraphNode | null = null;
    let panning = false;
    let lastX = 0;
    let lastY = 0;

    function onPointerDown(e: PointerEvent) {
      canvas!.setPointerCapture(e.pointerId);
      lastX = e.offsetX;
      lastY = e.offsetY;
      const hit = nodeAt(e.offsetX, e.offsetY);
      if (hit) {
        dragging = hit;
        selected = hit;
        sim.alphaTarget(0.3).restart();
      } else {
        panning = true;
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (dragging) {
        const p = toWorld(e.offsetX, e.offsetY);
        dragging.fx = p.x;
        dragging.fy = p.y;
      } else if (panning) {
        tx += e.offsetX - lastX;
        ty += e.offsetY - lastY;
        lastX = e.offsetX;
        lastY = e.offsetY;
        draw();
      } else {
        const next = nodeAt(e.offsetX, e.offsetY);
        if (next !== hover) {
          hover = next;
          canvas!.style.cursor = next ? "pointer" : "grab";
          draw();
        }
      }
    }

    function onPointerUp(e: PointerEvent) {
      if (dragging) {
        dragging.fx = null;
        dragging.fy = null;
        dragging = null;
        sim.alphaTarget(0);
      }
      panning = false;
      canvas!.releasePointerCapture(e.pointerId);
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015);
      const nextK = Math.min(4, Math.max(0.2, k * factor));
      const wx = (e.offsetX - tx) / k;
      const wy = (e.offsetY - ty) / k;
      k = nextK;
      tx = e.offsetX - wx * k;
      ty = e.offsetY - wy * k;
      draw();
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      sim.stop();
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [switchboard]);

  return <canvas ref={canvasRef} className="block h-full w-full" />;
}
