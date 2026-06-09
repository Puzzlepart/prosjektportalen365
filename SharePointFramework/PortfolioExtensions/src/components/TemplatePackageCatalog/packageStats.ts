/**
 * Deterministic, fabricated ("lissom") social-proof stats for catalog packages.
 *
 * The catalog has no real download/rating telemetry yet, so these values are
 * derived purely from the package id — stable across renders and sessions, with
 * no randomness and nothing persisted. The catalog model deliberately does not
 * carry these fields (see {@link ICatalogPackage}); swap {@link getPackageStats}
 * and {@link getPackageReviews} for a real data source once telemetry exists.
 */

export interface IPackageStats {
  /** Fabricated total download count, 0–35. */
  downloads: number
  /** Fabricated average rating, one decimal, in the 3.6–5.0 range. */
  rating: number
  /** Fabricated number of ratings behind {@link rating}, 1–5 (also the number of reviews shown). */
  ratingCount: number
}

export interface IPackageReview {
  author: string
  role: string
  /** Whole-star rating, 3–5. */
  rating: number
  /** ISO date (YYYY-MM-DD). */
  date: string
  text: string
}

/** Small, stable string hash (always a non-negative 32-bit int). */
function hash(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0
  }
  return h
}

/**
 * Stable fabricated download/rating stats for a package, derived from its id.
 */
export function getPackageStats(packageId: string): IPackageStats {
  const h = hash(packageId)
  const downloads = h % 36 // 0–35
  const ratingCount = 1 + ((h >>> 4) % 5) // 1–5
  const rating = Math.round((3.6 + ((h >>> 8) % 15) / 10) * 10) / 10 // 3.6–5.0
  return { downloads, rating, ratingCount }
}

const REVIEW_AUTHORS: ReadonlyArray<{ author: string; role: string; text: string }> = [
  {
    author: 'Remi Blom-ohlsen',
    role: 'Prosjektleder',
    text: 'Veldig enkel å ta i bruk – sparte oss for mye manuelt oppsett i oppstarten.'
  },
  {
    author: 'Tarjei E. Ormestøyl',
    role: 'Porteføljekoordinator',
    text: 'God struktur rett ut av boksen. Fasesjekklisten er spesielt nyttig for oss.'
  },
  {
    author: 'Jan Lindset',
    role: 'PMO-ansvarlig',
    text: 'Fungerer fint for prosjektene våre. Kunne ønsket noen flere ferdige maler.'
  },
  {
    author: 'Daniel W. Møller',
    role: 'Systemansvarlig',
    text: 'Smidig oppsett og grei dokumentasjon. Fungerte på første forsøk.'
  },
  {
    author: 'Ole Kristian Mørch Storstein',
    role: 'Avdelingsleder',
    text: 'Enkelt å rulle ut i hele avdelingen. Brukerne var raskt i gang.'
  }
]

/**
 * Stable fabricated reviews for a package, derived from its id. The number of
 * reviews equals the package's {@link IPackageStats.ratingCount} (1–5) so the
 * comment count matches the rating count, and each review's star rating sits
 * within ±1 of the package's overall rating. A step of 1 over the author pool
 * keeps the (up to 5) authors distinct.
 */
export function getPackageReviews(packageId: string): IPackageReview[] {
  const h = hash(packageId)
  const { rating, ratingCount } = getPackageStats(packageId)
  const overall = Math.round(rating)
  const count = Math.min(ratingCount, REVIEW_AUTHORS.length)
  const reviews: IPackageReview[] = []
  for (let i = 0; i < count; i++) {
    const base = REVIEW_AUTHORS[(h + i) % REVIEW_AUTHORS.length]
    const hh = hash(packageId + base.author)
    const reviewRating = Math.min(5, Math.max(3, overall + ((hh % 3) - 1)))
    const month = 1 + (hh % 6)
    const day = 1 + (hh % 27)
    const date = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    reviews.push({ author: base.author, role: base.role, rating: reviewRating, date, text: base.text })
  }
  return reviews
}
