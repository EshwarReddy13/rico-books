/** Build card surface styles from a #RRGGBB accent (for DB-driven category colors). */
export function mainCategoryCardStyles(colorHex: string, active: boolean) {
  return {
    backgroundColor: active
      ? `color-mix(in srgb, ${colorHex} 38%, white)`
      : `color-mix(in srgb, ${colorHex} 22%, white)`,
    borderColor: active ? colorHex : "transparent",
    accentColor: colorHex,
  } as const;
}

export function subCategoryBarStyle(colorHex: string) {
  return { backgroundColor: colorHex };
}
