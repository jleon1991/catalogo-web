// api/categories.js
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

    const common = xmlrpc.createClient({ url: `${ODOO_URL}/xmlrpc/2/common` });
    const object = xmlrpc.createClient({ url: `${ODOO_URL}/xmlrpc/2/object` });

    const uid = await rpcCall(common, "authenticate", [ODOO_DB, ODOO_USER, ODOO_PASS, {}]);
    if (!uid) return res.status(401).json({ error: "Odoo auth failed" });

    // Agrupar por categoría solo entre publicados
    const domain = [["website_published", "=", true]];
    const groups = await rpcCall(object, "execute_kw", [
      ODOO_DB, uid, ODOO_PASS,
      "product.template", "read_group",
      [domain, ["categ_id"], ["categ_id"]],
    ]);

    // Normaliza: { id, name, count }
    const categories = groups
      .filter(g => Array.isArray(g.categ_id) && g.categ_id.length >= 2)
      .map(g => ({
        id: g.categ_id[0],
        name: g.categ_id[1],
        count: g.categ_id_count || 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=86400");
    return res.status(200).json({ items: categories });
  } catch (err) {
    console.error("[/api/categories] error:", err?.message, err?.stack);
    return res.status(500).json({ error: "Internal error", detail: err?.message });
  }
}