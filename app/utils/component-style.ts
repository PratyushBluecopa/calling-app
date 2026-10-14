// Unprefixed style tokens for component composition.
// These get auto-prefixed by style-drivers.ts before being applied.
export const styles = {
  card: "rounded-lg border bg-card text-card-foreground shadow-sm",
  cardHeader: "flex flex-col space-y-1.5 p-6",
  cardContent: "p-6 pt-0",
} as const;
