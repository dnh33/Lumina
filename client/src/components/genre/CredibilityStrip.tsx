export interface Credibility {
  distributor?: string | null;
  streaming?: boolean | null;
  consensus?: string | null;
  stance?: string | null;
}

interface Props {
  cred: Credibility;
}

/**
 * F4 Credibility/source framing (design §13.4). Provenance strip for a title:
 * distributor, theatrical-vs-streaming, critics consensus, LLM stance tag.
 * Renders only the fields present (graceful when data is sparse).
 */
export function CredibilityStrip({ cred }: Props) {
  const rows: string[] = [];
  if (cred.distributor) rows.push(`Distributor: ${cred.distributor}`);
  if (cred.streaming != null) rows.push(cred.streaming ? "Streaming" : "Theatrical");
  if (cred.consensus) rows.push(cred.consensus);
  if (cred.stance) rows.push(`Stance: ${cred.stance}`);
  if (!rows.length) return null;
  return (
    <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
      {rows.map((r) => (
        <div key={r} className="rounded bg-white/[0.03] px-2 py-1">
          {r}
        </div>
      ))}
    </dl>
  );
}
