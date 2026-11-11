// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The task reads DEBUG for the engine's log level. `@pnp/logging`
// gets a working `Logger`, and the engine is a stand-in that records the schemas it applies and
// logs the lines a schema's `log` lists, as sp-js-provisioning logs a failure it goes on past.
;(globalThis as any).DEBUG = false
import type { IEngineRecord } from '../testFixtures'
const engine: IEngineRecord = { setups: [], applied: [] }
jest.mock('@pnp/logging', () => jest.requireActual('../testFixtures').fakeLogging())
jest.mock('sp-js-provisioning', () => jest.requireActual('../testFixtures').fakeEngine(engine))

import strings from 'ProjectExtensionsStrings'
import { format } from 'pp365-shared-library'
import { ApplyTemplate } from '.'
import { NO_TEMPLATE_ID } from '../../constants'
import { HooksTaskError } from '../Hooks/HooksTaskError'

const QUICK_LAUNCH = [{ Title: 'Hjem', Url: 'SitePages/ProjectHome.aspx' }]
const TOP_NAVIGATION_BAR = [{ Title: 'Portefølje', Url: '{hosturl}/sites/pp' }]

/** A selected extension, its schema read from the hub. */
const extension = (text: string, schema: Record<string, any>) => ({
  text,
  getSchema: jest.fn(() => Promise.resolve(schema))
})

/** The task with `template` selected (the default template unless `id` says otherwise). */
function applyTemplate(extensions: any[] = [], id = 1) {
  return new ApplyTemplate({
    selectedTemplate: { id, text: 'Standardmal' },
    selectedExtensions: extensions
  } as any)
}

/** Task parameters with the main template's schema. */
const taskParams = (templateSchema: Record<string, any>) =>
  ({
    web: {},
    context: {},
    templateSchema,
    templateExcludeHandlers: ['Hooks']
  }) as any

/** The entries the task added to the step's log at `level`. */
const entries = (onProgress: jest.Mock, level: string) =>
  onProgress.mock.calls
    .map(([, , , logEntry]) => logEntry)
    .filter((logEntry) => logEntry?.level === level)
    .map(({ message }) => message)

beforeEach(() => {
  engine.applied = []
  engine.setups = []
  engine.fail = undefined
})

describe('ApplyTemplate', () => {
  it('applies the template without its hooks, then each extension without its hooks', async () => {
    const extensions = [
      extension('Kommunikasjon', { Lists: [{ Title: 'Kommunikasjonsplan' }], Hooks: [{}] })
    ]
    const params = taskParams({ Lists: [{ Title: 'Prosjektlogg' }], Hooks: [{}] })
    expect(await applyTemplate(extensions).execute(params, jest.fn())).toBe(params)
    expect(engine.applied).toEqual([
      { Lists: [{ Title: 'Prosjektlogg' }] },
      { Lists: [{ Title: 'Kommunikasjonsplan' }] }
    ])
    // Warnings and errors reach the step's log; the rest only when debugging.
    expect(engine.setups[0].logging.activeLogLevel).toBe(2)
  })

  it("adds the engine's warnings and errors to the step's log, under the handler it is in", async () => {
    const onProgress = jest.fn()
    await applyTemplate([
      extension('Kommunikasjon', {
        Lists: [],
        log: [[3, '(Lists): (processFields): Failed to add field GtCommunicationTarget']]
      })
    ]).execute(
      taskParams({
        Lists: [],
        log: [
          [1, '(Lists): (processList): Processing list Prosjektlogg'],
          [2, '(SiteFields): (processField): Field GtProjectType keeps its type Choice'],
          [3, '(Lists): (processFields): Failed to add field GtGainLookup']
        ]
      }),
      onProgress
    )
    expect(entries(onProgress, 'warning')).toEqual([
      '(SiteFields): (processField): Field GtProjectType keeps its type Choice'
    ])
    expect(entries(onProgress, 'error')).toEqual([
      '(Lists): (processFields): Failed to add field GtGainLookup',
      '(Lists): (processFields): Failed to add field GtCommunicationTarget'
    ])
    const [errorOfTemplate, errorOfExtension] = onProgress.mock.calls.filter(
      ([, , , logEntry]) => logEntry?.level === 'error'
    )
    expect(errorOfTemplate.slice(0, 3)).toEqual([
      format(strings.ApplyTemplateText, 'Standardmal'),
      strings.ApplyTemplateLists,
      'PageListSolid'
    ])
    expect(errorOfExtension.slice(0, 3)).toEqual([
      strings.ApplyingExtensionsText,
      format(strings.ApplyExtensionText, 'Kommunikasjon'),
      'ExternalBuild'
    ])
  })

  it('leaves out of the log what is logged after the template is applied', async () => {
    const onProgress = jest.fn()
    await applyTemplate().execute(taskParams({ Lists: [] }), onProgress)
    jest.requireMock('@pnp/logging').Logger.log({ message: 'Another error on the page', level: 3 })
    expect(entries(onProgress, 'error')).toEqual([])
  })

  it('leaves the menus an extension declares out of the template, and logs it', async () => {
    const onProgress = jest.fn()
    await applyTemplate([
      extension('Enkel venstremeny', { Navigation: { QuickLaunch: [] } }),
      extension('Kommunikasjon', { Lists: [] })
    ]).execute(
      taskParams({
        Lists: [],
        Navigation: { QuickLaunch: QUICK_LAUNCH, TopNavigationBar: TOP_NAVIGATION_BAR }
      }),
      onProgress
    )
    expect(engine.applied[0]).toEqual({
      Lists: [],
      Navigation: { TopNavigationBar: TOP_NAVIGATION_BAR }
    })
    expect(engine.applied[1]).toEqual({ Navigation: { QuickLaunch: [] } })
    expect(entries(onProgress, 'info')).toContain(
      "Skipping the template's Navigation QuickLaunch: the extension Enkel venstremeny declares it"
    )
  })

  it('passes on the Quick Launch of the template, as its schema declares it, and of each extension', async () => {
    const extensionQuickLaunch = [{ Title: 'Prosjektstatus', Url: 'SitePages/Prosjektstatus.aspx' }]
    const params = await applyTemplate([
      extension('Enkel venstremeny', { Navigation: { QuickLaunch: extensionQuickLaunch } }),
      extension('Kommunikasjon', { Lists: [] })
    ]).execute(taskParams({ Navigation: { QuickLaunch: QUICK_LAUNCH } }), jest.fn())
    expect(engine.applied[0]).toEqual({})
    expect(params.declaredQuickLaunch).toEqual([QUICK_LAUNCH, extensionQuickLaunch])
  })

  it("passes on only the extensions' Quick Launch when no template is selected", async () => {
    const params = await applyTemplate(
      [extension('Enkel venstremeny', { Navigation: { QuickLaunch: [] } })],
      NO_TEMPLATE_ID
    ).execute(taskParams({ Navigation: { QuickLaunch: QUICK_LAUNCH } }), jest.fn())
    expect(params.declaredQuickLaunch).toEqual([[]])
  })

  it('leaves the whole Navigation out of the template when the extensions declare both menus', async () => {
    await applyTemplate([
      extension('Venstremeny', { Navigation: { QuickLaunch: QUICK_LAUNCH } }),
      extension('Toppmeny', { Navigation: { TopNavigationBar: [] } })
    ]).execute(
      taskParams({
        Lists: [],
        Navigation: { QuickLaunch: QUICK_LAUNCH, TopNavigationBar: TOP_NAVIGATION_BAR }
      }),
      jest.fn()
    )
    expect(engine.applied[0]).toEqual({ Lists: [] })
  })

  it("keeps the template's menu when no extension declares one", async () => {
    await applyTemplate([extension('Kommunikasjon', { Navigation: {} })]).execute(
      taskParams({ Navigation: { QuickLaunch: QUICK_LAUNCH } }),
      jest.fn()
    )
    expect(engine.applied[0]).toEqual({ Navigation: { QuickLaunch: QUICK_LAUNCH } })
  })

  it('applies only the extensions when no template is selected', async () => {
    await applyTemplate([extension('Kommunikasjon', { Lists: [] })], NO_TEMPLATE_ID).execute(
      taskParams({ Lists: [{ Title: 'Prosjektlogg' }] }),
      jest.fn()
    )
    expect(engine.applied).toEqual([{ Lists: [] }])
  })

  it('fails with the handler the engine failed in', async () => {
    engine.fail = new Error('Cannot open file "Lists/Benefits analysis and realization plan".')
    await expect(
      applyTemplate().execute(taskParams({ Navigation: { QuickLaunch: QUICK_LAUNCH } }), jest.fn())
    ).rejects.toMatchObject({
      message: `${format(strings.ApplyTemplateErrorMessage, 'Navigation')}: ${engine.fail.message}`
    })
  })

  it('fails with what the engine failed with in words when its error has no message of its own', async () => {
    // sp-js-provisioning 1.5.1 makes the message of its error `String(cause)`, and a failed JSOM
    // request (the content types) rejects with `{ sender, args }`: the setup said «[object Object]».
    engine.fail = Object.assign(new Error('[object Object]'), {
      name: 'ProvisioningError',
      cause: { sender: {}, args: { get_message: () => 'Innholdstypen finnes allerede.' } }
    })
    await expect(
      applyTemplate().execute(taskParams({ ContentTypes: [] }), jest.fn())
    ).rejects.toMatchObject({
      message: `${format(strings.ApplyTemplateErrorMessage, 'Navigation')}: Innholdstypen finnes allerede.`,
      stack: 'ProvisioningError: Innholdstypen finnes allerede.'
    })
  })
})

// The hooks' step fails with the same message as the template's, from its own error class.
describe('HooksTaskError', () => {
  it('says which handler failed and what with, in words', () => {
    const error = new HooksTaskError(
      Object.assign(new Error('[object Object]'), {
        name: 'ProvisioningError',
        handler: 'Hooks',
        cause: { error: { code: '500', message: { lang: 'nb-NO', value: 'Kroken svarte 500' } } }
      })
    )
    expect(error.message).toBe(
      `${format(strings.ApplyTemplateErrorMessage, 'Hooks')}: Kroken svarte 500`
    )
    expect(error.stack).toBe('ProvisioningError: Kroken svarte 500')
  })

  it('says only which handler failed when nothing can be read of what it failed with', () => {
    const error = new HooksTaskError(Object.assign(new Error(''), { handler: 'Hooks' }))
    expect(error.message).toBe(format(strings.ApplyTemplateErrorMessage, 'Hooks'))
  })
})
