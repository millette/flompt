import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getTranslations } from "@/i18n/translations";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale as Locale);
  return {
    title: t.about.pageTitle,
    description: t.about.paragraph1,
  };
}

const technologies = [
  "TypeScript",
  "React",
  "Next.js",
  "Python",
  "FastAPI",
  "Tailwind CSS",
  "AI / LLM",
  "Prompt Engineering",
];

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  const t = getTranslations(locale as Locale);

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight mb-8">{t.about.title}</h1>
      <div className="max-w-none space-y-6">
        <p className="text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {t.about.paragraph1}
        </p>
        <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {t.about.paragraph2}
        </p>
        <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {t.about.paragraph3}
        </p>

        <div
          className="mt-12 p-6 rounded-lg"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <h2 className="text-lg font-semibold mb-4">{t.about.techTitle}</h2>
          <div className="flex flex-wrap gap-2">
            {technologies.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 text-sm rounded-full"
                style={{
                  border: "1px solid var(--border-medium)",
                  color: "var(--text-muted)",
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
