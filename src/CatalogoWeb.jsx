// src/CatalogoWeb.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";

const BRAND = {
  name: "La Tiendita de Cris",
  url: "https://la-tiendita-de-cris.odoo.com/shop",
  whatsapp: "51988694721",
  facebook: "https://www.facebook.com/profile.php?id=61554922563828", // ✅ tu página
  instagram: "https://www.instagram.com/latienditadecris2023",
  tiktok: "https://www.tiktok.com/@la.tiendita.de.cr2",
};

function formatPrice(n) {
  try { return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n || 0); }
  catch { return `S/ ${(n || 0).toFixed(2)}`; }
}

export default function CatalogoWeb() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("Todos");
  const ref = useRef(null);

// ejemplo simple: carga por categoría y búsqueda
useEffect(() => {
  const params = new URLSearchParams();
  params.set("limit", "60");
  if (cat !== "Todos") params.set("categ", cat);
  if (query.trim())    params.set("q", query.trim());

  fetch(`/api/products?${params.toString()}`)
    .then(r => r.json())
    .then(data => setProducts(data.items || []))
    .catch(() => setProducts([]));
}, [cat, query]);



  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(products.map(p => p.categ || "Otros")))],
    [products]
  );

  const filtered = useMemo(
    () => products.filter(p =>
      (cat === "Todos" || p.categ === cat) &&
      (p.name || "").toLowerCase().includes(query.toLowerCase())
    ),
    [products, cat, query]
  );

  const printPDF = () => window.print();

  // const exportPNGtoPDF = async () => {
    // const node = ref.current; if (!node) return;
    // const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#eef3f8", useCORS: true });
    // const pdf = new jsPDF("p", "mm", "a4");
    // const pw = pdf.internal.pageSize.getWidth();
    // const ph = pdf.internal.pageSize.getHeight();
    // const imgW = pw;
    // const imgH = canvas.height * (pw / canvas.width);
    // let y = 0;
    // while (y < imgH) {
      // if (y > 0) pdf.addPage();
      // pdf.addImage(canvas, "PNG", 0, -y * (canvas.width / pw), imgW, imgH);
      // y += ph;
    // }
    // pdf.save("catalogo-tiendita.pdf");
  // };

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      {/* barra roja de prueba (borra si ya ves Tailwind OK) */}
      {/* <div className="h-2 bg-red-500"></div> */}

      {/* Botones flotantes */}
      <div className="no-print fixed right-4 top-4 z-50 flex flex-col gap-2">
        <button onClick={printPDF} className="bg-[var(--cris-deep)] text-white px-4 py-2 rounded-xl shadow hover:opacity-95">Imprimir PDF</button>
      </div>

      {/* Contenido centrado */}
      <main ref={ref} className="page-wrap px-4 md:px-6 lg:px-8 py-6">
        {/* Hero */}
        <section className="rounded-3xl p-8 shadow-xl text-white" style={{background:"linear-gradient(90deg,#0D47A1,#1976D2,#1EC8E3)"}}>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">La Tiendita de Cris</h1>
          <p className="mt-2 text-white/95">Productos prácticos y divertidos. Compra por WhatsApp.</p>
          <a href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent("Hola, vengo del catálogo web 😊")}`} target="_blank" rel="noreferrer"
             className="inline-block mt-5 bg-white text-slate-900 font-semibold px-5 py-2 rounded-2xl shadow hover:shadow-md">
            Comprar por WhatsApp
          </a>
        </section>

        {/* Filtros */}
        <section className="mt-6 grid gap-3 md:grid-cols-3">
          <input className="border rounded-xl px-4 py-2 outline-none focus:ring-2 ring-[#1976D2] bg-white shadow-sm"
                 placeholder="Buscar productos…" value={query} onChange={(e)=>setQuery(e.target.value)} />
          <select className="border rounded-xl px-4 py-2 bg-white shadow-sm"
                  value={cat} onChange={(e)=>setCat(e.target.value)}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <a className="border rounded-xl px-4 py-2 text-center bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
             href={BRAND.url} target="_blank" rel="noreferrer">
            Ver tienda completa
          </a>
        </section>

        {/* Cabecera de categoría */}
        <section className="mt-6 rounded-2xl p-4 text-white shadow" style={{background:"linear-gradient(90deg,#2f3a4a,#485567)"}}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">{cat === "Todos" ? "Todos los productos" : cat}</h2>
            <div className="text-sm opacity-95">{filtered.length} productos</div>
          </div>
        </section>

        {/* Grid de productos */}
        <section className="mt-4 grid-cards">
          {filtered.map(p => (
            <article key={p.id} className="product-card rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow">
              <div className="aspect-[4/3] bg-slate-100">
                {p.image
                  ? <img src={p.image} alt={p.name} className="w-full h-full object-cover object-center" loading="lazy" decoding="async" />
                  : <div className="w-full h-full flex items-center justify-center text-slate-400">Sin imagen</div>}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-800 tracking-tight line-clamp-2 min-h-[44px]">{p.name}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-lg font-extrabold text-slate-900">{formatPrice(p.list_price)}</div>
                  <a href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent("Hola, me interesa: " + (p.name || ""))}`}
                     target="_blank" rel="noreferrer"
                     className="text-sm font-semibold bg-[var(--cris-amber)] text-slate-900 px-3 py-1.5 rounded-lg hover:brightness-105">
                    Comprar
                  </a>
                </div>
                <p className="mt-1 text-xs text-slate-500">Envíos a todo el Perú</p>
              </div>
            </article>
          ))}
        </section>
{/* Espaciador/salto para impresión: fuerza footer en nueva página */}
<div className="print-break"></div>

<footer className="print-footer mt-12 rounded-3xl bg-slate-900 text-white p-6 shadow">
  <div className="grid md:grid-cols-3 gap-6">
    <div className="print-keep">
      <div className="text-lg font-semibold">La Tiendita de Cris</div>
      <div className="text-sm text-white/80 mt-2">Atención por WhatsApp · Envíos a todo el Perú</div>
    </div>
    <div className="print-keep">
      <div className="text-lg font-semibold">Contáctanos</div>
      <div className="mt-2 text-sm">
        <a className="hover:underline" href="https://wa.me/51988694721" target="_blank" rel="noreferrer">
          +51 988 694 721
        </a>
      </div>
    </div>
<div className="print-keep">
  <div className="text-lg font-semibold">Síguenos</div>
  <div className="mt-2 flex gap-3 text-sm">
    <a className="hover:underline" href={BRAND.facebook} target="_blank" rel="noreferrer">Facebook</a>
    <a className="hover:underline" href={BRAND.instagram} target="_blank" rel="noreferrer">Instagram</a>
    <a className="hover:underline" href={BRAND.tiktok} target="_blank" rel="noreferrer">TikTok</a>
  </div>
</div>
  </div>
  <div className="text-xs text-white/70 mt-4 print-keep">© {new Date().getFullYear()} La Tiendita de Cris</div>
</footer>
      </main>
    </div>
  );
}