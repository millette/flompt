import { getPostBySlug, getAllLocaleSlugs } from "@/lib/posts";
import { formatDate } from "@/lib/formatDate";
import { getTranslations } from "@/i18n/translations";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  return getAllLocaleSlugs().map(({ locale, slug }) => ({ locale, slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPostBySlug(slug, locale as Locale);
  if (!post) return { title: "Not found" };

  return {
    title: `${post.title} | flompt blog`,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const t = getTranslations(locale as Locale);
  const post = await getPostBySlug(slug, locale as Locale);

  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <Link
        href={`/${locale}`}
        className="inline-flex items-center text-sm transition-colors mb-8"
        style={{ color: "var(--text-dim)" }}
      >
        {t.post.backToArticles}
      </Link>

      <header className="mb-12">
        <div className="flex flex-col gap-2 mb-4">
          <time className="text-sm" style={{ color: "var(--text-dim)" }} dateTime={post.date}>
            {formatDate(post.date, locale as Locale)}
          </time>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-px rounded-full whitespace-nowrap"
                  style={{
                    border: "1px solid var(--border-medium)",
                    color: "var(--text-muted)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <h1 className="text-4xl font-bold tracking-tight leading-tight">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-4 text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {post.excerpt}
          </p>
        )}
      </header>

      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />
    </article>
  );
}
