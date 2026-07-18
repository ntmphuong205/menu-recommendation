import { TAGS, type TagKey } from "../data/menu";
import { useI18n } from "../i18n/I18nContext";
import type { TranslationKey } from "../i18n/translations";

export function TagPill({ tag }: { tag: TagKey }) {
  const { t } = useI18n();
  const meta = TAGS[tag];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EFE9D8] text-[#5C5240] text-[11px] font-medium whitespace-nowrap">
      <span>{meta.emoji}</span>
      {t(`tag_${tag}` as TranslationKey)}
    </span>
  );
}
