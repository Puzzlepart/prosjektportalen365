import assert from 'node:assert/strict'
import { before, describe, it } from 'node:test'
import type { ITermInfo } from 'pp365-shared-library/lib/taxonomy/index.js'
import { env, skipReason } from '../src/env.ts'
import { models, projectDataService, termStore } from '../src/library.ts'
import type { ISite } from '../src/sites.ts'
import { appOnlyDenied, connect, TERM_STORE_PERMISSION } from '../src/sites.ts'

/** A term's label in a language, as the term store returns it, or `undefined`. */
const labelIn = (term: ITermInfo, languageTag: string) =>
  term.labels.find((label) => label.languageTag.toLowerCase() === languageTag.toLowerCase())?.name

/** A term's own property in a term set, as the term store returns it, or `undefined`. */
const propertyIn = (term: ITermInfo, termSetId: string, key: string) =>
  term.localProperties
    ?.find((properties) => properties.setId === termSetId)
    ?.properties?.find((property) => property.key === key)?.value

/**
 * The phase term set through the library's term store client, read as the phase web part reads
 * it: the terms' labels in the web's language with the library's fallbacks, the texts each phase
 * carries in the phase set, and `ProjectDataService.getPhases` on the reserved project. Expected
 * values are read from the term store in the same test, so an edited term set does not fail it.
 * App-only, the tests skip until the CI app may read the term store (`appOnlyDenied`).
 */
describe('the phase term set', { skip: skipReason('hubUrl', 'projectUrl') }, () => {
  let project: ISite
  let termSetId: string
  let terms: ITermInfo[]
  let denied: string | undefined

  before(async () => {
    const hub = await connect(env.hubUrl!)
    project = await connect(env.projectUrl!)
    ;({ TermSetId: termSetId } = await hub.sp.web.fields
      .getByInternalNameOrTitle('GtProjectPhase')
      .select('TermSetId')<{ TermSetId: string }>())
    const phases = () =>
      termStore()
        .getTermStore(hub.sp.web)
        .sets.getById(termSetId)
        .terms.select('*', 'localProperties')
        .all()
    denied = await appOnlyDenied(hub, phases, TERM_STORE_PERMISSION)
    if (denied) return
    terms = await phases()
    assert.ok(terms.length > 0, `the phase term set ${termSetId} has no terms`)
  })

  it('labels a term in the language asked for, else in nb-NO, else in en-US', (t) => {
    if (denied) return t.skip(denied)
    const { getTermLabel } = termStore()
    for (const term of terms) {
      const nb = labelIn(term, 'nb-NO')
      const en = labelIn(term, 'en-US')
      const first = term.labels[0]?.name
      assert.equal(getTermLabel(term, 'nb-NO'), nb ?? en ?? first)
      // Language tags compare without regard to case: SharePoint writes en-US, the strings en-us.
      assert.equal(getTermLabel(term, 'en-us'), en ?? nb ?? first)
      // A language the set has no labels in falls back along the chain.
      assert.equal(getTermLabel(term, 'sv-SE'), nb ?? en ?? first)
    }
    const norwegianOnly = terms.filter((term) => !labelIn(term, 'en-US')).length
    t.diagnostic(`${terms.length} terms, ${norwegianOnly} without an English label`)
  })

  it("reads a phase's texts from the phase set, in the web's language", (t) => {
    if (denied) return t.skip(denied)
    const { ProjectPhaseModel } = models()
    let localized = 0
    for (const term of terms) {
      const subText = propertyIn(term, termSetId, 'PhaseSubText')
      const englishSubText = propertyIn(term, termSetId, 'PhaseSubText_en-us')
      if (subText === undefined) continue
      assert.equal(new ProjectPhaseModel(term, termSetId, {}, 1044).subText, subText)
      if (englishSubText !== undefined) {
        assert.equal(new ProjectPhaseModel(term, termSetId, {}, 1033).subText, englishSubText)
        localized++
      }
    }
    t.diagnostic(`${localized} phases with an English text beside the Norwegian one`)
  })

  it("names the reserved project's phases in its language (ProjectDataService.getPhases)", async (t) => {
    if (denied) return t.skip(denied)
    const { ProjectDataService } = projectDataService()
    const { getTermLabel } = termStore()
    const service = new ProjectDataService({
      webUrl: project.url,
      siteId: project.context.pageContext.site.id.toString(),
      spfxContext: project.context,
      propertiesListName: 'Prosjektegenskaper',
      entityService: undefined as any
    })
    const phases = await service.getPhases(termSetId)
    const languageTag = project.context.pageContext.web.language === 1033 ? 'en-US' : 'nb-NO'
    assert.deepEqual(
      phases.map((phase) => [phase.id, phase.name]),
      terms.map((term) => [term.id, getTermLabel(term, languageTag)])
    )
  })
})
