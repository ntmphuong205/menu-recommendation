import { TAGS, type TagKey } from "../data/menu";

export function TagPill({ tag }: { tag: TagKey }) {
  const meta = TAGS[tag];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EFE9D8] text-[#5C5240] text-[11px] font-medium whitespace-nowrap">
      <span>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}
