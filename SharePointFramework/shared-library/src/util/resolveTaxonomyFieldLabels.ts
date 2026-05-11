import { IWeb } from '@pnp/sp/presets/all'
import { stringIsNullOrEmpty } from '@pnp/core'
import { DefaultCaching } from '../data'

type TaxonomyFieldValue = { Label: unknown; TermGuid?: string; WssId?: number }

/**
 * `true` when SharePoint's REST serializer has put the WssId (or nothing) into
 * `Label` instead of the term name. Single-value `TaxonomyFieldType` columns
 * can hit this on tenants where the field's runtime lookup doesn't resolve to
 * the language column declared in `ShowField`.
 */
function isBrokenLabel(v: TaxonomyFieldValue): boolean {
  if (!v?.TermGuid) return false
  if (typeof v.Label !== 'string' || stringIsNullOrEmpty(v.Label)) return true
  return v.Label === String(v.WssId) || /^\d+$/.test(v.Label)
}

function collectBroken(raw: Record<string, any>): TaxonomyFieldValue[] {
  const out: TaxonomyFieldValue[] = []
  for (const key of Object.keys(raw)) {
    const v = raw[key]
    if (Array.isArray(v)) {
      for (const item of v) {
        if (item && typeof item === 'object' && isBrokenLabel(item)) out.push(item)
      }
    } else if (v && typeof v === 'object' && 'TermGuid' in v && isBrokenLabel(v)) {
      out.push(v)
    }
  }
  return out
}

/**
 * Patch taxonomy field values whose `Label` is missing or contains the WssId
 * instead of the term name. Real labels are looked up by `WssId` (= `Id`) from
 * the site's `TaxonomyHiddenList`. SharePoint's REST serializer can produce
 * the broken shape for single-value `TaxonomyFieldType` columns on certain
 * tenants — see the 2026-05 customer issue where
 * `{ Label: "16", TermGuid: "37c8631c-…", WssId: 16 }` came back despite a
 * healthy term store and correct field schema.
 *
 * Uses the hidden list's language-neutral `Term` column, which is always
 * present and holds the primary-language label on the site.
 *
 * Mutates `raw` in place. No-op when nothing looks broken. Best-effort: if
 * the list query fails, labels are left as-is and the defensive guard in
 * `createFieldValueMap` will render an empty chip instead of `"16"`.
 *
 * @param raw Field-value record (typically the raw result of `item.select('*')`)
 * @param web `IWeb` for the site whose `TaxonomyHiddenList` holds the WssId
 *   mapping for the values in `raw`. Must match the site whose items the
 *   WssIds came from — they don't translate across site collections.
 */
export async function resolveTaxonomyFieldLabels(
  raw: Record<string, any>,
  web: IWeb
): Promise<void> {
  const broken = collectBroken(raw)
  if (broken.length === 0) return

  const wssIds = Array.from(
    new Set(
      broken.map((b) => b.WssId).filter((id): id is number => typeof id === 'number' && id > 0)
    )
  )
  if (wssIds.length === 0) return

  const filter = wssIds.map((id) => `Id eq ${id}`).join(' or ')

  try {
    const items: Array<{ Id: number; Term: string }> = await web.lists
      .getByTitle('TaxonomyHiddenList')
      .items.filter(filter)
      .select('Id', 'Term')
      .top(wssIds.length)
      .using(DefaultCaching)()
    const labelByWssId = new Map<number, string>()
    for (const it of items) {
      if (typeof it?.Term === 'string' && it.Term.length > 0) labelByWssId.set(it.Id, it.Term)
    }
    for (const v of broken) {
      if (typeof v.WssId !== 'number') continue
      const label = labelByWssId.get(v.WssId)
      if (label) v.Label = label
    }
  } catch {
    /* best-effort: leave Labels as-is */
  }
}
