import type { Locale } from "./config";

export interface Translations {
  header: {
    brand: string;
    articles: string;
    about: string;
    accessApp: string;
  };
  home: {
    subtitle: string;
    latestArticles: string;
    noArticles: string;
  };
  post: {
    backToArticles: string;
    readMore: string;
  };
  about: {
    pageTitle: string;
    title: string;
    paragraph1: string;
    paragraph2: string;
    paragraph3: string;
    techTitle: string;
  };
  footer: {
    copyright: string;
    builtWith: string;
  };
}

const fr: Translations = {
  header: {
    brand: "flompt blog",
    articles: "Articles",
    about: "\u00c0 propos",
    accessApp: "Access App",
  },
  home: {
    subtitle:
      "Prompt engineering, construction visuelle de prompts et astuces IA.",
    latestArticles: "Derniers articles",
    noArticles: "Aucun article pour le moment.",
  },
  post: {
    backToArticles: "\u2190 Retour aux articles",
    readMore: "Lire la suite",
  },
  about: {
    pageTitle: "\u00c0 propos | flompt blog",
    title: "\u00c0 propos",
    paragraph1:
      "flompt est un outil de construction visuelle de prompts. Au lieu d\u2019\u00e9crire un prompt en texte brut, vous le d\u00e9composez en blocs visuels \u2014 r\u00f4le, contexte, objectif, contraintes, exemples \u2014 que vous assemblez comme un flowchart.",
    paragraph2:
      "Ce blog explore le prompt engineering, partage des techniques d\u2019optimisation et montre comment la construction visuelle transforme la fa\u00e7on dont on interagit avec l\u2019IA.",
    paragraph3:
      "Que vous soyez d\u00e9butant ou expert, vous trouverez ici des guides pratiques pour tirer le meilleur de vos prompts.",
    techTitle: "Technologies",
  },
  footer: {
    copyright: "\u00a9 {year} flompt. Tous droits r\u00e9serv\u00e9s.",
    builtWith: "Construit avec",
  },
};

const en: Translations = {
  header: {
    brand: "flompt blog",
    articles: "Articles",
    about: "About",
    accessApp: "Access App",
  },
  home: {
    subtitle:
      "Prompt engineering, visual prompt building, and AI tips.",
    latestArticles: "Latest articles",
    noArticles: "No articles yet.",
  },
  post: {
    backToArticles: "\u2190 Back to articles",
    readMore: "Read more",
  },
  about: {
    pageTitle: "About | flompt blog",
    title: "About",
    paragraph1:
      "flompt is a visual prompt building tool. Instead of writing a prompt as raw text, you decompose it into visual blocks \u2014 role, context, objective, constraints, examples \u2014 and assemble them like a flowchart.",
    paragraph2:
      "This blog explores prompt engineering, shares optimization techniques, and shows how visual building transforms the way we interact with AI.",
    paragraph3:
      "Whether you\u2019re a beginner or an expert, you\u2019ll find practical guides here to get the most out of your prompts.",
    techTitle: "Technologies",
  },
  footer: {
    copyright: "\u00a9 {year} flompt. All rights reserved.",
    builtWith: "Built with",
  },
};

const translations: Record<Locale, Translations> = { fr, en };

export function getTranslations(locale: Locale): Translations {
  return translations[locale];
}
