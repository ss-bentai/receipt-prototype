import { ContactlessIcon } from "./icons";

/** The customer's card. Tapping it is the "pay" action. */
export function PaymentCard({
  raised,
  disabled,
  onTap,
}: {
  raised: boolean;
  disabled: boolean;
  onTap: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      aria-label="Tap card to pay"
      className={`relative z-10 block h-[150px] w-[240px] rounded-2xl bg-[linear-gradient(135deg,#2643a8_0%,#1a1f71_60%,#0f1350_100%)] p-5 text-left text-white shadow-xl transition-transform duration-500 ease-out enabled:cursor-pointer enabled:hover:-translate-y-1 disabled:cursor-default ${
        raised ? "-translate-y-24 rotate-[-4deg] scale-95" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="h-8 w-11 rounded-md bg-[linear-gradient(135deg,#f5d77a,#c9a227)]" />
        <ContactlessIcon className="h-6 w-6 text-white/80" />
      </div>
      <p className="mt-5 font-mono text-sm tracking-widest whitespace-nowrap text-white/90">
        4273 21•• •••• 3212
      </p>
      <p className="absolute right-5 bottom-3 text-2xl font-black tracking-tight italic">VISA</p>
    </button>
  );
}
