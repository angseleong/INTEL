// Shared by the text pages: styles and A9 (each part fades in as it scrolls into view).
import "./page.css";

const io = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { rootMargin: "0px 0px -10% 0px" });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

export const dateId = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
