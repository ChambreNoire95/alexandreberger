/** Convertit une URL YouTube/Vimeo en URL d'embed ; renvoie l'URL telle quelle pour les autres plateformes (Vidéas...). */
export function urlEmbed(url: string) {
  try {
    const u = new URL(url);
    const hote = u.hostname.replace(/^www\./, "");
    if (hote === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (hote === "youtube.com" || hote === "m.youtube.com") {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      if (u.pathname.startsWith("/shorts/")) return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
      return url;
    }
    if (hote === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }
    return url;
  } catch {
    return url;
  }
}
