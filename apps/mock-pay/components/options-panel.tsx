import {
  CAMPAIGN_KEYS,
  CAMPAIGNS,
  PROVIDERS,
  type PayOptions,
  type ProviderKey,
} from "@/lib/options";

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

function Switch({
  label,
  description,
  checked,
  onChange,
  children,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <label className="flex cursor-pointer items-center justify-between gap-4 p-3.5">
        <span>
          <span className="block font-medium">{label}</span>
          <span className="mt-0.5 block text-sm text-slate-500">{description}</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="relative h-7 w-12 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-600 peer-focus-visible:ring-offset-2 after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5"
        />
      </label>
      {children}
    </div>
  );
}

/** Receipt options for the next sale. Disabled while a payment is in flight. */
export function OptionsPanel({
  options,
  campaignChoice,
  receiptsUrl,
  disabled,
  onChange,
  onCampaignChoice,
}: {
  options: PayOptions;
  /** The campaign type picked in the dropdown, kept while the switch is off. */
  campaignChoice: string;
  /** Origin of the receipts app, which serves the provider logos. */
  receiptsUrl: string;
  disabled: boolean;
  onChange: (options: PayOptions) => void;
  onCampaignChoice: (key: string) => void;
}) {
  const set = <K extends keyof PayOptions>(key: K, value: PayOptions[K]) =>
    onChange({ ...options, [key]: value });

  return (
    <fieldset disabled={disabled} className="space-y-7 disabled:opacity-60">
      <Section title="Payment provider">
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(PROVIDERS) as ProviderKey[]).map((key) => (
            <label
              key={key}
              className="flex h-20 cursor-pointer items-center justify-center rounded-xl border-2 border-slate-200 bg-white p-3 transition has-checked:border-emerald-500 has-checked:bg-emerald-50 has-focus-visible:ring-2 has-focus-visible:ring-emerald-600"
            >
              <input
                type="radio"
                name="provider"
                checked={options.provider === key}
                onChange={() => set("provider", key)}
                className="sr-only"
              />
              <img
                src={`${receiptsUrl}/providers/${key}.png`}
                alt={PROVIDERS[key].label}
                className="max-h-12 max-w-full object-contain"
              />
            </label>
          ))}
        </div>
      </Section>

      <Section title="Campaign">
        <Switch
          label="Show campaign"
          description="Adds a promotion below the total"
          checked={options.campaign !== null}
          onChange={(on) => set("campaign", on ? campaignChoice : null)}
        >
          {options.campaign !== null && (
            <div className="space-y-2 border-t border-slate-100 p-3">
              {CAMPAIGN_KEYS.map((key) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 transition has-checked:border-emerald-500 has-checked:bg-emerald-50"
                >
                  <input
                    type="radio"
                    name="campaign"
                    checked={options.campaign === key}
                    onChange={() => {
                      onCampaignChoice(key);
                      set("campaign", key);
                    }}
                    className="mt-1 accent-emerald-600"
                  />
                  <span>
                    <span className="block font-medium">{CAMPAIGNS[key].label}</span>
                    <span className="mt-0.5 block text-sm text-slate-500">
                      {CAMPAIGNS[key].description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </Switch>
      </Section>

      <Section title="Show itemised purchase">
        <Switch
          label="Send itemised purchase"
          description="Adds the items, subtotal and 6% SST"
          checked={options.itemized}
          onChange={(on) => set("itemized", on)}
        />
      </Section>
    </fieldset>
  );
}

/** One-line summary of the chosen options, for the collapsed mobile bar. */
export function summarizeOptions(options: PayOptions) {
  return [
    PROVIDERS[options.provider].label,
    options.campaign ? CAMPAIGNS[options.campaign].label : "No campaign",
    options.itemized ? "Itemised" : "Amount only",
  ].join(" · ");
}
