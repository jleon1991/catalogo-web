// api/ping.js
export default function handler(req, res) {
  res.setHeader("X-From", "catalogo-web/api");
  res.status(200).json({
    ok: true,
    whereAmI: "catalogo-web/api",
    time: new Date().toISOString(),
  });
}