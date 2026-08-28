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
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
          activeSlug === null
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
        }`}
      >
        All
      </button>
      {groups.map((group) => (
        <button
          key={group.slug}
          onClick={() => onSelect(group.slug)}
          className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
            activeSlug === group.slug
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
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
