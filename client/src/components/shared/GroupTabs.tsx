interface GroupTab {
  slug: string;
  label: string;
  count?: number;
}

interface GroupTabsProps {
  groups: GroupTab[];
  activeSlug: string | null;
  onSelect: (slug: string | null) => void;
}

export default function GroupTabs({ groups, activeSlug, onSelect }: GroupTabsProps) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-neutral-200">
      <button
        onClick={() => onSelect(null)}
        className={`pb-3 text-xs font-semibold uppercase tracking-[0.2em] border-b transition ${
          activeSlug === null
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-neutral-400 hover:text-neutral-900'
        }`}
      >
        All
      </button>
      {groups.map((group) => (
        <button
          key={group.slug}
          onClick={() => onSelect(group.slug)}
          className={`pb-3 text-xs font-semibold uppercase tracking-[0.2em] border-b transition ${
            activeSlug === group.slug
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-neutral-400 hover:text-neutral-900'
          }`}
        >
          {group.label}
          {group.count !== undefined && (
            <span className="ml-1 text-xs opacity-70">({group.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}