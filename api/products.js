// api/products.js
import xmlrpc from "xmlrpc";

function rpcCall(client, method, params) {
  return new Promise((resolve, reject) => {
    client.methodCall(method, params, (err, value) => {
      if (err) reject(err);
      else resolve(value);
    });
  });
}

export default async function handler(req, res) {
  try {
    const { ODOO_URL, ODOO_DB, ODOO_USER, ODOO_PASS } = process.env;
    if (!ODOO_URL || !ODOO_DB || !ODOO_USER || !ODOO_PASS) {
      return res.status(500).json({ error: "Missing Odoo env vars" });
    }

    const limit  = Math.min(parseInt(req.query.limit ?? "60", 10), 120);
    const offset = Math.max(parseInt(req.query.offset ?? "0", 10), 0);
    const q      = (req.query.q || "").trim();
    const categId = req.query.categ_id !== undefined ? parseInt(req.query.categ_id, 10) : null;

    const common = xmlrpc.createClient({ url: `${ODOO_URL}/xmlrpc/2/common` });
    const object = xmlrpc.createClient({ url: `${ODOO_URL}/xmlrpc/2/object` });

    const uid = await rpcCall(common, "authenticate", [ODOO_DB, ODOO_USER, ODOO_PASS, {}]);
    if (!uid) return res.status(401).json({ error: "Odoo auth failed" });

    const domain = [["website_published", "=", true]];
    if (q) domain.push(["name", "ilike", q]);
    if (Number.isInteger(categId) && categId > 0) domain.push(["categ_id", "=", categId]);

    const total = await rpcCall(object, "execute_kw", [
      ODOO_DB, uid, ODOO_PASS,
      "product.template", "search_count", [domain]
    ]);

    const ids = await rpcCall(object, "execute_kw", [
      ODOO_DB, uid, ODOO_PASS,
      "product.template", "search",
      [domain],
      { limit, offset, order: "id desc" }
    ]);

    // ⚠️ Nada de "__last_update"
    const fields = ["id", "name", "list_price", "categ_id", "write_date"];
    const recs = await rpcCall(object, "execute_kw", [
      ODOO_DB, uid, ODOO_PASS,
      "product.template", "read",
      [ids, fields]
    ]);

    const WIDTH  = 600;
    const HEIGHT = 450;

    const products = recs.map((r) => {
      const unique = encodeURIComponent(r.write_date || "");
      const imgUrl =
        `${ODOO_URL}/web/image?model=product.template&id=${r.id}` +
        `&field=image_1920&width=${WIDTH}&height=${HEIGHT}` +
        (unique ? `&unique=${unique}` : "");
      return {
        id: r.id,
        name: r.name,
        list_price: r.list_price,
        categ: Array.isArray(r.categ_id) && r.categ_id.length >= 2 ? r.categ_id[1] : "Otros",
        image: imgUrl,
      };
    });

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=86400");
    return res.status(200).json({ total, limit, offset, items: products });
  } catch (err) {
    console.error("[/api/products] error:", err?.message, err?.stack);
    return res.status(500).json({ error: "Internal error", detail: err?.message });
  }
}
