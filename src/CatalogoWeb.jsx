// src/CatalogoWeb.jsx
import React, { useEffect, useState } from "react";

const BRAND = {
  name: "La Tiendita de Cris",
  url: "https://la-tiendita-de-cris.odoo.com/shop",
  whatsapp: "51988694721",
  facebook: "https://www.facebook.com/profile.php?id=61554922563828",
  instagram: "https://www.instagram.com/latienditadecris2023",
  tiktok: "https://www.tiktok.com/@la.tiendita.de.cr2",
};

export default function CatalogoWeb() {
  const [categories, setCategories] = useState([]); // {id,name,count}
  const [catId, setCatId] = useState(0);            // 0 = Todos
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);

  // Cargar categorías (estáticas, no dependen del filtro actual)
  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then(d => setCategories(d.items || []))
      .catch(() => setCategories([]));
  }, []);

  // Cargar productos por categoría y búsqueda
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("limit", "60");
    if (catId > 0) params.set("categ_id", String(catId));
    if (query.trim()) params.set("q", query.trim());
    fetch(`/api/products?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        setProducts(d.items || []);
        setTotal(d.total || 0);
      })
      .catch(() => {
        setProducts([]);
        setTotal(0);
      });
  }, [catId, query]);

  const currentCatName =
    catId === 0 ? "Todos los productos" : (categories.find(c => c.id === catId)?.name || "Productos");

  return (
    <div className="min-h-screen bg-[#EEF3F8]">
      {/* ---------- HERO / ENCABEZADO ---------- */}
      <header className="max-w-6xl mx-auto px-4 pt-8">
        <div className="rounded-3xl p-10 text-white shadow-lg"
             style={{background:"linear-gradient(90deg,#0D47A1,#00BCD4)"}}>
          <h1 className="text-3xl md:text-4xl font-extrabold drop-shadow-sm">
            La Tiendita de Cris
          </h1>
          <p className="mt-2 text-white/90">
            Productos prácticos y divertidos. Compra por WhatsApp.
          </p>
          <a
            href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent("Hola, quiero ver el catálogo 😊")}`}
            target="_blank" rel="noreferrer"
            className="inline-block mt-5 bg-white text-slate-900 font-semibold px-5 py-2.5 rounded-xl shadow hover:brightness-95"
          >
            Comprar por WhatsApp
          </a>
        </div>
      </header>

      {/* ---------- CONTROLES ---------- */}
      <section className="max-w-6xl mx-auto px-4 mt-5">
        <div className="grid gap-3 md:grid-cols-[1fr_320px_220px]">
          <input
            className="border rounded-xl px-4 py-2 outline-none focus:ring-2 ring-[#1976D2] bg-white shadow-sm"
            placeholder="Buscar productos…"
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
          />
          <select
            className="border rounded-xl px-4 py-2 bg-white shadow-sm"
            value={catId}
            onChange={(e)=>setCatId(parseInt(e.target.value,10))}
          >
            <option value={0}>Todos</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <a
            className="border rounded-xl px-4 py-2 text-center bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
            href={BRAND.url} target="_blank" rel="noreferrer"
          >
            Ver tienda completa
          </a>
        </div>
      </section>

      {/* ---------- TÍTULO DE SECCIÓN ---------- */}
      <section className="max-w-6xl mx-auto px-4 mt-6">
        <div className="rounded-2xl p-4 text-white shadow"
             style={{background:"linear-gradient(90deg,#2f3a4a,#485567)"}}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">{currentCatName}</h2>
            <div className="text-sm opacity-95">{catId===0 ? total : products.length} productos</div>
          </div>
        </div>
      </section>

      {/* ---------- GRID DE PRODUCTOS ---------- */}
      <main className="max-w-6xl mx-auto px-4 mt-5 pb-24">
        <div className="grid gap-6" style={{gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))"}}>
          {products.map(p => (
            <article key={p.id} className="product-card rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow">
              <div className="aspect-[4/3] bg-slate-100">
                {p.image
                  ? <img src={p.image} alt={p.name} className="w-full h-full object-cover object-center" loading="lazy" decoding="async" />
                  : <div className="w-full h-full flex items-center justify-center text-slate-400">Sin imagen</div>}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-800 tracking-tight line-clamp-2 min-h-[44px]">{p.name}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-lg font-extrabold text-slate-900">S/ {Number(p.list_price||0).toFixed(2)}</div>
                  <a
                    href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent("Hola, me interesa: "+(p.name||""))}`}
                    target="_blank" rel="noreferrer"
                    className="text-sm font-semibold bg-[#F6B400] text-slate-900 px-3 py-1.5 rounded-lg hover:brightness-105"
                  >
                    Comprar
                  </a>
                </div>
                <p className="mt-1 text-xs text-slate-500">Envíos a todo el Perú</p>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* ---------- BOTÓN IMPRIMIR (NO PRINT) ---------- */}
      <button
        onClick={()=>window.print()}
        className="no-print fixed right-4 bottom-4 z-50 bg-[#F6B400] text-slate-900 font-semibold px-4 py-2 rounded-xl shadow-lg hover:brightness-105"
        aria-label="Imprimir PDF"
      >
        Imprimir PDF
      </button>

      {/* ---------- SALTO DE PÁGINA PARA FOOTER EN PDF ---------- */}
      <div className="print-break"></div>

      {/* ---------- FOOTER ---------- */}
      <footer className="print-footer max-w-6xl mx-auto px-4 mt-8 pb-10">
        <div className="rounded-3xl bg-slate-900 text-white p-6 shadow">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="print-keep">
              <div className="text-lg font-semibold">{BRAND.name}</div>
              <div className="text-sm text-white/80 mt-2">Atención por WhatsApp · Envíos a todo el Perú</div>
            </div>
            <div className="print-keep">
              <div className="text-lg font-semibold">Contáctanos</div>
              <div className="mt-2 text-sm">
                <a className="hover:underline" href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noreferrer">
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
          <div className="text-xs text-white/70 mt-4 print-keep">© {new Date().getFullYear()} {BRAND.name}</div>
        </div>
      </footer>
    </div>
  );
}
