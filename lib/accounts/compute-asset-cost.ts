/** Total asset cost = down payments linked to the asset + loan amount financed. */
export function computeAssetCostPaise(input: {
  amountFinancedPaise: number | null;
  downPaymentTotalPaise: number;
  openingValuePaise: number;
}): { costPaise: number; isComputed: boolean } {
  const financed = input.amountFinancedPaise ?? 0;
  const down = input.downPaymentTotalPaise;

  if (financed > 0 || down > 0) {
    return {
      costPaise: financed + down,
      isComputed: true,
    };
  }

  return {
    costPaise: input.openingValuePaise,
    isComputed: false,
  };
}
