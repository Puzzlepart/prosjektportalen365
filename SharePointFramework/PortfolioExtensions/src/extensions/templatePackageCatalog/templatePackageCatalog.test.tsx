// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The catalog itself is out of scope here: it is a stand-in that
// shows the props it got, and the alias its hooks would count for, and closes through
// `onDismiss`. The services module is cut down to the feature flags, so the installer and its
// provisioning engine stay out of the test. The adapter's portal data service is the hub usage
// statistics read their level through, once a test sets it.
const adapter = {
  configure: jest.fn(() => Promise.resolve()),
  sp: { web: { currentUserHasPermissions: jest.fn(() => Promise.resolve(true)) } },
  portalDataService: undefined as any
}
jest.mock('../../data/SPDataAdapter', () => ({ __esModule: true, default: adapter }))
jest.mock('components/TemplatePackageCatalog', () => {
  const React = jest.requireActual('react')
  const { TelemetryContext } = jest.requireActual('pp365-shared-library/lib/telemetry')
  return {
    TemplatePackageCatalog: ({ catalogUrl, onDismiss }: any) =>
      React.createElement(
        'button',
        { onClick: onDismiss, 'data-telemetry': React.useContext(TelemetryContext) },
        `Katalog fra ${catalogUrl}`
      )
  }
})
jest.mock('services', () => ({
  featureFlags: jest.requireActual('services/featureFlags').featureFlags
}))

import { act, fireEvent, screen } from '@testing-library/react'
import strings from 'PortfolioExtensionsStrings'
import { getTelemetryGate } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  hubPortal,
  ITelemetryTestBed,
  settingsMap,
  settle,
  telemetryTestBed
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import resource from 'SharedResources'
import TemplatePackageCatalogCommandSet from '.'
import { HUB, commandSetContext, execute, manifestAlias } from '../testFixtures'

const OPEN = 'OPEN_TEMPLATE_PACKAGE_CATALOG'
const TEMPLATE_OPTIONS = `/sites/pp365/${resource.Lists_TemplateOptions_Url}`
const ALIAS = manifestAlias('templatePackageCatalog')

// SPFx's build replaces DEBUG; under Jest it is a plain global.
;(globalThis as any).DEBUG = false

/**
 * The command set on the list at `serverRelativeUrl`, initialised. With `telemetry` its context
 * is a page on the hub as usage statistics read it.
 */
async function catalogCommand(serverRelativeUrl = TEMPLATE_OPTIONS, telemetry = false) {
  const { context, changed } = commandSetContext({
    listTitle: 'Maloppsett',
    serverRelativeUrl,
    telemetry: telemetry ? { alias: ALIAS } : undefined
  })
  const command = new TemplatePackageCatalogCommandSet()
  ;(command as any).context = context
  ;(command as any).properties = { catalogUrl: 'https://katalog.example/catalog.json' }
  const raiseOnChange = jest.spyOn(command, 'raiseOnChange')
  await command.onInit()
  return { command, context, changed, raiseOnChange, open: command.tryGetCommand(OPEN) }
}

afterEach(() => {
  // The command set renders into a placeholder of its own on the page, outside what Testing
  // Library cleans up; the tests dismiss what they open, and the empty placeholders go here.
  document.body.querySelectorAll(':scope > div').forEach((placeholder) => placeholder.remove())
})

beforeEach(() => {
  adapter.configure.mockImplementation(() => Promise.resolve())
  adapter.sp.web.currentUserHasPermissions.mockImplementation(() => Promise.resolve(true))
  adapter.portalDataService = undefined
  sessionStorage.clear()
})

describe('TemplatePackageCatalogCommandSet', () => {
  it('shows the catalog to hub admins on the template options list', async () => {
    const { open, raiseOnChange } = await catalogCommand()
    expect(adapter.configure).toHaveBeenCalledWith(expect.anything(), {
      siteId: 'site-1',
      webUrl: HUB
    })
    expect(open.title).toBe(strings.TemplatePackageCatalogCommandTitle)
    expect(open.iconImageUrl).toMatch(/^data:image\/svg\+xml,/)
    expect(open.visible).toBe(true)
    expect(raiseOnChange).toHaveBeenCalled()
  })

  it('hides it on other lists', async () => {
    const { open } = await catalogCommand('/sites/pp365/Lists/Prosjekter')
    expect(open.visible).toBe(false)
  })

  it('hides it from users who cannot manage the hub', async () => {
    adapter.sp.web.currentUserHasPermissions.mockImplementation(() => Promise.resolve(false))
    const { open } = await catalogCommand()
    expect(open.visible).toBe(false)
  })

  it('hides it when the hub cannot be reached', async () => {
    adapter.configure.mockImplementation(() => Promise.reject(new Error('403')))
    const { open } = await catalogCommand()
    expect(open.visible).toBe(false)
  })

  it('follows the list view to and from the template options list', async () => {
    const { context, changed, open } = await catalogCommand('/sites/pp365/Lists/Prosjekter')
    context.pageContext.list.serverRelativeUrl = TEMPLATE_OPTIONS
    await changed()
    expect(open.visible).toBe(true)
  })

  it('keeps ?showHidden=1 for the session while the URL still has it', async () => {
    window.history.replaceState({}, '', `${TEMPLATE_OPTIONS}/AllItems.aspx?showHidden=1`)
    await catalogCommand()
    expect(sessionStorage.getItem('PP_SHOW_HIDDEN')).toBe('1')
    window.history.replaceState({}, '', '/')
  })

  it('opens the catalog on top of the page and removes it when it is dismissed', async () => {
    const { command } = await catalogCommand()
    await act(() => command.onExecute(execute(OPEN)))
    const catalog = screen.getByText('Katalog fra https://katalog.example/catalog.json')
    expect(catalog.parentElement.parentElement).toBe(document.body)
    act(() => {
      fireEvent.click(catalog)
    })
    expect(screen.queryByText(/Katalog fra/)).toBeNull()

    // Opened again, it reuses its place on the page.
    await act(() => command.onExecute(execute(OPEN)))
    await act(() => command.onExecute(execute(OPEN)))
    expect(screen.getAllByText(/Katalog fra/)).toHaveLength(1)
    act(() => {
      fireEvent.click(screen.getByText(/Katalog fra/))
    })
    expect(document.body.querySelectorAll(':scope > div')).toHaveLength(1)
  })

  it('gives the focus back to what opened it when it is dismissed (WCAG 2.4.3)', async () => {
    const { command } = await catalogCommand()
    // SharePoint's command bar button: the catalog opens in a place of its own, with no trigger
    // of Fluent's to give the focus back to.
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    await act(() => command.onExecute(execute(OPEN)))
    const catalog = screen.getByText(/Katalog fra/)
    catalog.focus()
    act(() => {
      fireEvent.click(catalog)
    })
    expect(opener).toHaveFocus()
    opener.remove()
  })

  it('opens from SharePoint\'s "Mer" menu once the menu has closed, and gives the focus back to the menu\'s button (WCAG 4.1.2, 2.4.3)', async () => {
    const { command } = await catalogCommand()
    // The command runs while SharePoint's menu has the focus. Rendered then, the catalog was
    // hidden from screen readers by SharePoint's own focus manager as the menu closed, and the
    // focus went back to the menu item, which was gone.
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
      const opening = command.onExecute(execute(OPEN))
      await act(() => new Promise((resolve) => setTimeout(resolve, 100)))
      expect(screen.queryByText(/Katalog fra/)).toBeNull()
      menu.remove()
      more.focus()
      await act(() => opening)
    } finally {
      now.mockRestore()
    }
    const catalog = screen.getByText(/Katalog fra/)
    catalog.focus()
    act(() => {
      fireEvent.click(catalog)
    })
    expect(more).toHaveFocus()
    more.remove()
  })

  it('ignores the commands of other command sets', async () => {
    const { command } = await catalogCommand()
    await act(() => command.onExecute(execute('ANNEN')))
    expect(screen.queryByText(/Katalog fra/)).toBeNull()
  })

  it('stays out of the way when its command is not on the list', async () => {
    const { context } = commandSetContext({ listTitle: 'Maloppsett' })
    const command = new TemplatePackageCatalogCommandSet()
    ;(command as any).context = context
    ;(command as any).tryGetCommand = () => undefined
    adapter.configure.mockClear()
    await command.onInit()
    expect(adapter.configure).not.toHaveBeenCalled()
  })
})

/**
 * What the command set does for usage statistics, on the hub: it starts them with the hub's
 * level read through the adapter's data service (which the catalog's own events ask the gate
 * through), counts that the catalog was opened, and counts a set-up that failed by its code.
 */
describe('TemplatePackageCatalogCommandSet, usage statistics', () => {
  let bed: ITelemetryTestBed

  beforeEach(() => {
    bed = telemetryTestBed()
  })

  afterEach(() => bed.restore())

  it("starts usage statistics with the hub's level, read through the adapter's data service", async () => {
    adapter.portalDataService = hubPortal(settingsMap('2'))
    await catalogCommand(TEMPLATE_OPTIONS, true)
    await settle()
    // The gate the catalog's events ask: open for them at Standard with the catalog row at 1.
    expect(getTelemetryGate()).toEqual({ level: 2, catalog: true, reason: 'setting' })
    expect(adapter.portalDataService.getGlobalSettings).toHaveBeenCalledTimes(1)
  })

  it('counts that the catalog was opened, and lets its components count for the command set', async () => {
    adapter.portalDataService = hubPortal(settingsMap('2'))
    const { command } = await catalogCommand(TEMPLATE_OPTIONS, true)
    await settle()
    await act(() => command.onExecute(execute(OPEN)))
    expect(countedTelemetry().usage).toEqual({ [`${ALIAS} catalog.opened`]: 1 })
    const catalog = screen.getByText(/Katalog fra/)
    expect(catalog).toHaveAttribute('data-telemetry', ALIAS)
    act(() => {
      fireEvent.click(catalog)
    })
    // Another command set's command opens nothing, and counts nothing.
    await act(() => command.onExecute(execute('ANNEN')))
    expect(countedTelemetry().usage).toEqual({ [`${ALIAS} catalog.opened`]: 1 })
  })

  it('counts a set-up that failed by its error code, and stays hidden', async () => {
    adapter.portalDataService = hubPortal(settingsMap('3'))
    adapter.sp.web.currentUserHasPermissions.mockImplementation(() =>
      Promise.reject(Object.assign(new Error('Ingen tilgang'), { status: 403 }))
    )
    const { open } = await catalogCommand(TEMPLATE_OPTIONS, true)
    await settle()
    expect(open.visible).toBe(false)
    expect(countedTelemetry().errors).toEqual({ [`${ALIAS} permission_denied 403`]: 1 })
  })

  it('sends nothing from a hub with usage statistics off', async () => {
    adapter.portalDataService = hubPortal(settingsMap('0'))
    const { command } = await catalogCommand(TEMPLATE_OPTIONS, true)
    await settle()
    await act(() => command.onExecute(execute(OPEN)))
    act(() => {
      fireEvent.click(screen.getByText(/Katalog fra/))
    })
    bed.leave()
    expect(countedTelemetry().usage).toEqual({})
    expect(bed.fetch).not.toHaveBeenCalled()
  })
})
