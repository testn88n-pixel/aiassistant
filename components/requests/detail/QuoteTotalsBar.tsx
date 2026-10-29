import { formatNumber } from "@/lib/format";

interface QuoteTotalsBarProps {
  totalHebergement: number;
  totalSeminaire: number;
  totalFb: number;
  totalDevis: number;
  currency?: string;
}

export function QuoteTotalsBar({
  totalHebergement,
  totalSeminaire,
  totalFb,
  totalDevis,
  currency = "€",
}: QuoteTotalsBarProps) {
  return (
    <div className="surface-card p-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
        <div className="pt-2 sm:pt-0 sm:px-3 text-center sm:text-left">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Hébergement
          </span>
          <span className="text-base font-semibold text-foreground">
            {formatNumber(totalHebergement)} {currency}
          </span>
        </div>
        <div className="pt-2 sm:pt-0 sm:px-3 text-center sm:text-left">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Séminaire
          </span>
          <span className="text-base font-semibold text-foreground">
            {formatNumber(totalSeminaire)} {currency}
          </span>
        </div>
        <div className="pt-2 sm:pt-0 sm:px-3 text-center sm:text-left">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Restauration
          </span>
          <span className="text-base font-semibold text-foreground">
            {formatNumber(totalFb)} {currency}
          </span>
        </div>
        <div className="pt-2 sm:pt-0 sm:px-3 text-center sm:text-right bg-brass-soft/40 -m-2 p-3 rounded-md border border-brass/20">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-brass">
            Total devis estimé
          </span>
          <span className="text-lg font-bold text-foreground">
            {formatNumber(totalDevis)} {currency}
          </span>
        </div>
      </div>
    </div>
  );
}
