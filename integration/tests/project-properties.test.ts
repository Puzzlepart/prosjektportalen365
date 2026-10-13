import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { before, describe, it } from 'node:test'
import type { ProjectDataService } from 'pp365-shared-library/lib/services/ProjectDataService/index.js'
import { env, skipReason } from '../src/env.ts'
import { library, models, projectDataService, termStore } from '../src/library.ts'
import type { ISite } from '../src/sites.ts'
import { appOnlyDenied, connect, TERM_STORE_PERMISSION } from '../src/sites.ts'

const require = createRequire(import.meta.url)
const resources = require('SharedResources') as Record<string, string>

/** The library's date functions, as the edit panel's date field reads, writes and sends a date. */
const dates = () =>
  library<typeof import('pp365-shared-library/lib/util/formatDate.js')>('util/formatDate.js')

/** The machine's time zones a date is typed in: the site's, CI's, one west of the site, two east. */
const TIME_ZONES = ['Europe/Oslo', 'UTC', 'America/New_York', 'Europe/Helsinki', 'Asia/Tokyo']

/**
 * The reserved project's properties written as the edit panel (`CustomEditPanel`, `useModel`) sends
 * them and read back through `ProjectDataService`, raw and as SharePoint shows them. Every test
 * restores what it changed, from what it read first, and fails when it cannot. Nothing but the
 * project's own properties item is written: the hub is synchronized by slice 3's tests.
 */
describe(
  "the reserved project's properties, as the edit panel writes them",
  { skip: skipReason('projectUrl') },
  () => {
    let project: ISite
    let service: ProjectDataService
    let locale: string

    before(async () => {
      project = await connect(env.projectUrl!)
      const { ProjectDataService } = projectDataService()
      service = new ProjectDataService({
        webUrl: project.url,
        siteId: project.context.pageContext.site.id.toString(),
        spfxContext: project.context,
        propertiesListName: resources.Lists_ProjectProperties_Title,
        entityService: undefined as any
      })
      locale = project.context.pageContext.cultureInfo.currentUICultureName
    })

    /** The properties item's fields, as the panel reads them. */
    const fieldValues = async () => {
      const { fieldValues } = await service.getProjectInformationData()
      assert.ok(fieldValues, 'the reserved project has no properties item')
      return fieldValues
    }

    /** Writes the properties as the panel's save does. */
    const save = (properties: Record<string, unknown>) =>
      service.updateProjectProperties(properties as Record<string, string>)

    /** The properties list, for what the service does not read: a field's schema, a hidden field. */
    const propertiesList = () =>
      project.sp.web.lists.getByTitle(resources.Lists_ProjectProperties_Title)

    it("stores a date typed in the page's language as that day, whatever the machine's time zone", async () => {
      const { formatShortDate, parseShortDate, toCalendarDate } = dates()
      const original = (await fieldValues()).get('GtStartDate')?.value ?? null
      const zone = process.env.TZ
      const stored = new Set<string>()
      try {
        for (const timeZone of TIME_ZONES) {
          process.env.TZ = timeZone
          // 3 April, typed as the picker shows it: a day and month mixed up would make it 4 March.
          const typed = formatShortDate(new Date(2026, 3, 3), false, '', locale)
          await save({ GtStartDate: toCalendarDate(parseShortDate(typed, locale)) })
          const { value, valueAsText } = (await fieldValues()).get('GtStartDate')
          assert.equal(
            toCalendarDate(parseShortDate(valueAsText, locale)),
            '2026-04-03',
            `typed ${typed} with the machine in ${timeZone}, SharePoint shows ${valueAsText}`
          )
          stored.add(value)
        }
        // One instant from every zone: midnight in the site's time zone, as SharePoint's forms store it.
        assert.equal(stored.size, 1, `stored as ${[...stored].join(', ')}`)
      } finally {
        process.env.TZ = zone
        await save({ GtStartDate: original })
      }
      assert.equal(
        (await fieldValues()).get('GtStartDate')?.value ?? null,
        original,
        'start date not restored'
      )
    })

    it("shows a stored date as the day SharePoint shows, whatever the machine's time zone", async () => {
      const { toCalendarDate } = dates()
      const { EditableSPField } = models()
      const original = (await fieldValues()).get('GtStartDate')?.value ?? null
      const zone = process.env.TZ
      try {
        await save({ GtStartDate: '2026-04-03' })
        const { fields, fieldValues: values } = await service.getProjectInformationData()
        assert.ok(fields && values, 'the reserved project has no properties item')
        const startDate = fields.find((field) => field.InternalName === 'GtStartDate')
        assert.ok(startDate, 'the properties list has no GtStartDate field')
        for (const timeZone of ['Europe/Oslo', 'Europe/London', 'America/New_York', 'Asia/Tokyo']) {
          process.env.TZ = timeZone
          // The day the panel's date field starts from: the stored value, read as the panel reads it.
          const shown: Date = new EditableSPField(startDate).setValue(values).getParsedValue<Date>()
          assert.equal(
            toCalendarDate(shown),
            '2026-04-03',
            `the machine in ${timeZone} shows ${shown}`
          )
        }
      } finally {
        process.env.TZ = zone
        await save({ GtStartDate: original })
      }
      assert.equal(
        (await fieldValues()).get('GtStartDate')?.value ?? null,
        original,
        'start date not restored'
      )
    })

    it('stores text, a choice and a person as the panel sends them', async (t) => {
      const previous = await fieldValues()
      const original = {
        GtProjectFinanceName: previous.get('GtProjectFinanceName')?.value ?? null,
        GtProjectLifecycleStatus: previous.get('GtProjectLifecycleStatus')?.value ?? null,
        GtGainsResponsibleId: previous.get('GtGainsResponsible')?.value?.Id ?? null
      }
      const { Choices: choices } = await propertiesList()
        .fields.getByInternalNameOrTitle('GtProjectLifecycleStatus')
        .select('Choices')<{ Choices: string[] }>()
      const status = choices.find((choice) => choice !== original.GtProjectLifecycleStatus)
      const financeName = `${original.GtProjectFinanceName ?? ''} (integrasjonstest)`
      const email = project.context.pageContext.user.email
      if (!email) t.diagnostic('no user to set as gains responsible: INTEGRATION_USER is not set')
      try {
        // A person goes as the id the web has for them, as the panel's transform sends it (`ensureUser`).
        const user = email ? await project.sp.web.ensureUser(email) : undefined
        await save({
          GtProjectFinanceName: financeName,
          GtProjectLifecycleStatus: status,
          ...(user ? { GtGainsResponsibleId: user.Id } : {})
        })
        const after = await fieldValues()
        assert.equal(after.get('GtProjectFinanceName').value, financeName)
        assert.deepEqual(after.get('GtProjectLifecycleStatus'), {
          value: status,
          valueAsText: status
        })
        if (user) {
          assert.equal(after.get('GtGainsResponsible').value.Id, user.Id)
          assert.equal(after.get('GtGainsResponsible').valueAsText, user.Title)
        }
      } finally {
        await save(original)
      }
      const restored = await fieldValues()
      assert.deepEqual(
        {
          GtProjectFinanceName: restored.get('GtProjectFinanceName')?.value ?? null,
          GtProjectLifecycleStatus: restored.get('GtProjectLifecycleStatus')?.value ?? null,
          GtGainsResponsibleId: restored.get('GtGainsResponsible')?.value?.Id ?? null
        },
        original,
        'text, choice or person not restored'
      )
    })

    it("stores terms through their hidden text field, labelled in the page's language", async (t) => {
      const list = propertiesList()
      const { TextField, TermSetId } = await list.fields
        .getByInternalNameOrTitle('GtProjectServiceArea')
        .select('TextField', 'TermSetId')<{ TextField: string; TermSetId: string }>()
      const { InternalName: hidden } = await list.fields.getById(TextField).select('InternalName')<{
        InternalName: string
      }>()
      const { getTermLabel, getTermStore } = termStore()
      const serviceAreas = () =>
        getTermStore(project.sp.web)
          .sets.getById(TermSetId)
          .terms.select('*', 'localProperties')
          .all()
      const denied = await appOnlyDenied(project, serviceAreas, TERM_STORE_PERMISSION)
      if (denied) return t.skip(denied)
      const hiddenValue = async () =>
        (await list.items.select('Id', hidden).top(1)<Record<string, string>[]>())[0]?.[hidden] ??
        ''
      const original = await hiddenValue()
      // A term the project does not have, so the read back shows the write took.
      const term = (await serviceAreas()).find((candidate) => !original.includes(candidate.id))
      assert.ok(term, `the service area term set ${TermSetId} has no term the project lacks`)
      const label = getTermLabel(term, locale)
      try {
        // The panel's transform: `-1;#<label>|<id>` per term, joined by `;#`, into the hidden field.
        await save({ [hidden]: `-1;#${label}|${term.id}` })
        const { value, valueAsText } = (await fieldValues()).get('GtProjectServiceArea')
        assert.deepEqual(
          value.map((stored: { TermGuid: string }) => stored.TermGuid),
          [term.id]
        )
        assert.equal(valueAsText, label)
      } finally {
        await save({ [hidden]: original })
      }
      assert.equal(await hiddenValue(), original, 'service areas not restored')
    })
  }
)
