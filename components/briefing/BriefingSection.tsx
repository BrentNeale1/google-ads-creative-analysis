import type { ElementType, ReactNode } from "react";

interface BriefingSectionProps {
  /** Section title */
  title: string;
  /** Lucide icon component */
  icon: ElementType;
  /** Section content */
  children: ReactNode;
  /** Optional count badge next to the title */
  count?: number;
}

/**
 * Card section for the Monday Briefing page.
 * Renders a header with icon, title, and optional count badge,
 * plus a children slot for section-specific content.
 */
export const BriefingSection = ({
  title,
  icon: Icon,
  children,
  count,
}: BriefingSectionProps) => {
  return (
    <div className="bg-white border border-[#E8EAED] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E8EAED]">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-brand-blue/10 text-brand-blue">
          <Icon size={18} />
        </div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {count !== undefined && count > 0 && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#EA4335]/10 text-[#EA4335] text-xs font-medium">
            {count}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
};
