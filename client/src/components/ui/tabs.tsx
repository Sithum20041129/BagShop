import { cn } from '@/lib/utils';

export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap gap-1 border-b border-[#E7E5E4]', className)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              'px-4 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors border-b-2 -mb-[1px] cursor-pointer',
              active
                ? 'border-[#1C1917] text-[#1C1917]'
                : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-[10px] text-[#78716C] tabular-nums">
                ({tab.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
