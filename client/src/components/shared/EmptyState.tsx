import { Inbox } from 'lucide-react';

export default function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox className="h-12 w-12 text-neutral-300 mb-3" />
      <h3 className="text-lg font-medium text-neutral-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-neutral-500">{description}</p>}
    </div>
  );
}
