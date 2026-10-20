// Apa yang Bisa Dilakukan (FR-10): fills each Kartu Upaya with the Laju Penurunan measured there, and the
// Skenario Lanjut vs Henti numbers, from public/data/upaya.json (pipeline/upaya.py).
import { dateId } from "./page";

type Site = { radiusM: number; laju2015_2017: number | null; lajuSemua: number | null; titik: number };
type Upaya = {
  updated: string;
  sites: Record<string, Site>;
  scenario: { haLanjut2050: number; haHenti2050: number; haAlready: number; persenSelamatSampai2050: number };
};

const n = (x: number) => x.toLocaleString("id-ID");

fetch("/data/upaya.json").then((r) => r.json()).then((u: Upaya) => {
  document.getElementById("updated")!.textContent = dateId(u.updated);
  document.querySelectorAll<HTMLElement>("[data-site]").forEach((card) => {
    const s = u.sites[card.dataset.site!];
    const out = card.querySelector(".measured")!;
    out.innerHTML = s && s.laju2015_2017 !== null && s.lajuSemua !== null
      ? `<p class="label">Diukur satelit dalam ${n(s.radiusM)} m</p>
        <p class="big">${n(s.lajuSemua)} cm/tahun</p>
        <p>Laju Penurunan rata-rata Okt 2014 – Okt 2026, dari ${n(s.titik)} titik terukur. Tahun 2015–2017 saja: ${n(s.laju2015_2017)} cm/tahun. Tanah di sini tetap turun.</p>`
      : `<p class="caption">Dampak ke penurunan tanah belum bisa diukur: titik terukur di sini terlalu sedikit.</p>`;
  });
  const sc = u.scenario;
  document.getElementById("scenario")!.insertAdjacentHTML("afterbegin", `
    <p class="big">${sc.persenSelamatSampai2050}%</p>
    <p>dari daratan yang di Skenario Lanjut akan turun di bawah Pasang Tertinggi antara 2027 dan 2050, tetap di atasnya sampai lewat 2050 di Skenario Henti.
    Luas daratan di bawah Pasang Tertinggi pada 2050: <b>${n(sc.haLanjut2050)} ha</b> (Lanjut) atau <b>${n(sc.haHenti2050)} ha</b> (Henti).
    Sekarang sudah ${n(sc.haAlready)} ha. Semua di Wilayah Cakupan, tanpa menghitung Tanggul dan pompa.</p>`);
});
