import { ICatalog } from 'models'

/**
 * Dev/test fixture — a copy of the real `catalog.json` from the
 * `prosjektportalen-hosting` repo (kept schema-valid). Used by
 * {@link CatalogService} when no `catalogUrl` is configured, or as the
 * fallback when the configured catalog can't be fetched (CORS/network).
 *
 * Exported as a typed object (rather than a `.json` import) to avoid a
 * dependency on `resolveJsonModule` in the SPFx tsconfig.
 */
export const sampleCatalog: ICatalog = {
  lastUpdated: '2026-05-11T09:19:36.921Z',
  packages: [
    {
      id: 'pp-standardmal',
      name: 'Standardmal',
      description:
        'Komplett prosjektmal med fasesjekkliste, interessentregister, usikkerhetshåndtering, leveransestyring og dokumenthåndtering. Inkluderer integrasjon med Microsoft Planner for oppgavestyring.',
      version: '1.0.1',
      type: 'template',
      author: 'Puzzlepart',
      tags: ['standard', 'prosjektledelse', 'SharePoint'],
      thumbnail:
        'https://raw.githubusercontent.com/Puzzlepart/prosjektportalen-hosting/main/packages/dummy-prosjektmal/thumbnail.png',
      downloadUrl:
        'https://github.com/Puzzlepart/prosjektportalen-hosting/releases/download/v1.0.1/dummy-prosjektmal-1.0.1.pppkg',
      minPPVersion: '1.10.0',
      publishedDate: '2026-05-11',
      changelogUrl:
        'https://raw.githubusercontent.com/Puzzlepart/prosjektportalen-hosting/main/packages/dummy-prosjektmal/CHANGELOG.md'
    }
  ]
}
