// api/products.js
import xmlrpc from "xmlrpc";

/** Helper para llamar métodos XML-RPC como Promesa */
function rpcCall(client, method, params) {
  return new Promise((resolve, reject) => {
    client.methodCall(method, params, (err, value) => {
      if (err) reject(err);
      else resolve(value);
    });
  });
}

/** Vercel serverless function (Node.js) */
export default async function handler(req, res) {
  try {
    const { ODOO_URL, ODOO_DB, ODOO_USER, ODOO_PASS } = process.env;
    if (!ODOO_URL || !ODOO_DB || !ODOO_USER || !ODOO_PASS) {
      return res.status(500).json({ error: "Missing Odoo env vars" });
    }

    // Clientes XML-RPC para endpoints de Odoo
    const common = xmlrpc.createClient({ url: `${ODOO_URL}/xmlrpc/2/common` });
    const object = xmlrpc.createClient({ url: `${ODOO_URL}/xmlrpc/2/object` });

    // 1) Autenticación
    const uid = await rpcCall(common, "authenticate", [ODOO_DB, ODOO_USER, ODOO_PASS, {}]);
    if (!uid) return res.status(401).json({ error: "Odoo auth failed" });

    // 2) Buscar productos publicados en web
    const ids = await rpcCall(object, "execute_kw", [
      ODOO_DB,
      uid,
      ODOO_PASS,
      "product.template",
      "search",
      [[["website_published", "=", true]]],
    ]);

    // 3) Leer campos necesarios
    const fields = ["id", "name", "list_price", "image_1920", "categ_id"];
    const recs = await rpcCall(object, "execute_kw", [
      ODOO_DB,
      uid,
      ODOO_PASS,
      "product.template",
      "read",
      [ids, fields],
    ]);

    // 4) Mapear a formato del catálogo
    const products = recs.map((r) => ({
      id: r.id,
      name: r.name,
      list_price: r.list_price,
      categ: r.categ_id ? r.categ_id[1] : "Otros",
      image: r.image_1920 ? `data:image/jpeg;base64,${r.image_1920}` : null,
    }));

    // Cache en CDN 1 hora + SWR
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json(products);
  } catch (err) {
    console.error("[/api/products] error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
