import { getAllPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import { getTranslations } from "@/i18n/translations";
import type { Locale } from "@/i18n/config";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale as Locale);
  return {
    title: `${t.home.latestArticles} | flompt blog`,
    description: t.home.subtitle,
  };
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  const t = getTranslations(locale as Locale);
  const posts = getAllPosts(locale as Locale);

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <section>
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-6"
          style={{ color: "var(--text-dim)" }}
        >
          {t.home.latestArticles}
        </h2>
        <div className="flex flex-col gap-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.slug} post={post} locale={locale as Locale} />
            ))
          ) : (
            <p className="py-8" style={{ color: "var(--text-muted)" }}>
              {t.home.noArticles}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
