// Kartu titik (docs/USERFLOW.md §2, docs/DESIGN.md Components).
import type { ReactNode } from "react";
import { num, type CardInfo, type Facts } from "../pointCard";

export const Label = ({ children }: { children: ReactNode }) => (
  <p className="m-0 text-[11px] uppercase tracking-[0.14em] text-tidewrack">{children}</p>
);

function Place({ place }: { place: string[] | undefined }) {
  if (!place) return null;
  const [, name, kecamatan, kota] = place;
  return (
    <div>
      <p className="m-0 text-[26px] leading-tight font-medium tracking-[-0.03em]">{name}</p>
      <p className="m-0 text-[13px] font-light text-haze">Kec. {kecamatan}, {kota}</p>
    </div>
  );
}

function FactRows({ facts }: { facts: Facts }) {
  const { year, elevation, rate, rateStd, filled } = facts;
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5 rounded-[20px] bg-[rgb(200_225_235/0.04)] p-4">
          <span className="text-[11px] font-light text-haze">Tinggi Tanah {year}</span>
          <span className="text-[26px] leading-none font-light tracking-[-0.03em]">±{num(Math.abs(elevation), 2)} m</span>
          <span className="text-[11px] font-light text-driftwood">{elevation < 0 ? "di bawah" : "di atas"} muka laut</span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-[20px] bg-[rgb(200_225_235/0.04)] p-4">
          <span className="text-[11px] font-light text-haze">Laju Penurunan</span>
          <span className="text-[26px] leading-none font-light tracking-[-0.03em]">{num(rate, 1)}</span>
          <span className="text-[11px] font-light text-driftwood">± {num(rateStd, 1)} cm per tahun</span>
        </div>
      </div>
      {filled && <p className="m-0 text-xs font-light text-haze">Laju diperkirakan dari titik terukur dalam ±1 km, bukan diukur langsung di titik ini.</p>}
    </>
  );
}

export function PointCard({ info, place }: { info: CardInfo | null; place: string[] | undefined }) {
  if (!info) {
    return (
      <div className="flex flex-col gap-2">
        <Label>Ketuk peta</Label>
        <p className="m-0 text-[15px] font-light text-mist">Ketuk satu titik di pesisir Demak–Semarang untuk melihat kapan tanahnya di bawah Pasang Tertinggi.</p>
      </div>
    );
  }
  if (info.kind === "outside" || info.kind === "nodata") {
    return (
      <div className="flex flex-col gap-2">
        <Label>{info.kind === "outside" ? "Di luar Wilayah Cakupan" : "Belum ada data"}</Label>
        <p className="m-0 text-[15px] font-light text-mist">
          {info.kind === "outside"
            ? "Wilayah ini belum dihitung. Saat ini: Demak dan Semarang."
            : "Data penurunan tanah belum tersedia di titik ini. Satelit radar sulit mengukur sawah, tambak, dan air."}
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <Place place={place} />
      {info.kind === "already" ? (
        <div className="flex flex-col gap-2 rounded-3xl border border-hairline bg-[rgb(14_28_38/0.7)] p-5">
          <Label>Sudah di bawah Pasang Tertinggi</Label>
          <p className="m-0 text-sm font-light text-mist">Tanah di sini sudah lebih rendah dari pasang tertinggi. Tergenang atau tidak sekarang bergantung pada Tanggul, pompa, dan urugan, yang tidak bisa dilihat satelit.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-3xl border border-hairline bg-[rgb(14_28_38/0.7)] p-5">
          <Label>Mulai kena Rob sesekali</Label>
          <span className="text-[44px] wide:text-[52px] leading-none font-light tracking-[-0.045em] text-gold">{info.rob}</span>
          <span className="text-[13px] font-light text-mist">Di bawah pasang harian: <b className="font-normal text-foam">{info.daily}</b></span>
        </div>
      )}
      <FactRows facts={info.facts} />
    </div>
  );
}
