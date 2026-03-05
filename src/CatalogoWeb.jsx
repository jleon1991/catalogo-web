import React, { useEffect, useMemo, useState } from "react";

const BRAND = {
  name: "La Tiendita de Cris",
  slogan: "Productos útiles, prácticos y divertidos para tu día a día.",
  whatsapp: "51988694721", // +51 988 694 721
  odooShopUrl: "https://la-tiendita-de-cris.odoo.com/shop",
};

function formatPEN(value) {
  const n = Number(value ?? 0);
  return `S/ ${n.toFixed(2)}`;
}

function getUrlParam(name, fallback = "") {
  try {
    const u = new URL(window.location.href);
    return u.searchParams.get(name) ?? fallback;
  } catch {
    return fallback;
  }
}

function waLink(text) {
  return `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`;
}

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function fetchProductsPage({ limit = 60, offset = 0, categId = 0, q = "" }) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  if (categId > 0) params.set("categ_id", String(categId));
  if (q.trim()) params.set("q", q.trim());
  return fetchJson(`/api/products2?${params.toString()}`);
}

// Trae todo el catálogo (para PDF "todo")
async function fetchAllProducts({ q = "", max = 900 }) {
  const all = [];
  let offset = 0;
  const limit = 120; // tu API permite hasta 120 :contentReference[oaicite:2]{index=2}

  while (true) {
    const page = await fetchProductsPage({ limit, offset, categId: 0, q });
    const items = page.items || [];
    all.push(...items);

    if (items.length < limit) break;
    offset += limit;
    if (all.length >= max) break; // safety
  }
  return all.slice(0, max);
}

function Section({ title, subtitle, right, children }) {
  return (
    <section style={{ marginTop: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 1000, letterSpacing: -0.2 }}>{title}</div>
          {subtitle ? <div style={{ marginTop: 6, opacity: 0.78 }}>{subtitle}</div> : null}
        </div>
        {right ? <div className="no-print">{right}</div> : null}
      </div>
      <div style={{ marginTop: 14 }}>{children}</div>
    </section>
  );
}

function ProductCard({ p }) {
  const buyText = `Hola 👋 Estoy interesado en:\n• ${p.name}\n• Precio: ${formatPEN(p.list_price)}\n¿Hay stock?`;
  return (
    <div className="ltc-card">
      <div className="ltc-imageWrap">
        <img className="ltc-image" src={p.image} alt={p.name} loading="lazy" />
        <div className="ltc-pill">{p.categ || "Otros"}</div>
      </div>

      <div className="ltc-cardBody">
        <div className="ltc-title">{p.name}</div>
        <div className="ltc-row">
          <div className="ltc-price">{formatPEN(p.list_price)}</div>
          <div className="ltc-meta">ID: {p.id}</div>
        </div>

        <a className="ltc-btnWhats" href={waLink(buyText)} target="_blank" rel="noreferrer">
          Comprar por WhatsApp
        </a>
      </div>
    </div>
  );
}

function CategoryTiles({ categories, onPick, anchorId = "explorar" }) {
  const gradients = [
    ["#0D47A1", "#00BCD4"],
    ["#0B1220", "#334155"],
    ["#111827", "#22c55e"],
    ["#1f2937", "#0ea5e9"],
    ["#0b1220", "#F6B400"],
  ];

  return (
    <div className="ltc-tiles">
      {categories.map((c, idx) => {
        const g = gradients[idx % gradients.length];
        return (
          <button
            key={c.id}
            className="ltc-tile"
            style={{ background: `linear-gradient(90deg, ${g[0]}, ${g[1]})` }}
            onClick={() => {
              onPick(c.id);
              const el = document.getElementById(anchorId);
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <div className="ltc-tileMeta">Categoría</div>
            <div className="ltc-tileTitle">{c.name}</div>
            <div className="ltc-tileSub">{c.count ? `${c.count} productos` : "Explorar productos"}</div>
          </button>
        );
      })}
    </div>
  );
}

function PrintCover({ total, catCount }) {
  return (
    <div className="print-only ltc-printCover print-keep">
      <div style={{ fontSize: 34, fontWeight: 1000, letterSpacing: -0.4 }}>{BRAND.name}</div>
      <div style={{ marginTop: 8, fontSize: 16, opacity: 0.95 }}>{BRAND.slogan}</div>

      <div style={{ marginTop: 18, display: "flex", flexWrap: "wrap", gap: 10 }}>
        <span className="ltc-pillLight">Envíos a todo el Perú</span>
        <span className="ltc-pillLight">Pedidos por WhatsApp</span>
        <span className="ltc-pillLight">{total} productos</span>
        <span className="ltc-pillLight">{catCount} categorías</span>
      </div>

      <div style={{ marginTop: 18, fontSize: 14, opacity: 0.95, maxWidth: 520 }}>
        Catálogo actualizado automáticamente desde Odoo. Para comprar: escribe a WhatsApp con el nombre del producto.
      </div>

      <div style={{ marginTop: 14, fontSize: 18, fontWeight: 1000 }}>WhatsApp: +51 988 694 721</div>
      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9 }}>{new Date().toLocaleDateString("es-PE")}</div>
    </div>
  );
}

function PrintIndex({ categories }) {
  return (
    <div className="print-only print-keep" style={{ marginTop: 14 }}>
      <div className="ltc-printTitle">Índice</div>
      <div className="ltc-indexGrid">
        {categories.map((c) => (
          <div key={c.id} className="ltc-indexItem">
            <div style={{ fontWeight: 1000 }}>{c.name}</div>
            <div style={{ opacity: 0.7, fontSize: 12 }}>{c.count || ""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CatalogoWeb() {
  const isPrint = getUrlParam("print") === "1";
  const scope = getUrlParam("scope", "filtered"); // filtered | all

  const [categories, setCategories] = useState([]);
  const [catId, setCatId] = useState(0);
  const [query, setQuery] = useState("");

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // colecciones tipo IKEA
  const [newArrivals, setNewArrivals] = useState([]);
  const [under50, setUnder50] = useState([]);
  const [giftIdeas, setGiftIdeas] = useState([]);

  const isHome = !isPrint && catId === 0 && !query.trim();

  // categorías
  useEffect(() => {
    fetchJson("/api/categories")
      .then((d) => setCategories(d.items || []))
      .catch(() => setCategories([]));
  }, []);

  // Screen: carga inicial y al cambiar filtros
  useEffect(() => {
    if (isPrint) return;

    (async () => {
      setOffset(0);
      const page = await fetchProductsPage({ limit: 60, offset: 0, categId: catId, q: query });
      setProducts(page.items || []);
      setTotal(page.total || 0);
    })().catch(() => {
      setProducts([]);
      setTotal(0);
    });
  }, [catId, query, isPrint]);

  // Screen: colecciones (solo en home)
  useEffect(() => {
    if (isPrint || !isHome) return;

    (async () => {
      const page = await fetchProductsPage({ limit: 36, offset: 0, categId: 0, q: "" });
      const arr = page.items || [];

      setNewArrivals(arr.slice(0, 12));
      setUnder50(arr.filter((p) => Number(p.list_price) <= 50).slice(0, 12));
      const shuffled = [...arr].sort(() => Math.random() - 0.5);
      setGiftIdeas(shuffled.slice(0, 12));
    })().catch(() => {
      setNewArrivals([]);
      setUnder50([]);
      setGiftIdeas([]);
    });
  }, [isPrint, isHome]);

  // Print: cargar filtrado o TODO y luego imprimir
  useEffect(() => {
    if (!isPrint) return;

    (async () => {
      if (scope === "all") {
        const all = await fetchAllProducts({ q: "" });
        setProducts(all);
        setTotal(all.length);
      } else {
        const page = await fetchProductsPage({ limit: 120, offset: 0, categId: catId, q: query });
        setProducts(page.items || []);
        setTotal(page.total || 0);
      }
      setTimeout(() => window.print(), 700);
    })().catch(() => setTimeout(() => window.print(), 700));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrint, scope]);

  const groupedForPrint = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      const key = p.categ || "Otros";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    const keys = Array.from(map.keys()).sort((a, b) => a.localeCompare(b, "es"));
    return keys.map((k) => ({ name: k, items: map.get(k) }));
  }, [products]);

  const currentCatName =
    catId === 0 ? "Todos los productos" : categories.find((c) => c.id === catId)?.name || "Productos";

  const openPrintView = (nextScope) => {
    const url = new URL(window.location.href);
    url.searchParams.set("print", "1");
    url.searchParams.set("scope", nextScope); // filtered | all
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const nextOffset = offset + 60;
      const page = await fetchProductsPage({ limit: 60, offset: nextOffset, categId: catId, q: query });
      setProducts((prev) => [...prev, ...(page.items || [])]);
      setOffset(nextOffset);
      setTotal(page.total || total);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="ltc-page">
      {/* HEADER (no-print) */}
      <div className="no-print ltc-hero">
        <div className="ltc-heroTop">
          <div>
            <h1 className="ltc-h1">{BRAND.name}</h1>
            <p className="ltc-sub">{BRAND.slogan}</p>
          </div>

          <div className="ltc-heroBtns">
            <a className="ltc-btnWhatsTop" href={waLink("Hola 👋 Quiero ayuda para elegir productos del catálogo. ¿Qué me recomiendas?")} target="_blank" rel="noreferrer">
              WhatsApp – Pedir ayuda
            </a>
            <button className="ltc-btnPdfA" onClick={() => openPrintView("filtered")}>
              PDF (lo que veo)
            </button>
            <button className="ltc-btnPdfB" onClick={() => openPrintView("all")}>
              PDF (todo)
            </button>
          </div>
        </div>

        <div className="ltc-filters">
          <input
            className="ltc-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar (ej. smartwatch, parlante, colonia...)"
          />

          <select className="ltc-select" value={catId} onChange={(e) => setCatId(parseInt(e.target.value, 10))}>
            <option value={0}>Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <a className="ltc-linkOdoo" href={BRAND.odooShopUrl} target="_blank" rel="noreferrer">
            Ver tienda (Odoo)
          </a>
        </div>
      </div>

      {/* PRINT */}
      {isPrint ? (
        <div className="ltc-container">
          <PrintCover total={total} catCount={categories.length} />
          <PrintIndex categories={categories} />

          {groupedForPrint.map((g, idx) => (
            <div key={g.name} className={idx === 0 ? "" : "print-break-before"} style={{ marginTop: 14 }}>
              <div className="ltc-printTitle">{g.name}</div>
              <div className="ltc-grid">
                {g.items.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
            </div>
          ))}

          <div className="print-only print-keep" style={{ marginTop: 16 }}>
            <div className="ltc-footerCard">
              <div style={{ fontWeight: 1000 }}>{BRAND.name}</div>
              <div style={{ marginTop: 6, opacity: 0.8 }}>Pedidos: +51 988 694 721 • Envíos a todo el Perú</div>
            </div>
          </div>
        </div>
      ) : (
        /* WEB */
        <div className="ltc-container">
          {isHome ? (
            <>
              <Section title="Explora por categoría" subtitle="Encuentra rápido lo que necesitas (estilo IKEA).">
                <CategoryTiles categories={categories} onPick={(id) => setCatId(id)} anchorId="explorar" />
              </Section>

              <Section title="Recién llegados" subtitle="Lo nuevo que acaba de entrar.">
                <div className="ltc-grid">{newArrivals.map((p) => <ProductCard key={p.id} p={p} />)}</div>
              </Section>

              <Section title="Menos de S/ 50" subtitle="Alta rotación y regalos rápidos.">
                <div className="ltc-grid">{under50.map((p) => <ProductCard key={p.id} p={p} />)}</div>
              </Section>

              <Section title="Ideas para regalo" subtitle="Opciones rápidas para sorprender.">
                <div className="ltc-grid">{giftIdeas.map((p) => <ProductCard key={p.id} p={p} />)}</div>
              </Section>
            </>
          ) : null}

          <div id="explorar" style={{ marginTop: 26 }}>
            <div className="ltc-exploreCard">
              <div className="ltc-exploreTop">
                <div className="ltc-h2">{currentCatName}</div>
                <div style={{ opacity: 0.75 }}>Mostrando {products.length} de {total}</div>
              </div>

              <div className="ltc-grid" style={{ marginTop: 14 }}>
                {products.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>

              <div className="no-print" style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
                {products.length < total ? (
                  <button className="ltc-btnLoad" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? "Cargando..." : "Cargar más"}
                  </button>
                ) : (
                  <div style={{ opacity: 0.75, fontWeight: 900 }}>Fin del catálogo 🎉</div>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div className="ltc-footerCard">
              <div className="ltc-h2">{BRAND.name}</div>
              <div style={{ marginTop: 6, opacity: 0.85 }}>📦 Envíos a todo el Perú • 📲 WhatsApp: +51 988 694 721</div>
              <div className="no-print" style={{ marginTop: 10 }}>
                <a className="ltc-btnWhatsTop" href={waLink("Hola 👋 Quiero comprar. ¿Me ayudas?")} target="_blank" rel="noreferrer">
                  Comprar por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}