import React, { useEffect, useMemo, useState } from "react";

export default function CatalogoWeb() {
  const [categories, setCategories] = useState([]);      // {id, name, count}[]
  const [catId, setCatId] = useState(0);                 // 0 = Todos
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);

  // 1) Cargar categorías una sola vez
  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then(data => setCategories(data.items || []))
      .catch(() => setCategories([]));
  }, []);

  // 2) Cargar productos según categoria seleccionada + búsqueda
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("limit", "60");
    if (catId > 0) params.set("categ_id", String(catId));
    if (query.trim()) params.set("q", query.trim());

    fetch(`/api/products?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        setProducts(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => {
        setProducts([]);
        setTotal(0);
      });
  }, [catId, query]);

  return (
    <>
      {/* buscador + categorías */}
      <div className="mt-6 grid gap-3 md:grid-cols-3">
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
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <a className="border rounded-xl px-4 py-2 text-center bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
           href="https://la-tiendita-de-cris.odoo.com/shop" target="_blank" rel="noreferrer">
          Ver tienda completa
        </a>
      </div>

      {/* cabecera con conteo */}
      <section className="mt-6 rounded-2xl p-4 text-white shadow"
               style={{background:"linear-gradient(90deg,#2f3a4a,#485567)"}}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">
            {catId === 0 ? "Todos los productos" :
              (categories.find(c=>c.id===catId)?.name || "Productos")}
          </h2>
          <div className="text-sm opacity-95">
            {catId===0 ? total : products.length} productos
          </div>
        </div>
      </section>

      {/* grid */}
      <section className="mt-4 grid gap-6" style={{gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))"}}>
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
                <a href={`https://wa.me/51988694721?text=${encodeURIComponent("Hola, me interesa: " + (p.name||""))}`}
                   target="_blank" rel="noreferrer"
                   className="text-sm font-semibold bg-[#F6B400] text-slate-900 px-3 py-1.5 rounded-lg hover:brightness-105">
                  Comprar
                </a>
              </div>
              <p className="mt-1 text-xs text-slate-500">Envíos a todo el Perú</p>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
