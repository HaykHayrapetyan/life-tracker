/** Direction / momentum labels for positive habits (consecutive days checked). */
export function positiveMomentumHeadline(days: number): string {
  if (days <= 0) return "Beginning";
  if (days <= 3) return "Building ↗";
  if (days <= 7) return "Consistent ↗";
  if (days <= 14) return "Stable ↗";
  if (days <= 30) return "Strong ↗";
  return "Integrated ↗";
}

/** Recovery-oriented labels for negative habits (consecutive days without the slip checked). */
export function negativeRecoveryHeadline(days: number): string {
  if (days <= 0) return "Need to start again";
  if (days <= 3) return "Recovering ↓";
  if (days <= 7) return "Regaining ↓";
  if (days <= 14) return "Stabilizing ↓";
  if (days <= 30) return "Strong ↓";
  return "Freeing ↓";
}
