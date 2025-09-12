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
  const [categories, setCategories] = useState([]);
  const [catId, setCatId] = useState(0); // 0 = Todos
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);

  // Para verificar que el componente se monta
  useEffect(() => {
    console.log("[CatalogoWeb] montado");
  }, []);

  // Carga categorías (una vez)
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.items || []))
      .catch(() => setCategories([]));
  }, []);

  // Carga productos según filtros
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("limit", "60");
    if (catId > 0) params.set("categ_id", String(catId));
    if (query.trim()) params.set("q", query.trim());
    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.items || []);
        setTotal(d.total || 0);
      })
      .catch(() => {
        setProducts([]);
        setTotal(0);
      });
  }, [catId, query]);

  const currentCatName =
    catId === 0
      ? "Todos los productos"
      : categories.find((c) => c.id === catId)?.name || "Productos";

  return (
    <div style={{ minHeight: "100vh", background: "#EEF3F8" }}>
      {/* ======= HEADER (forzado visible) ======= */}
      <div
        style={{
          maxWidth: 1100,
          margin: "32px auto 0",
          padding: "28px",
          borderRadius: 24,
          color: "white",
          background: "linear-gradient(90deg,#0D47A1,#00BCD4)",
          boxShadow: "0 10px 30px rgba(0,0,0,.12)",
        }}
      >
        <h1 style={{ fontSize: 34, fontWeight: 900, margin: 0 }}>
          La Tiendita de Cris
        </h1>
        <p style={{ marginTop: 8, opacity: 0.95 }}>
          Productos prácticos y divertidos. Compra por WhatsApp.
        </p>
        <a
          href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(
            "Hola, quiero ver el catálogo 😊"
          )}`}
          target="_blank"
          rel="noreferrer"
          style={{
            marginTop: 14,
            display: "inline-block",
            background: "white",
            color: "#0b1220",
            fontWeight: 700,
            padding: "10px 16px",
            borderRadius: 12,
            textDecoration: "none",
          }}
        >
          Comprar por WhatsApp
        </a>
      </div>

      {/* ======= CONTROLES ======= */}
      <div
        style={{
          maxWidth: 1100,
          margin: "16px auto 0",
          padding: "0 16px",
          display: "grid",
          gap: 12,
          gridTemplateColumns: "1fr 320px 220px",
        }}
      >
        <input
          placeholder="Buscar productos…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #d6dbe3",
            background: "white",
          }}
        />
        <select
          value={catId}
          onChange={(e) => setCatId(parseInt(e.target.value, 10))}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #d6dbe3",
            background: "white",
          }}
        >
          <option value={0}>Todos</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <a
          href={BRAND.url}
          target="_blank"
          rel="noreferrer"
          style={{
            textAlign: "center",
            padding: "10px 14px",
            borderRadius: 12,
            textDecoration: "none",
            color: "white",
            background: "#111827",
            fontWeight: 700,
          }}
        >
          Ver tienda completa
        </a>
      </div>

      {/* ======= TÍTULO SECCIÓN ======= */}
      <div
        style={{
          maxWidth: 1100,
          margin: "18px auto 0",
          padding: "14px 16px",
          borderRadius: 18,
          color: "white",
          background: "linear-gradient(90deg,#2f3a4a,#485567)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800 }}>{currentCatName}</div>
          <div style={{ opacity: 0.95, fontSize: 14 }}>
            {catId === 0 ? total : products.length} productos
          </div>
        </div>
      </div>

      {/* ======= GRID ======= */}
      <div
        style={{
          maxWidth: 1100,
          margin: "20px auto 96px",
          padding: "0 16px",
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
        }}
      >
        {products.map((p) => (
          <article
            key={p.id}
            style={{
              borderRadius: 16,
              overflow: "hidden",
              background: "white",
              boxShadow: "0 6px 18px rgba(0,0,0,.08)",
            }}
          >
            <div
              style={{
                background: "#f1f5f9",
                aspectRatio: "4 / 3",
                width: "100%",
                position: "relative",
              }}
            >
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  decoding="async"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                  }}
                >
                  Sin imagen
                </div>
              )}
            </div>
            <div style={{ padding: 16 }}>
              <div
                style={{
                  fontWeight: 700,
                  color: "#0b1220",
                  lineHeight: 1.25,
                  minHeight: 44,
                }}
              >
                {p.name}
              </div>
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ fontWeight: 900, color: "#0b1220" }}>
                  S/ {Number(p.list_price || 0).toFixed(2)}
                </div>
                <a
                  href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(
                    "Hola, me interesa: " + (p.name || "")
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontWeight: 700,
                    background: "#F6B400",
                    color: "#0b1220",
                    padding: "6px 10px",
                    borderRadius: 10,
                    textDecoration: "none",
                  }}
                >
                  Comprar
                </a>
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
                Envíos a todo el Perú
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* ======= BOTÓN IMPRIMIR ======= */}
      <button
        onClick={() => window.print()}
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 50,
          background: "#F6B400",
          color: "#0b1220",
          fontWeight: 700,
          padding: "10px 14px",
          borderRadius: 12,
          boxShadow: "0 10px 24px rgba(0,0,0,.15)",
        }}
        aria-label="Imprimir PDF"
      >
        Imprimir PDF
      </button>

      {/* ======= FOOTER (forzado visible) ======= */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto 32px",
          padding: "0 16px",
        }}
      >
        <div
          style={{
            borderRadius: 24,
            background: "#0b1220",
            color: "white",
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,.12)",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{BRAND.name}</div>
              <div style={{ marginTop: 8, opacity: 0.85 }}>
                Atención por WhatsApp · Envíos a todo el Perú
              </div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Contáctanos</div>
              <div style={{ marginTop: 8 }}>
                <a
                  href={`https://wa.me/${BRAND.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "white", textDecoration: "underline" }}
                >
                  +51 988 694 721
                </a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Síguenos</div>
              <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href={BRAND.facebook} target="_blank" rel="noreferrer" style={{ color: "white", textDecoration: "underline" }}>
                  Facebook
                </a>
                <a href={BRAND.instagram} target="_blank" rel="noreferrer" style={{ color: "white", textDecoration: "underline" }}>
                  Instagram
                </a>
                <a href={BRAND.tiktok} target="_blank" rel="noreferrer" style={{ color: "white", textDecoration: "underline" }}>
                  TikTok
                </a>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
            © {new Date().getFullYear()} {BRAND.name}
          </div>
        </div>
      </div>
    </div>
  );
}
