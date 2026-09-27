import type { BlogPost } from "@/types/content";

export const blogPosts: BlogPost[] = [
  {
    title: "İlk tam-stek tətbiqimi qurarkən",
    excerpt:
      "Qurduğum bir layihə, öyrəndiklərim və növbəti dəfə nəyi fərqli edəcəyim haqqında qısa yazı.",
    date: "2026-01-01",
    url: "#",
    codeSnippet: {
      filename: "server.ts",
      code: `export async function getUser(id: string) {
  // Cache first — the DB round trip was the slowest part of this route.
  const cached = await cache.get(\`user:\${id}\`);
  if (cached) return cached;

  const user = await db.users.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User not found");

  await cache.set(\`user:\${id}\`, user, { ttl: 60 });
  return user;
}`,
    },
  },
  {
    title: "Vebdən mobil developmentə keçid qeydlərim",
    excerpt:
      "Əsasən veblə işlədikdən sonra mobil developmenti mənimsəmək haqqında düşüncələr.",
    date: "2026-01-01",
    url: "#",
  },
  {
    title: "Backend API-larımı niyə belə strukturlaşdırıram",
    excerpt: "Standart olaraq istifadə etdiyim API arxitektura nümunələrinə və səbəbinə baxış.",
    date: "2026-01-01",
    url: "#",
  },
];
