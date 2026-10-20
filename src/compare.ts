// Geser bandingkan (FR-3): a second map on top of the main one, clipped to the right of a draggable divider.
// It follows the main map, which keeps all the touch input; only the divider is draggable.
import * as maplibregl from "maplibre-gl";

export function compareMap(main: maplibregl.Map, options: maplibregl.MapOptions, el: HTMLElement, divider: HTMLElement) {
  const right = new maplibregl.Map({ ...options, container: el, interactive: false, attributionControl: false });
  const sync = () => right.jumpTo({ center: main.getCenter(), zoom: main.getZoom(), bearing: main.getBearing(), pitch: main.getPitch() });
  main.on("move", () => { if (!el.hidden) sync(); });

  const place = (px: number) => {
    const x = Math.min(Math.max(px, 0), innerWidth);
    el.style.clipPath = `inset(0 0 0 ${x}px)`;
    divider.style.transform = `translateX(${x}px)`;
    divider.setAttribute("aria-valuenow", String(Math.round((x / innerWidth) * 100)));
  };
  let x = 0;
  divider.addEventListener("pointerdown", (e) => divider.setPointerCapture(e.pointerId));
  divider.addEventListener("pointermove", (e) => { if (divider.hasPointerCapture(e.pointerId)) place((x = e.clientX)); });
  divider.addEventListener("keydown", (e) => {
    const step = { ArrowLeft: -24, ArrowRight: 24 }[e.key];
    if (step) place((x += step));
  });

  return {
    map: right,
    open(at: number) {
      el.hidden = divider.hidden = false;
      right.resize();
      sync();
      place((x = at));
    },
    close() { el.hidden = divider.hidden = true; },
  };
}
