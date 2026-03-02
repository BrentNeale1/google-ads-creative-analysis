import { FileText, Key, Play, BarChart3 } from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Set up Google Ads Script",
    description:
      "Copy the provided script into your Google Ads account to begin collecting creative performance data.",
    icon: FileText,
  },
  {
    number: 2,
    title: "Configure API Key",
    description:
      "Add your unique API key to the script configuration so the app can securely receive your data.",
    icon: Key,
  },
  {
    number: 3,
    title: "Push First Data",
    description:
      "Run the script manually or wait for the daily schedule. Data will be analysed automatically.",
    icon: Play,
  },
  {
    number: 4,
    title: "View Your Dashboard",
    description:
      "Performance data will appear here automatically. Surface what's working, what's not, and what to test next.",
    icon: BarChart3,
  },
];

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto pt-8 lg:pt-16 pl-10 lg:pl-0">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Welcome to Creative Analyser
        </h1>
        <p className="text-base text-gray-500">
          Surface what&apos;s working, what&apos;s not, and what to test next
        </p>
      </div>

      {/* Status badge */}
      <div className="mb-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm text-brand-grey border border-surface-gridline">
          <span className="h-2 w-2 rounded-full bg-brand-grey" />
          No data received yet
        </span>
      </div>

      {/* Setup steps */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Getting started
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="bg-white rounded-xl border border-surface-gridline p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-brand-blue/10 text-brand-blue text-sm font-semibold">
                    {step.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={15} className="text-brand-grey flex-shrink-0" />
                      <h3 className="text-sm font-medium text-gray-900">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
