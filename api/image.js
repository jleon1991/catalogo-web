export default async function handler(req, res) {
  try {
    const url = req.query.url;

    if (!url || typeof url !== "string") {
      return res.status(400).send("Missing url");
    }

    if (!/^https?:\/\//i.test(url)) {
      return res.status(400).send("Invalid url");
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "CatalogoWeb/1.0",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return res.status(response.status).send(`Upstream error ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");

    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(500).send("Proxy error");
  }
}