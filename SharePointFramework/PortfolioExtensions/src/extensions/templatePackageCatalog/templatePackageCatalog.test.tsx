// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The catalog itself is out of scope here: it is a stand-in that
// shows the props it got and closes through `onDismiss`. The services module is cut down to the
// feature flags, so the installer and its provisioning engine stay out of the test.
const adapter = {
  configure: jest.fn(() => Promise.resolve()),
  sp: { web: { currentUserHasPermissions: jest.fn(() => Promise.resolve(true)) } }
}
jest.mock('../../data/SPDataAdapter', () => ({ __esModule: true, default: adapter }))
jest.mock('components/TemplatePackageCatalog', () => {
  const React = jest.requireActual('react')
  return {
    TemplatePackageCatalog: ({ catalogUrl, onDismiss }: any) =>
      React.createElement('button', { onClick: onDismiss }, `Katalog fra ${catalogUrl}`)
  }
})
jest.mock('services', () => ({
  featureFlags: jest.requireActual('services/featureFlags').featureFlags
}))

import { act, fireEvent, screen } from '@testing-library/react'
import strings from 'PortfolioExtensionsStrings'
import resource from 'SharedResources'
import TemplatePackageCatalogCommandSet from '.'
import { HUB, commandSetContext, execute } from '../testFixtures'

const OPEN = 'OPEN_TEMPLATE_PACKAGE_CATALOG'
const TEMPLATE_OPTIONS = `/sites/pp365/${resource.Lists_TemplateOptions_Url}`

// SPFx's build replaces DEBUG; under Jest it is a plain global.
;(globalThis as any).DEBUG = false

/** The command set on the list at `serverRelativeUrl`, initialised. */
async function catalogCommand(serverRelativeUrl = TEMPLATE_OPTIONS) {
  const { context, changed } = commandSetContext({ listTitle: 'Maloppsett', serverRelativeUrl })
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
    act(() => command.onExecute(execute(OPEN)))
    const catalog = screen.getByText('Katalog fra https://katalog.example/catalog.json')
    expect(catalog.parentElement.parentElement).toBe(document.body)
    act(() => {
      fireEvent.click(catalog)
    })
    expect(screen.queryByText(/Katalog fra/)).toBeNull()

    // Opened again, it reuses its place on the page.
    act(() => command.onExecute(execute(OPEN)))
    act(() => command.onExecute(execute(OPEN)))
    expect(screen.getAllByText(/Katalog fra/)).toHaveLength(1)
    act(() => {
      fireEvent.click(screen.getByText(/Katalog fra/))
    })
    expect(document.body.querySelectorAll(':scope > div')).toHaveLength(1)
  })

  it('ignores the commands of other command sets', async () => {
    const { command } = await catalogCommand()
    act(() => command.onExecute(execute('ANNEN')))
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
