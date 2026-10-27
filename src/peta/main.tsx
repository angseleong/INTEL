import "../app.css";
import { lazy, Suspense, useState } from "react";
import { createRoot } from "react-dom/client";
import { Peta } from "./Peta";

// The halaman pembuka shows first unless the link says where to look (USERFLOW.md §1.2); a shared link never loads it.
const Beranda = lazy(() => import("../beranda/Beranda").then((m) => ({ default: m.Beranda })));

function App() {
  const [intro, setIntro] = useState(!location.hash);
  const [city, setCity] = useState<"demak" | "semarang" | null>(null);
  return (
    <>
      <Peta intro={intro} city={city} />
      {intro && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-night-sky" />}>
          <Beranda onDone={(c) => { setCity(c); setIntro(false); }} />
        </Suspense>
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
