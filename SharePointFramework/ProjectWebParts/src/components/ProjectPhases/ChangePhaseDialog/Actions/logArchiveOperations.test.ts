// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data adapter writes to the hub; here it records each entry
// and answers with the error `answers` gives its title, or none.
const written: string[] = []
const answers: Record<string, Error> = {}
jest.mock('../../../../data', () => {
  const write = (title: string) => {
    written.push(title)
    return Promise.resolve(answers[title] ?? null)
  }
  return {
    __esModule: true,
    default: {
      logDocumentArchive: (title: string) => write(title),
      logListArchive: (title: string) => write(title)
    }
  }
})

import { logArchiveOperations } from './logArchiveOperations'

const configuration: any = {
  documents: [
    { title: 'Mandat', url: '/sites/p/Dokumenter/Mandat.docx' },
    { title: 'Langt navn', url: '/sites/p/Dokumenter/' + 'a'.repeat(300) },
    { title: 'Sluttrapport', url: '/sites/p/Dokumenter/Sluttrapport.docx' }
  ],
  lists: [{ title: 'Usikkerhet', url: '/sites/p/Lists/Usikkerhet' }]
}

beforeEach(() => {
  written.length = 0
  for (const title of Object.keys(answers)) delete answers[title]
})

/**
 * The archive log entries a phase change writes: one for each document and list, every entry
 * the hub takes written even when another is refused, and none sent once the hub denies access.
 */
describe('logArchiveOperations', () => {
  it('writes an entry for each document and list', async () => {
    expect(await logArchiveOperations(configuration, '/sites/p')).toBeNull()
    expect(written).toEqual(['Mandat', 'Langt navn', 'Sluttrapport', 'Usikkerhet'])
  })

  it('writes the other entries when the hub refuses one, and gives that error', async () => {
    const tooLong = new Error('The value of GtLogReference is too long')
    answers['Langt navn'] = tooLong
    expect(await logArchiveOperations(configuration, '/sites/p')).toBe(tooLong)
    expect(written).toEqual(['Mandat', 'Langt navn', 'Sluttrapport', 'Usikkerhet'])
  })

  it('sends no more entries once the hub denies access', async () => {
    const denied = Object.assign(new Error('403 FORBIDDEN'), { status: 403 })
    answers['Mandat'] = denied
    expect(await logArchiveOperations(configuration, '/sites/p')).toBe(denied)
    expect(written).toEqual(['Mandat'])
  })
})
