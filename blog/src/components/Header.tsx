"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { getTranslations } from "@/i18n/translations";

export default function Header({ locale }: { locale: Locale }) {
  const t = getTranslations(locale);
  const pathname = usePathname();
  const otherLocale: Locale = locale === "fr" ? "en" : "fr";
  const switchLocalePath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{
        height: "var(--header-height)",
        backgroundColor: "var(--bg-header)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div className="max-w-3xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Brand */}
        <Link href={`/${locale}`} className="flex items-center gap-1.5">
          <span
            style={{
              fontFamily: "var(--font-handwritten), cursive",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--accent)",
              textShadow: "0 0 10px var(--accent-glow)",
            }}
          >
            flompt
          </span>
          <span
            style={{
              fontFamily: "var(--font-handwritten), cursive",
              fontSize: "1.5rem",
              color: "var(--text-muted)",
            }}
          >
            blog
          </span>
        </Link>

        {/* Nav + Locale */}
        <div className="flex items-center gap-5">
          <nav className="flex items-center gap-5">
            <Link
              href={`/${locale}`}
              className="text-sm transition-colors hover:opacity-80"
              style={{ color: "var(--text-muted)" }}
            >
              {t.header.articles}
            </Link>
            <Link
              href={`/${locale}/about`}
              className="text-sm transition-colors hover:opacity-80"
              style={{ color: "var(--text-muted)" }}
            >
              {t.header.about}
            </Link>
            <a
              href="https://flompt.dev"
              className="text-sm font-medium transition-all hover:brightness-110"
              style={{
                color: "var(--accent)",
                textShadow: "0 0 8px var(--accent-glow)",
              }}
            >
              Home
            </a>
          </nav>

          {/* Locale toggle — shows CURRENT locale */}
          <Link
            href={switchLocalePath}
            className="inline-flex items-center justify-center uppercase transition-colors hover:opacity-80"
            style={{
              height: "30px",
              fontSize: "11px",
              fontFamily: "monospace",
              fontWeight: 700,
              padding: "0 10px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--border-medium)",
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
            }}
          >
            {locale}
          </Link>
        </div>
      </div>
    </header>
  );
}
