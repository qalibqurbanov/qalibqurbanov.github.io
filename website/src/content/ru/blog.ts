import type { BlogPost } from "@/types/content";

export const blogPosts: BlogPost[] = [
  {
    title: "Создание моего первого full-stack приложения",
    excerpt:
      "Короткий рассказ о проекте, который я создал, чему научился и что сделал бы иначе в следующий раз.",
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
    title: "Заметки о переходе от веб- к мобильной разработке",
    excerpt:
      "Мысли об освоении мобильной разработки после работы преимущественно над вебом.",
    date: "2026-01-01",
    url: "#",
  },
  {
    title: "Почему я структурирую backend API именно так",
    excerpt: "Обзор архитектурных паттернов API, которые я использую по умолчанию, и почему.",
    date: "2026-01-01",
    url: "#",
  },
];
