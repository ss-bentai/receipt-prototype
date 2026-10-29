import { CAMPAIGNS, THEMES, type CampaignKey, type PayOptions, type ThemeKey } from "@/lib/options";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2.5">
      <legend className="mb-2.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

/** Receipt options for the next sale. Disabled while a payment is in flight. */
export function OptionsPanel({
  options,
  disabled,
  onChange,
}: {
  options: PayOptions;
  disabled: boolean;
  onChange: (options: PayOptions) => void;
}) {
  const set = <K extends keyof PayOptions>(key: K, value: PayOptions[K]) =>
    onChange({ ...options, [key]: value });

  return (
    <fieldset disabled={disabled} className="space-y-7 disabled:opacity-60">
      <Section title="Campaign">
        {(Object.keys(CAMPAIGNS) as CampaignKey[]).map((key) => {
          const { label, campaign } = CAMPAIGNS[key];
          return (
            <label
              key={key}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition has-checked:border-emerald-500 has-checked:bg-emerald-50"
            >
              <input
                type="radio"
                name="campaign"
                checked={options.campaign === key}
                onChange={() => set("campaign", key)}
                className="mt-1 accent-emerald-600"
              />
              <span>
                <span className="block font-medium">{label}</span>
                {campaign && (
                  <span className="mt-0.5 block text-sm text-slate-500">{campaign.body}</span>
                )}
              </span>
            </label>
          );
        })}
      </Section>

      <Section title="Show itemised purchase">
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3.5">
          <span>
            <span className="block font-medium">Send itemised purchase</span>
            <span className="mt-0.5 block text-sm text-slate-500">
              Adds sample items, subtotal and 6% SST
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={options.itemized}
            onChange={(e) => set("itemized", e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="relative h-7 w-12 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-600 peer-focus-visible:ring-offset-2 after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5"
          />
        </label>
      </Section>

      <Section title="Receipt colour">
        <div className="flex flex-wrap gap-3">
          {(Object.keys(THEMES) as ThemeKey[]).map((key) => {
            const t = THEMES[key];
            return (
              <label key={key} className="cursor-pointer" title={t.label}>
                <input
                  type="radio"
                  name="theme"
                  checked={options.theme === key}
                  onChange={() => set("theme", key)}
                  className="peer sr-only"
                  aria-label={t.label}
                />
                <span
                  aria-hidden
                  className="block h-11 w-11 rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-slate-50 transition peer-checked:ring-slate-900 peer-focus-visible:ring-emerald-600"
                  style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                />
              </label>
            );
          })}
        </div>
        <p className="text-sm text-slate-500">{THEMES[options.theme].label}</p>
      </Section>
    </fieldset>
  );
}

/** One-line summary of the chosen options, for the collapsed mobile bar. */
export function summarizeOptions(options: PayOptions) {
  return [
    options.campaign === "none" ? "No campaign" : CAMPAIGNS[options.campaign].label,
    options.itemized ? "Itemised" : "Amount only",
    THEMES[options.theme].label,
  ].join(" · ");
}
