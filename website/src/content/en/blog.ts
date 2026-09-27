import type { BlogPost } from "@/types/content";

export const blogPosts: BlogPost[] = [
  {
    title: "Building my first full-stack app",
    excerpt:
      "A short write-up about a project I built, what I learned, and what I'd do differently next time.",
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
    title: "Notes on going from web to mobile development",
    excerpt:
      "Thoughts on picking up mobile development after working mostly on the web.",
    date: "2026-01-01",
    url: "#",
  },
  {
    title: "Why I structure my backend APIs this way",
    excerpt: "A look at the API architecture patterns I default to and why.",
    date: "2026-01-01",
    url: "#",
  },
];
