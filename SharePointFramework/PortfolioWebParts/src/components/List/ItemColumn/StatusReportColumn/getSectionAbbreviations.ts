/**
 * Two letters for each status section, for the legend above the strips: the first letter in upper
 * case and the second as written («Fremdrift», «Fr»). Where it would read as an earlier one does,
 * the first letter goes with the first later letter that tells it apart («Fremtid» after
 * «Fremdrift», «Fe»). A name shorter than two letters is kept as it is.
 *
 * @param names The sections' names, in the strip's order
 * @returns An abbreviation for each name, in the same order
 */
export function getSectionAbbreviations(names: string[]): string[] {
  const taken = new Set<string>()
  return names.map((name) => {
    const letters = Array.from((name ?? '').replace(/\s/g, ''))
    const abbreviation = letters.length < 2 ? letters.join('') : abbreviate(letters, taken)
    taken.add(abbreviation.toLowerCase())
    return abbreviation
  })
}

/**
 * The first letter in upper case with the first later letter that no earlier abbreviation has,
 * ignoring case; the second letter where every one is taken.
 */
function abbreviate(letters: string[], taken: Set<string>): string {
  const first = letters[0].toUpperCase()
  for (const letter of letters.slice(1)) {
    if (!taken.has(`${first}${letter}`.toLowerCase())) return `${first}${letter}`
  }
  return `${first}${letters[1]}`
}
