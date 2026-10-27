// Apa yang Bisa Dilakukan (FR-10): Kartu Upaya with the Laju Penurunan measured at each place, and the
// Skenario Lanjut vs Henti numbers, from public/data/upaya.json (pipeline/upaya.py).
import "../app.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { createSea } from "../sea/sea";
import { Footer, Label, Nav, Part, container, dateId, moonButton, n, panel, useMotion } from "../ui";

type Site = { radiusM: number; laju2015_2017: number | null; lajuSemua: number | null; titik: number };
type Upaya = {
  updated: string;
  sites: Record<string, Site>;
  scenario: { haLanjut2050: number; haHenti2050: number; haAlready: number; persenSelamatSampai2050: number };
};

function Card({ label, title, site, children, note, from = "up" }: { label: string; title: string; site?: Site | null; children: ReactNode; note?: string; from?: string }) {
  const measured = site && site.laju2015_2017 !== null && site.lajuSemua !== null;
  return (
    <article data-motion={from} className={`${panel} flex flex-wrap overflow-hidden`}>
      <div className="prose-intel flex flex-[3_1_420px] flex-col gap-3 p-8">
        <Label className="normal-case tracking-normal text-haze">{label}</Label>
        <h2 className="m-0 text-[26px] leading-[1.2] font-normal tracking-[-0.02em]">{title}</h2>
        <p>{children}</p>
        {note && <p className="caption border-t border-hairline pt-3">{note}</p>}
      </div>
      {site !== undefined && (
        <div className="flex flex-[2_1_300px] flex-col justify-center gap-2.5 border-l border-hairline bg-[rgb(243_234_210/0.04)] p-8">
          {measured ? (
            <>
              <Label>Diukur satelit dalam {n(site.radiusM)} m</Label>
              <span className="text-[56px] leading-none font-light tracking-[-0.045em] text-gold">{n(site.lajuSemua!)} <span className="text-lg tracking-normal text-mist">cm/tahun</span></span>
              <p className="m-0 text-[13px] leading-relaxed font-light text-mist">Laju Penurunan rata-rata Okt 2014 – Okt 2026, dari {n(site.titik)} titik terukur. Tahun 2015–2017 saja: {n(site.laju2015_2017!)} cm/tahun. Tanah di sini tetap turun.</p>
            </>
          ) : (
            <p className="caption">{site === null ? "Memuat…" : "Dampak ke penurunan tanah belum bisa diukur: titik terukur di sini terlalu sedikit."}</p>
          )}
        </div>
      )}
    </article>
  );
}

function Upaya() {
  const [u, setU] = useState<Upaya | null>(null);
  const sea = useRef<HTMLCanvasElement>(null);
  useEffect(() => { fetch("/data/upaya.json").then((r) => r.json()).then(setU).catch(() => {}); }, []);
  useEffect(() => { const s = createSea(sea.current!, { animate: false, horizon: 0.02 }); return () => s?.destroy(); }, []);
  useMotion([!!u]);
  const site = (k: string) => (u ? u.sites[k] ?? undefined : null);
  const sc = u?.scenario;

  return (
    <div className="min-h-svh bg-night text-foam">
      <Nav current="/upaya.html" />
      <main className="pt-36">
        <Part h1 label="Apa yang bisa dilakukan" title="Yang sudah dicoba">
          <p>Tanggul dan pompa menahan air laut. Mangrove menahan ombak dan lumpur. Yang bisa memperlambat tanah turun adalah mengurangi pengambilan air tanah, salah satu penyebab utamanya. Setiap kartu di bawah menulis apa yang dilakukan, oleh siapa, kata sumbernya, dan apa yang diukur satelit di tempat itu.</p>
          <p className="caption">Angka Laju Penurunan dari Sentinel-1, hanya titik yang benar-benar terukur. Angka ini tidak menunjukkan apakah kawasan di belakang Tanggul kering atau tergenang. Diperbarui {u ? dateId(u.updated) : "–"}.</p>
        </Part>

        <div className={`${container} flex flex-col gap-4 pb-24`}>
          <Card label="2022–2024 · Kementerian PUPR (BBWS Pemali Juana)" title="Tanggul laut Tambak Lorok, Semarang Utara" site={site("tambaklorok")} from="left">
            Tanggul laut di depan kampung nelayan Tambak Lorok. Menurut Menteri PUPR, panjangnya 3,6 km dan melindungi kawasan sekitar 56 ha, ditargetkan rampung Agustus 2024 (<a href="https://ekonomi.bisnis.com/read/20240618/45/1774832/tanggul-tambak-lorok-kementerian-pupr-targetkan-rampung-agustus">Bisnis, Juni 2024</a>). Kami belum menemukan laporan serah terima resminya.
          </Card>
          <Card label="Selesai 2016 · Pemkot Semarang, kerja sama Indonesia–Belanda" title="Polder Banger, Semarang Timur" site={site("banger")} from="right">
            Kawasan 530 ha di 10 kelurahan dikelilingi tanggul, lalu air di dalamnya dipompa keluar lewat lima rumah pompa (<a href="https://www.thejakartapost.com/news/2013/12/12/semarang-build-polder-tackle-floods.html">The Jakarta Post, 2013</a>). Tahun 2017 Menteri PUPR menyebut kawasan pelabuhan sampai Semarang Tengah "relatif tertangani" (<a href="https://rmol.id/advertorial/read/2017/06/18/296103/antisipasi-gangguan-jalur-mudik-kementerian-pupr-atasi-banjir-rob-di-semarang">RMOL, Juni 2017</a>).
          </Card>
          <Card label="2015–2021 · Wetlands International, Ecoshape, warga" title="Pagar penangkap lumpur dan mangrove, Timbulsloko" site={site("timbulsloko")} from="left">
            Sekitar 1.600 m pagar bambu tembus air dibangun warga 2017–2018. Pagar meredam ombak dan menahan lumpur, supaya mangrove bisa tumbuh lagi. Pelaksana melaporkan endapan lebih dari 20 cm di tahun pertama dan ombak yang lebih kecil di dalam pagar (<a href="https://www.ecoshape.org/en/cases/rehabilitation-of-a-mangrove-mud-coast-in-timbul-sloko-java-indonesia/">Ecoshape</a>). Ini laporan pelaksana, bukan evaluasi independen.
          </Card>
          <div className="flex flex-wrap gap-4">
            <div className="flex-[1_1_420px]">
              <Card label="2023–2027 · Kementerian PU" title="Tol Tanggul Laut Semarang–Demak" from="left"
                note="Dampak ke penurunan tanah belum bisa diukur: Seksi 1 belum selesai. Tanggul tidak menghentikan tanah turun.">
                Jalan tol yang sekaligus jadi tanggul laut. Seksi 2 (Sayung–Demak) beroperasi sejak Februari 2023. Seksi 1 (Kaligawe–Sayung, 10,64 km) yang berada di pantai masih dibangun, ditargetkan beroperasi April 2027 (<a href="https://finance.detik.com/infrastruktur/d-8236187/konstruksi-tol-semarang-demak-seksi-1-tembus-58-ditargetkan-beroperasi-2027">detik, November 2025</a>). Maret 2026 Menteri PU menyebut tanggulnya belum optimal menahan rob dan akan diperbesar (<a href="https://ekonomi.bisnis.com/read/20260302/45/1956816/tanggul-laut-tol-semarang-demak-belum-optimal-tahan-rob-menteri-pu-bilang-begini">Bisnis, Maret 2026</a>).
              </Card>
            </div>
            <div className="flex-[1_1_420px]">
              <Card label="2023 · Pemkot Semarang" title="Pembatasan air tanah di Kota Semarang" from="right"
                note="Dampak ke penurunan tanah belum bisa diukur: aturannya baru berlaku 2023, dan laju per tahun dari satelit baru tersedia setelah deret waktu Masa Terukur masuk ke INTEL.">
                Peraturan Wali Kota Semarang Nomor 23 Tahun 2023 tentang Zonasi Bebas Air Tanah membatasi pengambilan air tanah di zona kritis, termasuk Semarang Utara. Kajian Universitas Diponegoro menyebut dampaknya ke penurunan tanah belum bisa disimpulkan dan butuh pemantauan jangka panjang (<a href="https://ejournal3.undip.ac.id/index.php/jpgs/article/view/60206">Undip</a>).
              </Card>
            </div>
          </div>
        </div>

        <section data-motion="up" className={`${container} pb-24`}>
          <div className="relative flex flex-wrap items-center gap-10 overflow-hidden rounded-[36px] border border-[rgb(243_234_210/0.16)] bg-[#0a1822] p-[clamp(28px,5vw,64px)]">
            {/* Laut WebGL, still (DESIGN.md "Laut WebGL"): a strip of night sea under the scenario */}
            <canvas ref={sea} aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[45%] w-full [mask-image:linear-gradient(transparent,black_40%)]" />
            <div className="prose-intel relative flex flex-[1_1_420px] flex-col gap-3.5">
              <Label>Yang masih bisa dilakukan</Label>
              <h2 className="m-0 text-[clamp(34px,4vw,56px)] leading-[1.02] font-light tracking-[-0.04em]">Berhenti menyedot air tanah</h2>
              <p>Skenario Henti menganggap pengambilan air tanah dihentikan mulai 2027, dan tanah berhenti turun dalam 10 tahun, seperti yang terjadi di Tokyo. Ini skenario optimis: Bangkok mengatur air tanah sejak 1977 dan tanahnya sampai sekarang masih turun, walau jauh lebih pelan. Aturannya baru efektif setelah ada air PAM pengganti.</p>
              <a href="/#-6.93,110.47,11,2050,stop" className={`${moonButton} self-start`}>Lihat Skenario Henti di peta</a>
            </div>
            {sc && (
              <div className="relative flex flex-[1_1_340px] flex-col gap-3">
                <span className="text-[clamp(88px,11vw,150px)] leading-[0.85] font-light tracking-[-0.06em] text-gold">{sc.persenSelamatSampai2050}%</span>
                <p className="m-0 text-sm leading-relaxed font-light text-mist">dari daratan yang di Skenario Lanjut akan turun di bawah Pasang Tertinggi antara 2027 dan 2050, tetap di atasnya sampai lewat 2050 di Skenario Henti.</p>
                <p className="m-0 text-xs leading-normal font-light text-haze">Luas daratan di bawah Pasang Tertinggi pada 2050: {n(sc.haLanjut2050)} ha (Lanjut) atau {n(sc.haHenti2050)} ha (Henti). Sekarang sudah {n(sc.haAlready)} ha. Semua di Wilayah Cakupan, tanpa menghitung Tanggul dan pompa.</p>
              </div>
            )}
          </div>
        </section>

        <Part title="Mangrove dan Tanggul">
          <p><b>Mangrove</b> meredam ombak dan menahan lumpur di garis pantai. <b>Tanggul</b> menahan laut masuk ke darat. Keduanya bisa memberi waktu, tapi tidak menghentikan tanah turun. Tanggul sendiri ikut turun bersama tanah di bawahnya, jadi harus terus ditinggikan, dan air hujan di belakangnya harus dipompa keluar.</p>
          <p>Di peta, Tanggul hanya ditampilkan sebagai garis informasi. INTEL tidak menghitung apa yang ditahannya.</p>
        </Part>
      </main>
      <Footer />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Upaya />);
