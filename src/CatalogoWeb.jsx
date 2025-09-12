// src/CatalogoWeb.jsx
import React, { useEffect, useState } from "react";

export default function CatalogoWeb() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    fetch("/api/products")
      .then(r => {
        if (!r.ok) throw new Error("Error cargando productos");
        return r.json();
      })
      .then(data => setProducts(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Cargando catálogo…</div>;
  if (error)   return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">La Tiendita de Cris</h1>
      <div className="grid gap-6" style={{gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))"}}>
        {products.map(p => (
          <article key={p.id} className="rounded-xl overflow-hidden bg-white shadow">
            <div className="aspect-[4/3] bg-slate-100">
              {p.image
                ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                : <div className="w-full h-full flex items-center justify-center text-slate-400">Sin imagen</div>}
            </div>
            <div className="p-4">
              <h3 className="font-semibold">{p.name}</h3>
              <div className="mt-1 text-slate-700">S/ {Number(p.list_price || 0).toFixed(2)}</div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
