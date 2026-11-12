import { ICatalog } from 'models'

/**
 * Bundled sample used when loading the configured or default live catalog fails.
 *
 * Exported as a typed object (rather than a `.json` import) to avoid a
 * dependency on `resolveJsonModule` in the SPFx tsconfig.
 */
export const sampleCatalog: ICatalog = {
  lastUpdated: '2026-06-05T09:00:00.000Z',
  packages: [
    {
      id: 'pp-enkel-prosjektmal',
      name: 'Enkel prosjektmal',
      description:
        'En enkel prosjektmal for oppstart av små prosjekter. Definerer en egen prosjektinnholdstype på hub-området og inkluderer prosjekttilleggene «Enkelt prosjekt» og «Enkel venstremeny».',
      version: '1.0.0',
      type: 'template',
      icon: 'Page',
      author: 'Puzzlepart',
      tags: ['enkel', 'prosjektledelse', 'oppstart'],
      thumbnail:
        'https://raw.githubusercontent.com/Puzzlepart/prosjektportalen-hosting/main/packages/pp-enkel-prosjektmal/thumbnail.png',
      downloadUrl:
        'https://raw.githubusercontent.com/Puzzlepart/prosjektportalen-hosting/main/dist/pp-enkel-prosjektmal-1.0.0.pppkg',
      minPPVersion: '1.10.0',
      publishedDate: '2026-06-05',
      changelogUrl:
        'https://raw.githubusercontent.com/Puzzlepart/prosjektportalen-hosting/main/packages/pp-enkel-prosjektmal/CHANGELOG.md'
    }
  ]
}
