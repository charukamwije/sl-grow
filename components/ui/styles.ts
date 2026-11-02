// Shared Tailwind class strings, so buttons and cards look the same everywhere

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2";

export const btnPrimary = `inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60 ${focusRing}`;

export const btnSecondary = `inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 ring-1 ring-gray-200 transition hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 ${focusRing}`;

export const btnGhost = `inline-flex items-center justify-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 ${focusRing}`;

export const btnSmall = `inline-flex items-center justify-center rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-95 ${focusRing}`;

export const btnDanger = `inline-flex items-center justify-center gap-2 rounded-full bg-red-50 px-5 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60 ${focusRing}`;

export const card =
  "rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6";

export const chip = (active: boolean) =>
  `whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${focusRing} ${
    active
      ? "bg-emerald-600 text-white shadow-sm"
      : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
  }`;

export const input = `w-full rounded-2xl border-0 bg-gray-50 px-4 py-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 transition placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500`;

export const label = "mb-1.5 block text-sm font-medium text-gray-700";

export const heading = "text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl";

export const subheading = "mb-4 text-lg font-semibold text-gray-900";

export const muted = "text-sm text-gray-500";

export const eyebrow =
  "text-xs font-semibold uppercase tracking-wider text-emerald-700";
