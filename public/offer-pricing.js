export function normalizedInstallments(value, maximum = 21) {
  return Math.min(Math.max(1, Number(maximum) || 21), Math.max(1, Number(value) || 1));
}

export function calculateInstallmentTotalCents(totalCents, installments, surchargePartsPerMillion = {}) {
  const total = Math.max(0, Number(totalCents) || 0);
  const count = normalizedInstallments(installments, 21);
  if (count <= 12) return total;
  const surcharge = Math.max(0, Number(surchargePartsPerMillion?.[count]) || 0);
  return Math.round(total * (1000000 + surcharge) / 1000000);
}

export function calculateInstallmentPriceCents(totalCents, installments, surchargePartsPerMillion = {}) {
  const count = normalizedInstallments(installments, 21);
  return Math.round(calculateInstallmentTotalCents(totalCents, count, surchargePartsPerMillion) / count);
}
