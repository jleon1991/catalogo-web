import React, { useEffect, useMemo, useState } from "react";

const BRAND = {
  name: "La Tiendita de Cris",
  slogan: "Productos útiles, prácticos y divertidos para tu día a día.",
  whatsapp: "51988694721",
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

async function fetchAllProducts({ q = "", max = 900 }) {
  const all = [];
  let offset = 0;
  const limit = 120;
  while (true) {
    const page = await fetchProductsPage({ limit, offset, categId: 0, q });
    const items = page.items || [];
    all.push(...items);
    if (items.length < limit) break;
    offset += limit;
    if (all.length >= max) break;
  }
  return all.slice(0, max);
}

async function waitForImagesAndFonts() {
  if (document.fonts?.ready) {
    try { await document.fonts.ready; } catch {}
  }
  const imgs = Array.from(document.images || []);
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((res) => { img.onload = res; img.onerror = res; })
    )
  );
  await new Promise((r) => setTimeout(r, 250));
}

function sortProducts(arr, sort) {
  if (!sort || sort === "default") return arr;
  const copy = [...arr];
  if (sort === "price_asc")  return copy.sort((a, b) => a.list_price - b.list_price);
  if (sort === "price_desc") return copy.sort((a, b) => b.list_price - a.list_price);
  if (sort === "name_asc")   return copy.sort((a, b) => a.name.localeCompare(b.name, "es"));
  if (sort === "name_desc")  return copy.sort((a, b) => b.name.localeCompare(a.name, "es"));
  return arr;
}

/* ===================== COMPONENTS ===================== */

function Section({ title, subtitle, right, children }) {
  return (
    <section className="ltc-section">
      <div className="ltc-sectionHead">
        <div>
          <h2 className="ltc-sectionTitle">{title}</h2>
          {subtitle && <p className="ltc-sectionSub">{subtitle}</p>}
        </div>
        {right && <div className="no-print">{right}</div>}
      </div>
      <div>{children}</div>
    </section>
  );
}

function ProductCard({ p, isPrint, onQuickView, isNew }) {
  const buyText = `Hola 👋 Estoy interesado en:\n• ${p.name}\n• Precio: ${formatPEN(p.list_price)}\n¿Hay stock?`;

  const imgSrc =
    isPrint && p.image && /^https?:\/\//i.test(p.image)
      ? `/api/image?url=${encodeURIComponent(p.image)}`
      : p.image;

  return (
    <div className={`ltc-card${isPrint ? "" : " ltc-card--interactive"}`}>
      <div className="ltc-imageWrap">
        <img
          className="ltc-image"
          src={imgSrc}
          alt={p.name}
          loading={isPrint ? "eager" : "lazy"}
          decoding="async"
        />
        <div className="ltc-pill">{p.categ || "Otros"}</div>
        {isNew && !isPrint && <div className="ltc-badgeNew">NUEVO</div>}
        {!isPrint && onQuickView && (
          <button className="ltc-quickView" onClick={() => onQuickView(p)}>
            👁 Ver detalles
          </button>
        )}
      </div>

      <div className="ltc-cardBody">
        <div className="ltc-title" title={p.name}>{p.name}</div>
        <div className="ltc-row">
          <div className="ltc-price">{formatPEN(p.list_price)}</div>
          <div className="ltc-meta">#{p.id}</div>
        </div>
        <a className="ltc-btnWhats" href={waLink(buyText)} target="_blank" rel="noreferrer">
          🛒 Comprar por WhatsApp
        </a>
      </div>
    </div>
  );
}

function CategoryTiles({ categories, onPick, anchorId = "explorar" }) {
  const gradients = [
    ["#1D4ED8", "#0EA5E9"],
    ["#7C3AED", "#EC4899"],
    ["#059669", "#10B981"],
    ["#DC2626", "#F97316"],
    ["#0F172A", "#1D4ED8"],
    ["#D97706", "#F59E0B"],
    ["#0891B2", "#06B6D4"],
    ["#BE185D", "#F43F5E"],
  ];

  const emojis = ["🛍️", "📦", "🎁", "⭐", "💎", "🔥", "✨", "🏷️", "💡", "🎯", "🧴", "🎀"];

  return (
    <div className="ltc-tiles">
      {categories.map((c, idx) => {
        const g = gradients[idx % gradients.length];
        const emoji = emojis[idx % emojis.length];
        const label = c?.name || c?.display_name || c?.title || `Categoría ${c?.id ?? ""}`;
        return (
          <button
            key={c.id}
            className="ltc-tile"
            style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }}
            onClick={() => {
              onPick(c.id);
              const el = document.getElementById(anchorId);
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <div className="ltc-tileEmoji">{emoji}</div>
            <div className="ltc-tileTitle">{label}</div>
            <div className="ltc-tileSub">{c.count ? `${c.count} productos →` : "Ver productos →"}</div>
          </button>
        );
      })}
    </div>
  );
}

function ProductModal({ product, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const buyText = `Hola 👋 Estoy interesado en:\n• ${product.name}\n• Precio: ${formatPEN(product.list_price)}\n¿Hay stock?`;

  return (
    <div className="ltc-modalBackdrop" onClick={onClose}>
      <div
        className="ltc-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
      >
        <button className="ltc-modalClose" onClick={onClose} aria-label="Cerrar">✕</button>

        <div className="ltc-modalImgWrap">
          <img src={product.image} alt={product.name} className="ltc-modalImg" />
        </div>

        <div className="ltc-modalBody">
          <div className="ltc-modalPill">{product.categ || "Otros"}</div>
          <h2 className="ltc-modalTitle">{product.name}</h2>
          <div className="ltc-modalPrice">{formatPEN(product.list_price)}</div>
          <div className="ltc-modalMeta">Código de producto: #{product.id}</div>
          <a
            className="ltc-btnWhats ltc-btnWhats--lg"
            href={waLink(buyText)}
            target="_blank"
            rel="noreferrer"
          >
            🛒 Comprar por WhatsApp
          </a>
          <div className="ltc-modalNote">
            🚚 Envíos a todo el Perú • 💳 Pago contra entrega disponible
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintCover({ total, catCount, titleOverride, subtitleOverride }) {
  return (
    <div className="print-only ltc-printCover print-keep">
      <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -0.4 }}>
        {titleOverride || BRAND.name}
      </div>
      <div style={{ marginTop: 8, fontSize: 16, opacity: 0.95 }}>
        {subtitleOverride || BRAND.slogan}
      </div>
      <div style={{ marginTop: 18, display: "flex", flexWrap: "wrap", gap: 10 }}>
        <span className="ltc-pillLight">Envíos a todo el Perú</span>
        <span className="ltc-pillLight">Pedidos por WhatsApp</span>
        <span className="ltc-pillLight">{total} productos</span>
        <span className="ltc-pillLight">{catCount} categorías</span>
      </div>
      <div style={{ marginTop: 18, fontSize: 14, opacity: 0.95, maxWidth: 520 }}>
        Catálogo actualizado automáticamente desde Odoo. Para comprar: escribe a WhatsApp con el
        nombre del producto.
      </div>
      <div style={{ marginTop: 14, fontSize: 18, fontWeight: 900 }}>WhatsApp: +51 988 694 721</div>
      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9 }}>
        {new Date().toLocaleDateString("es-PE")}
      </div>
    </div>
  );
}

function PrintIndex({ categories }) {
  return (
    <div className="print-only print-keep" style={{ marginTop: 14 }}>
      <div className="ltc-printTitle">Índice</div>
      <div className="ltc-indexGrid">
        {categories.map((c) => {
          const label = c?.name || c?.display_name || c?.title || `Categoría ${c?.id ?? ""}`;
          return (
            <div key={c.id} className="ltc-indexItem">
              <div style={{ fontWeight: 900 }}>{label}</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>{c.count || ""}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===================== MAIN COMPONENT ===================== */

export default function CatalogoWeb() {
  const isPrint    = getUrlParam("print") === "1";
  const scope      = getUrlParam("scope", "filtered");
  const printCatId = parseInt(getUrlParam("catId", "0"), 10) || 0;
  const printQuery = getUrlParam("q", "");

  const [categories, setCategories] = useState([]);
  const [catId, setCatId]           = useState(0);
  const [query, setQuery]           = useState("");
  const [sort, setSort]             = useState("default");

  const [products, setProducts]     = useState([]);
  const [total, setTotal]           = useState(0);
  const [offset, setOffset]         = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const [newArrivals, setNewArrivals] = useState([]);
  const [under50, setUnder50]         = useState([]);
  const [giftIdeas, setGiftIdeas]     = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);

  const isHome = !isPrint && catId === 0 && !query.trim();

  // Top 15% by id = "new" badge
  const newIds = useMemo(() => {
    if (!products.length) return new Set();
    const byId = [...products].sort((a, b) => b.id - a.id);
    return new Set(byId.slice(0, Math.max(5, Math.ceil(products.length * 0.15))).map((p) => p.id));
  }, [products]);

  const sortedProducts = useMemo(() => sortProducts(products, sort), [products, sort]);

  useEffect(() => {
    fetchJson("/api/categories")
      .then((d) => setCategories(d.items || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (isPrint) return;
    (async () => {
      setOffset(0);
      const page = await fetchProductsPage({ limit: 60, offset: 0, categId: catId, q: query });
      setProducts(page.items || []);
      setTotal(page.total || 0);
    })().catch(() => { setProducts([]); setTotal(0); });
  }, [catId, query, isPrint]);

  useEffect(() => {
    if (isPrint || !isHome) return;
    (async () => {
      const page = await fetchProductsPage({ limit: 36, offset: 0, categId: 0, q: "" });
      const arr = page.items || [];
      setNewArrivals(arr.slice(0, 12));
      setUnder50(arr.filter((p) => Number(p.list_price) <= 50).slice(0, 12));
      const shuffled = [...arr].sort(() => Math.random() - 0.5);
      setGiftIdeas(shuffled.slice(0, 12));
    })().catch(() => { setNewArrivals([]); setUnder50([]); setGiftIdeas([]); });
  }, [isPrint, isHome]);

  useEffect(() => {
    if (!isPrint) return;
    let cancelled = false;
    (async () => {
      try {
        if (scope === "all") {
          const all = await fetchAllProducts({ q: printQuery || "" });
          if (cancelled) return;
          setProducts(all);
          setTotal(all.length);
        } else {
          const page = await fetchProductsPage({
            limit: 120, offset: 0, categId: printCatId, q: printQuery,
          });
          if (cancelled) return;
          setProducts(page.items || []);
          setTotal(page.total || 0);
        }
        await new Promise((r) => setTimeout(r, 50));
        await waitForImagesAndFonts();
        if (!cancelled) window.print();
      } catch {
        await new Promise((r) => setTimeout(r, 800));
        if (!cancelled) window.print();
      }
    })();
    return () => { cancelled = true; };
  }, [isPrint, scope, printCatId, printQuery]);

  const groupedForPrint = useMemo(() => {
    if (scope === "filtered" && printCatId > 0) {
      const catLabel =
        categories.find((c) => c.id === printCatId)?.name ||
        categories.find((c) => c.id === printCatId)?.display_name ||
        "Resultados filtrados";
      return [{ name: catLabel, items: products }];
    }
    const map = new Map();
    for (const p of products) {
      const key = p.categ || "Otros";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    const keys = Array.from(map.keys()).sort((a, b) => a.localeCompare(b, "es"));
    return keys.map((k) => ({ name: k, items: map.get(k) }));
  }, [products, scope, printCatId, categories]);

  const currentCatName =
    catId === 0
      ? "Todos los productos"
      : categories.find((c) => c.id === catId)?.name ||
        categories.find((c) => c.id === catId)?.display_name ||
        "Productos";

  const printCurrentCatName =
    printCatId === 0
      ? "Todos los productos"
      : categories.find((c) => c.id === printCatId)?.name ||
        categories.find((c) => c.id === printCatId)?.display_name ||
        "Productos";

  const openPrintView = (nextScope) => {
    const url = new URL(window.location.href);
    url.searchParams.set("print", "1");
    url.searchParams.set("scope", nextScope);
    url.searchParams.set("catId", String(catId));
    url.searchParams.set("q", query || "");
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

  const printTitle =
    scope === "filtered" && (printCatId > 0 || printQuery)
      ? printCurrentCatName
      : BRAND.name;

  const printSubtitle =
    scope === "filtered" && (printCatId > 0 || printQuery)
      ? printQuery
        ? `Resultados para: "${printQuery}"`
        : "Catálogo filtrado por categoría"
      : BRAND.slogan;

  return (
    <div className="ltc-page">
      {/* QUICK VIEW MODAL */}
      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      {/* HERO */}
      <div className="no-print ltc-hero">
        <div className="ltc-heroInner">
          <div className="ltc-heroLeft">
            <div className="ltc-heroBadge">🛍️ Catálogo Oficial</div>
            <h1 className="ltc-h1">{BRAND.name}</h1>
            <p className="ltc-sub">{BRAND.slogan}</p>
            <div className="ltc-heroStats">
              {categories.length > 0 && (
                <>
                  <span className="ltc-statPill">📦 {total > 0 ? `${total}+` : "..."} productos</span>
                  <span className="ltc-statPill">🗂️ {categories.length} categorías</span>
                  <span className="ltc-statPill">🚚 Envíos a todo el Perú</span>
                </>
              )}
            </div>
          </div>

          <div className="ltc-heroBtns">
            <a
              className="ltc-btnWhatsTop"
              href={waLink("Hola 👋 Quiero ayuda para elegir productos del catálogo. ¿Qué me recomiendas?")}
              target="_blank"
              rel="noreferrer"
            >
              💬 Pedir ayuda
            </a>
            <button className="ltc-btnPdfA" onClick={() => openPrintView("filtered")}>
              🖨️ PDF vista actual
            </button>
            <button className="ltc-btnPdfB" onClick={() => openPrintView("all")}>
              📄 PDF completo
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="ltc-filtersWrap">
          <div className="ltc-filters">
            <div className="ltc-searchWrap">
              <span className="ltc-searchIcon">🔍</span>
              <input
                className="ltc-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar productos (ej. smartwatch, parlante, colonia...)"
              />
            </div>

            <select
              className="ltc-select"
              value={catId}
              onChange={(e) => setCatId(parseInt(e.target.value, 10))}
            >
              <option value={0}>Todas las categorías</option>
              {categories.map((c) => {
                const label = c?.name || c?.display_name || c?.title || `Categoría ${c?.id ?? ""}`;
                return (
                  <option key={c.id} value={c.id} style={{ color: "#0F172A", background: "#fff" }}>
                    {label}
                  </option>
                );
              })}
            </select>

            <select
              className="ltc-select ltc-select--sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="default">Más recientes</option>
              <option value="price_asc">Menor precio</option>
              <option value="price_desc">Mayor precio</option>
              <option value="name_asc">A → Z</option>
              <option value="name_desc">Z → A</option>
            </select>

            <a className="ltc-linkOdoo" href={BRAND.odooShopUrl} target="_blank" rel="noreferrer">
              🏪 Tienda Odoo
            </a>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {isPrint ? (
        <div className="ltc-container">
          <PrintCover
            total={total}
            catCount={groupedForPrint.length}
            titleOverride={printTitle}
            subtitleOverride={printSubtitle}
          />
          {!(scope === "filtered" && printCatId > 0) && <PrintIndex categories={categories} />}
          {groupedForPrint.map((g, idx) => (
            <div key={g.name} className={idx === 0 ? "" : "print-break-before"} style={{ marginTop: 14 }}>
              <div className="ltc-printTitle">{g.name}</div>
              <div className="ltc-grid">
                {g.items.map((p) => (
                  <ProductCard key={p.id} p={p} isPrint={true} />
                ))}
              </div>
            </div>
          ))}
          <div className="print-only print-keep" style={{ marginTop: 16 }}>
            <div className="ltc-footerCard">
              <div style={{ fontWeight: 900 }}>{BRAND.name}</div>
              <div style={{ marginTop: 6, opacity: 0.8 }}>Pedidos: +51 988 694 721 • Envíos a todo el Perú</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="ltc-container">
          {isHome && (
            <>
              <Section title="Explora por categoría" subtitle="Encuentra rápido lo que necesitas.">
                <CategoryTiles categories={categories} onPick={(id) => setCatId(id)} anchorId="explorar" />
              </Section>

              <Section title="🆕 Recién llegados" subtitle="Lo nuevo que acaba de entrar al catálogo.">
                <div className="ltc-grid">
                  {newArrivals.map((p, i) => (
                    <ProductCard key={p.id} p={p} isPrint={false} onQuickView={setSelectedProduct} isNew={i < 6} />
                  ))}
                </div>
              </Section>

              <Section title="💰 Menos de S/ 50" subtitle="Alta rotación y regalos económicos.">
                <div className="ltc-grid">
                  {under50.map((p) => (
                    <ProductCard key={p.id} p={p} isPrint={false} onQuickView={setSelectedProduct} isNew={false} />
                  ))}
                </div>
              </Section>

              <Section title="🎁 Ideas para regalo" subtitle="Opciones rápidas para sorprender.">
                <div className="ltc-grid">
                  {giftIdeas.map((p) => (
                    <ProductCard key={p.id} p={p} isPrint={false} onQuickView={setSelectedProduct} isNew={false} />
                  ))}
                </div>
              </Section>
            </>
          )}

          <div id="explorar" style={{ marginTop: 28 }}>
            <div className="ltc-exploreCard">
              <div className="ltc-exploreTop">
                <div>
                  <div className="ltc-h2">{currentCatName}</div>
                  {catId > 0 && (
                    <button className="ltc-clearFilter" onClick={() => setCatId(0)}>
                      ← Volver a todos los productos
                    </button>
                  )}
                </div>
                <div className="ltc-exploreCount">
                  Mostrando <strong>{products.length}</strong> de <strong>{total}</strong> productos
                </div>
              </div>

              <div className="ltc-grid ltc-grid--animated" style={{ marginTop: 16 }}>
                {sortedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    p={p}
                    isPrint={false}
                    onQuickView={setSelectedProduct}
                    isNew={newIds.has(p.id)}
                  />
                ))}
              </div>

              {products.length === 0 && (
                <div className="ltc-emptyState">
                  <div className="ltc-emptyIcon">🔍</div>
                  <div className="ltc-emptyTitle">Sin resultados</div>
                  <div className="ltc-emptySub">Intenta con otra búsqueda o categoría.</div>
                </div>
              )}

              <div className="no-print ltc-loadMoreWrap">
                {products.length < total ? (
                  <button className="ltc-btnLoad" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? "⏳ Cargando..." : "Ver más productos"}
                  </button>
                ) : products.length > 0 ? (
                  <div className="ltc-endMsg">🎉 Has visto todos los productos</div>
                ) : null}
              </div>
            </div>
          </div>

          <footer className="ltc-footer no-print">
            <div className="ltc-footerInner">
              <div>
                <div className="ltc-h2">{BRAND.name}</div>
                <div className="ltc-footerSub">📦 Envíos a todo el Perú &nbsp;•&nbsp; 📲 +51 988 694 721</div>
              </div>
              <a
                className="ltc-btnWhatsTop"
                href={waLink("Hola 👋 Quiero comprar. ¿Me ayudas?")}
                target="_blank"
                rel="noreferrer"
              >
                🛒 Comprar por WhatsApp
              </a>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
