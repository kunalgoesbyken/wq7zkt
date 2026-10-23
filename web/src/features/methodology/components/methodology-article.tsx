import { useTranslations } from "next-intl";
import { PageIntro } from "@/components/page-intro";
import { MethodologyScope } from "./methodology-scope";

const steps = ["sources", "alignment", "selection", "errors", "band", "demand"] as const;

type Step = (typeof steps)[number] | "caveats";

function Paragraphs({ step }: { step: Step }) {
  const t = useTranslations("methodology");
  const paragraphs: string[] = t.raw(`${step}.body`);

  return (
    <div className="flex flex-col gap-3 text-[0.9375rem] leading-relaxed text-pretty">
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}

export function MethodologyArticle() {
  const t = useTranslations("methodology");

  return (
    <article className="flex max-w-[70ch] flex-col gap-12">
      <PageIntro title={t("title")} description={t("intro")} />
      <section aria-labelledby="scope-title" className="flex flex-col gap-4">
        <h2 id="scope-title" className="text-[1.0625rem] font-semibold tracking-tight">
          {t("scope.title")}
        </h2>
        <MethodologyScope />
      </section>
      <section aria-labelledby="steps-title" className="flex flex-col gap-6">
        <h2 id="steps-title" className="text-[1.0625rem] font-semibold tracking-tight">
          {t("stepsTitle")}
        </h2>
        <ol className="flex flex-col gap-10">
          {steps.map((step, index) => (
            <li key={step} id={step} className="grid scroll-mt-24 grid-cols-[2rem_minmax(0,1fr)] gap-x-3">
              <span aria-hidden className="figures pt-px text-[1.0625rem] font-semibold text-forecast">
                {index + 1}
              </span>
              <div className="flex flex-col gap-3">
                <h3 className="text-[1.0625rem] font-semibold tracking-tight text-balance">{t(`${step}.title`)}</h3>
                <Paragraphs step={step} />
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section aria-labelledby="caveats-title" className="flex flex-col gap-3 border-t pt-10">
        <h2 id="caveats-title" className="text-[1.0625rem] font-semibold tracking-tight">
          {t("caveats.title")}
        </h2>
        <Paragraphs step="caveats" />
      </section>
    </article>
  );
}
