// Class names shared by links, buttons and form fields, so every screen looks the same.

export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50";

export const dangerButton =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-50";

export const textLink = "font-semibold text-accent underline-offset-4 hover:underline";

export const inputField =
  "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground transition placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
