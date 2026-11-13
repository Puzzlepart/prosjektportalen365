// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data adapter is `adapter`; the document template dialog
// (tested on its own) records the context and props it was opened with, and closes on a click of
// its title. Its two other buttons do what the dialog does after a copy: count the copy, and
// close asking for the page to be reloaded. Usage statistics are the real ones, counting in the
// window's memory, but for their flush, which `leaving` records with the reload that follows it.
;(globalThis as any).DEBUG = false
const HUB = 'https://contoso.sharepoint.com/sites/pp365'
const adapter = {
  configure: jest.fn(() => Promise.resolve()),
  portalDataService: { url: HUB, isAvailable: true } as any,
  getDocumentTemplates: jest.fn(() => Promise.resolve([{ name: 'Prosjektplan.docx' }])),
  getLibraries: jest.fn(() =>
    Promise.resolve([
      { id: 'lib-2', title: 'Dokumenter' },
      { id: 'lib-1', title: 'Prosjektdokumenter' }
    ])
  )
}
jest.mock('data', () => ({ SPDataAdapter: adapter }))
/** What the page did as the dialog closed, in order: usage statistics' flush, then the reload. */
const leaving: string[] = []
jest.mock('pp365-shared-library/lib/telemetry', () => ({
  ...jest.requireActual('pp365-shared-library/lib/telemetry'),
  flushTelemetry: (options?: { urgent?: boolean }) =>
    leaving.push(options?.urgent ? 'urgent flush' : 'flush')
}))
const COPY = 'Kopier malene'
const CLOSE_AFTER_COPY = 'Lukk etter kopiering'
const opened: { context?: any; props?: any } = {}
jest.mock('components', () => {
  const React = jest.requireActual('react')
  const { TemplateSelectorContext } = jest.requireActual('./context')
  const { useTelemetry } = jest.requireActual('pp365-shared-library/lib/telemetry')
  return {
    DocumentTemplateDialog: (props: any) => {
      opened.context = React.useContext(TemplateSelectorContext)
      opened.props = props
      const telemetry = useTelemetry()
      return React.createElement(
        React.Fragment,
        null,
        React.createElement(
          'button',
          { onClick: () => props.onDismiss({ reload: false }) },
          props.title
        ),
        React.createElement(
          'button',
          { onClick: () => telemetry.track('documentTemplates.copied') },
          COPY
        ),
        React.createElement(
          'button',
          { onClick: () => props.onDismiss({ reload: true }) },
          CLOSE_AFTER_COPY
        )
      )
    }
  }
})

import { act, fireEvent, screen } from '@testing-library/react'
import * as fs from 'fs'
import * as path from 'path'
import { getTelemetryGate } from 'pp365-shared-library/lib/telemetry'
import {
  clearTestTelemetry,
  countedTelemetry,
  HUB_SITE_ID,
  hubPortal,
  PROJECT_SITE_ID,
  settingsMap,
  settle,
  spfxTestContext,
  telemetryStore
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import strings from 'ProjectExtensionsStrings'
import resource from 'SharedResources'
import TemplateSelectorCommand from '.'

const OPEN = 'OPEN_TEMPLATE_SELECTOR'

/** The command set's alias in its manifest, which usage statistics count it by. */
const { alias: ALIAS } = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../../../src/extensions/templateSelector/manifest.json'),
    'utf8'
  )
)

/** The command set in the library with id `lib-1` of a project site of the hub, initialised. */
async function selectorCommand(properties: Record<string, any> = {}) {
  const command = new TemplateSelectorCommand()
  const { pageContext, manifest } = spfxTestContext({ page: 'project', alias: ALIAS })
  ;(command as any).context = {
    manifest,
    pageContext: { ...pageContext, list: { id: { toString: () => 'lib-1' } } }
  }
  ;(command as any).properties = properties
  const raiseOnChange = jest.spyOn(command, 'raiseOnChange')
  await command.onInit()
  return { command, raiseOnChange, open: command.tryGetCommand(OPEN) }
}

const execute = (command: TemplateSelectorCommand) =>
  act(() => command.onExecute({ itemId: OPEN } as any))

let consoleError: jest.SpyInstance

beforeEach(() => {
  adapter.configure.mockImplementation(() => Promise.resolve())
  adapter.configure.mockClear()
  adapter.getDocumentTemplates.mockClear()
  adapter.portalDataService = { url: HUB, isAvailable: true }
  opened.context = undefined
  window.history.replaceState({}, '', '/sites/frisbee/Delte%20dokumenter/Forms/AllItems.aspx')
  clearTestTelemetry()
  leaving.length = 0
  // jsdom cannot navigate: the reload after a copy is told as an error, which is noted here.
  // Every other error still reaches the test output.
  // eslint-disable-next-line no-console
  const original = console.error
  consoleError = jest.spyOn(console, 'error').mockImplementation((...args: any[]) => {
    if (String(args[0]?.message ?? args[0]).includes('Not implemented: navigation')) {
      leaving.push('reload')
      return
    }
    original(...args)
  })
})

afterEach(() => {
  consoleError.mockRestore()
  // The dialog is rendered into a placeholder of its own on the page; the tests close what they
  // open, and the empty placeholders go here.
  document.body.querySelectorAll(':scope > div').forEach((placeholder) => placeholder.remove())
})

describe('TemplateSelectorCommand', () => {
  it('names its command and shows it in the library', async () => {
    const { command, open } = await selectorCommand()
    expect(open.title).toBe(strings.TemplateSelectorCommandTitle)
    expect(open.iconImageUrl).toMatch(/^data:image\/svg\+xml,/)
    command.onListViewUpdated()
    expect(open.visible).toBe(true)
  })

  it('opens the template dialog with the templates, the libraries and the current folder', async () => {
    window.history.replaceState(
      {},
      '',
      '/sites/frisbee/Delte%20dokumenter/Forms/AllItems.aspx?id=%2Fsites%2Ffrisbee%2FDelte%20dokumenter%2FMøter'
    )
    const { command } = await selectorCommand()
    await execute(command)
    expect(adapter.getDocumentTemplates).toHaveBeenCalledWith(
      resource.Lists_TemplateLibrary_Title,
      '<View Scope="RecursiveAll"></View>'
    )
    expect(opened.props.title).toBe(strings.TemplateLibrarySelectModalTitle)
    expect(opened.context).toMatchObject({
      templates: [{ name: 'Prosjektplan.docx' }],
      currentLibrary: { id: 'lib-1', title: 'Prosjektdokumenter' },
      currentFolderUrl: '/sites/frisbee/Delte dokumenter/Møter',
      templateLibrary: {
        title: resource.Lists_TemplateLibrary_Title,
        url: `${HUB}/${resource.Lists_TemplateLibrary_Title}`
      }
    })
    fireEvent.click(screen.getByText(strings.TemplateLibrarySelectModalTitle))
    expect(screen.queryByText(strings.TemplateLibrarySelectModalTitle)).toBeNull()
  })

  it('uses the template library of its properties, and the first library outside a known one', async () => {
    const { command } = await selectorCommand({ templateLibrary: 'Maler for bygg' })
    ;(command as any).context.pageContext.list.id = { toString: () => 'lib-9' }
    await execute(command)
    expect(opened.context.templateLibrary).toEqual({
      title: 'Maler for bygg',
      url: `${HUB}/Maler for bygg`
    })
    expect(opened.context.currentLibrary).toEqual({ id: 'lib-2', title: 'Dokumenter' })
    expect(opened.context.currentFolderUrl).toBeUndefined()
    fireEvent.click(screen.getByText(strings.TemplateLibrarySelectModalTitle))
  })

  it('loads the templates once', async () => {
    const { command } = await selectorCommand()
    await execute(command)
    fireEvent.click(screen.getByText(strings.TemplateLibrarySelectModalTitle))
    await execute(command)
    expect(adapter.configure).toHaveBeenCalledTimes(1)
    expect(adapter.getDocumentTemplates).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText(strings.TemplateLibrarySelectModalTitle))
  })

  it('gives the focus back to what opened it when it is dismissed (WCAG 2.4.3)', async () => {
    const { command } = await selectorCommand()
    // SharePoint's command bar button: the dialog opens in a place of its own, with no trigger of
    // Fluent's to give the focus back to.
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    await execute(command)
    const dialog = screen.getByText(strings.TemplateLibrarySelectModalTitle)
    dialog.focus()
    fireEvent.click(dialog)
    expect(opener).toHaveFocus()
    opener.remove()
  })

  it('opens from SharePoint\'s "Mer" menu once the menu has closed, and gives the focus back to the menu\'s button (WCAG 4.1.2, 2.4.3)', async () => {
    const { command } = await selectorCommand()
    // The command runs while SharePoint's menu has the focus. Rendered then, the dialog is hidden
    // from screen readers by SharePoint's own focus manager as the menu closes, and the focus
    // would go back to the menu item, which is gone.
    const more = document.createElement('button')
    const menu = document.createElement('div')
    menu.setAttribute('role', 'menu')
    const item = document.createElement('button')
    item.setAttribute('role', 'menuitem')
    menu.appendChild(item)
    document.body.append(more, menu)
    item.focus()
    // The clock stands still, so the wait for the menu to close cannot time out however slow the
    // worker is; it would then open with the focus still in the menu.
    const now = jest.spyOn(Date, 'now').mockReturnValue(Date.now())
    try {
      const opening = command.onExecute({ itemId: OPEN } as any)
      await act(() => new Promise((resolve) => setTimeout(resolve, 100)))
      expect(screen.queryByText(strings.TemplateLibrarySelectModalTitle)).toBeNull()
      menu.remove()
      more.focus()
      await act(() => opening)
    } finally {
      now.mockRestore()
    }
    const dialog = screen.getByText(strings.TemplateLibrarySelectModalTitle)
    dialog.focus()
    fireEvent.click(dialog)
    expect(more).toHaveFocus()
    more.remove()
  })

  it('says it is not available, and opens nothing, when the hub is out of reach', async () => {
    adapter.portalDataService.isAvailable = false
    const { command, raiseOnChange, open } = await selectorCommand()
    await execute(command)
    expect(opened.context).toBeUndefined()
    expect(raiseOnChange).toHaveBeenCalled()
    command.onListViewUpdated()
    expect(open.title).toBe(strings.TemplateSelectorCommandDisabledTitle)
    // No error to count: nothing failed here, and a hub out of reach closes usage statistics.
    expect(countedTelemetry()).toEqual({ usage: {}, errors: {}, timings: {} })
  })

  it('tries again after a failed load', async () => {
    adapter.configure.mockImplementationOnce(() => Promise.reject(new Error('503')))
    const { command, open } = await selectorCommand()
    await execute(command)
    expect(opened.context).toBeUndefined()
    command.onListViewUpdated()
    expect(open.title).toBe(strings.TemplateSelectorCommandDisabledTitle)
    await execute(command)
    expect(opened.context.templates).toEqual([{ name: 'Prosjektplan.docx' }])
    fireEvent.click(screen.getByText(strings.TemplateLibrarySelectModalTitle))
  })
})

/**
 * The command set and usage statistics: they start with the page, get the hub once the command
 * has loaded its data, count what the dialog does for the command, and are sent before the page
 * reloads after a copy.
 */
describe('TemplateSelectorCommand and usage statistics', () => {
  it('starts usage statistics for the page, and gives them the hub when the command first loads its data', async () => {
    adapter.portalDataService = hubPortal(settingsMap('2'))
    const { command } = await selectorCommand()
    expect(telemetryStore().page).toMatchObject({
      host: 'contoso.sharepoint.com',
      siteId: PROJECT_SITE_ID,
      hubSiteId: HUB_SITE_ID,
      isHubPage: false,
      appVersion: '1.15.0',
      isDebug: false
    })
    expect(telemetryStore().anchor).toBeUndefined()
    await execute(command)
    await settle()
    expect(telemetryStore().anchor.portal).toBe(adapter.portalDataService)
    // The adapter has read no settings, so the level comes from the hub's own, cached read.
    expect(adapter.portalDataService.getGlobalSettings).toHaveBeenCalledTimes(1)
    expect(getTelemetryGate().level).toBe(2)
    // The hub is asked once what kind of site this is.
    expect(adapter.portalDataService.getSiteKind.mock.calls).toEqual([[PROJECT_SITE_ID]])
    expect(countedTelemetry()).toEqual({ usage: {}, errors: {}, timings: {} })
    fireEvent.click(screen.getByText(strings.TemplateLibrarySelectModalTitle))
  })

  it('counts what the dialog does for the command, under the alias of its manifest, and reloads nothing when it only closes', async () => {
    const { command } = await selectorCommand()
    await execute(command)
    fireEvent.click(screen.getByText(COPY))
    expect(countedTelemetry().usage).toEqual({ [`${ALIAS} documentTemplates.copied`]: 1 })
    fireEvent.click(screen.getByText(strings.TemplateLibrarySelectModalTitle))
    expect(leaving).toEqual([])
  })

  it('sends what it has counted before it reloads the page after a copy', async () => {
    const { command } = await selectorCommand()
    await execute(command)
    fireEvent.click(screen.getByText(COPY))
    fireEvent.click(screen.getByText(CLOSE_AFTER_COPY))
    expect(screen.queryByText(strings.TemplateLibrarySelectModalTitle)).toBeNull()
    expect(leaving).toEqual(['urgent flush', 'reload'])
  })

  it('counts a load that fails by the status it failed with, once', async () => {
    adapter.configure.mockImplementationOnce(() =>
      Promise.reject(Object.assign(new Error('Tjenesten er ikke tilgjengelig'), { status: 503 }))
    )
    const { command } = await selectorCommand()
    await execute(command)
    expect(opened.context).toBeUndefined()
    const failed = { usage: {}, errors: { [`${ALIAS} server_error 503`]: 1 }, timings: {} }
    expect(countedTelemetry()).toEqual(failed)
    // The next try loads: the failure is not counted again.
    await execute(command)
    expect(countedTelemetry()).toEqual(failed)
    fireEvent.click(screen.getByText(strings.TemplateLibrarySelectModalTitle))
  })
})
