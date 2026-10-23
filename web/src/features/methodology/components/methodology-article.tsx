import { useTranslations } from "next-intl";
import { PageIntro } from "@/components/page-intro";
import { MethodologyScope } from "./methodology-scope";

const sections = ["sources", "alignment", "selection", "band", "sign", "caveats"] as const;

type Section = (typeof sections)[number];

function MethodologySection({ section }: { section: Section }) {
  const t = useTranslations("methodology");
  const paragraphs: string[] = t.raw(`${section}.body`);

  return (
    <section id={section} aria-labelledby={`${section}-title`} className="scroll-mt-24 border-t pt-8">
      <h2 id={`${section}-title`} className="text-lg font-semibold tracking-tight">
        {t(`${section}.title`)}
      </h2>
      <div className="mt-3 flex flex-col gap-3 text-[0.9375rem] leading-relaxed text-foreground/85">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {section === "alignment" && <p className="text-muted-foreground">{t("alignment.sensitivity")}</p>}
      </div>
    </section>
  );
}

export function MethodologyArticle() {
  const t = useTranslations("methodology");

  return (
    <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
      <nav aria-label={t("contents")} className="hidden lg:block">
        <div className="sticky top-24 flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">{t("contents")}</p>
          <ul className="flex flex-col gap-1 border-l">
            {sections.map((section) => (
              <li key={section}>
                <a
                  href={`#${section}`}
                  className="-ml-px block border-l border-transparent py-1 pl-3 text-sm text-muted-foreground transition-colors outline-none hover:border-foreground hover:text-foreground focus-visible:text-foreground focus-visible:underline"
                >
                  {t(`${section}.title`)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <article className="flex max-w-[68ch] flex-col gap-8">
        <PageIntro title={t("title")} description={t("intro")} />
        <section aria-label={t("scope.title")} className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">{t("scope.title")}</h2>
          <MethodologyScope />
        </section>
        {sections.map((section) => (
          <MethodologySection key={section} section={section} />
        ))}
      </article>
    </div>
  );
}
