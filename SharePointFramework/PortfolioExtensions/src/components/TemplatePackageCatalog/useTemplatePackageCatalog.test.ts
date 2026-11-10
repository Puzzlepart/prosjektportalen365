// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The services and the data adapter reach the hub; they are
// stand-ins, and the feature flags are the real ones.
const services = {
  CatalogService: { getCatalog: jest.fn(), revalidateCatalog: jest.fn() },
  TemplateOptionsService: {
    getItems: jest.fn(),
    buildCrossReference: jest.fn(),
    remove: jest.fn()
  },
  ProjectExtensionsService: { getCrossReference: jest.fn(), remove: jest.fn() },
  TelemetryService: { track: jest.fn() },
  PackageInstaller: {}
}
jest.mock('services', () => ({
  ...services,
  featureFlags: jest.requireActual('services/featureFlags').featureFlags
}))
jest.mock('data/SPDataAdapter', () => ({
  __esModule: true,
  default: { getInstalledPPVersion: () => Promise.resolve('1.15.0') }
}))

import { act, renderHook, waitFor } from '@testing-library/react'
import strings from 'PortfolioExtensionsStrings'
import { useTemplatePackageCatalog } from './useTemplatePackageCatalog'

/**
 * The template package catalog's removal of a package from the hub: told as done only when the
 * package is gone, and tracked as what it was.
 */
const TEMPLATE = { id: 'Byggprosjekt', name: 'Byggprosjekt', version: '2.0.0', type: 'template' }
const EXTENSION = {
  id: 'Risikotillegg',
  name: 'Risikotillegg',
  version: '1.0.0',
  type: 'extension'
}

/** The catalog with both packages installed, its hook rendered and loaded. */
async function renderCatalog() {
  services.CatalogService.getCatalog.mockResolvedValue({
    catalog: { packages: [TEMPLATE, EXTENSION] },
    degraded: false,
    fromCache: false
  })
  services.TemplateOptionsService.getItems.mockResolvedValue([])
  services.TemplateOptionsService.buildCrossReference.mockReturnValue(
    new Map([['byggprosjekt', { itemId: 7, installedVersion: '2.0.0', packageType: 'Importert' }]])
  )
  services.ProjectExtensionsService.getCrossReference.mockResolvedValue(
    new Map([['risikotillegg', { itemId: 3, installedVersion: '1.0.0', packageType: 'Importert' }]])
  )
  const { result } = renderHook(() =>
    useTemplatePackageCatalog({
      catalogUrl: 'https://katalog.example/catalog.json',
      onDismiss: jest.fn()
    } as any)
  )
  await waitFor(() => expect(result.current.state.loading).toBe(false))
  return result
}

/** The statuses the removals were tracked with. */
const trackedStatuses = () =>
  services.TelemetryService.track.mock.calls
    .filter(([, event]) => event.action === 'remove')
    .map(([, event]) => event.status)

beforeEach(() => jest.clearAllMocks())

describe('useTemplatePackageCatalog, removing a package', () => {
  it('tells and tracks a template the template options list refused to remove as a failure', async () => {
    // The list's refusal came back as false, not as an error, and was told and tracked as a
    // success.
    services.TemplateOptionsService.remove.mockResolvedValue(false)
    const result = await renderCatalog()
    await act(() => result.current.removePackage(TEMPLATE as any))
    expect(services.TemplateOptionsService.remove).toHaveBeenCalledWith(7)
    expect(result.current.state.notification).toEqual({
      intent: 'error',
      text: strings.CatalogRemoveErrorText
    })
    expect(trackedStatuses()).toEqual(['error'])
  })

  it('tells and tracks a template that was removed as done', async () => {
    services.TemplateOptionsService.remove.mockResolvedValue(true)
    const result = await renderCatalog()
    await act(() => result.current.removePackage(TEMPLATE as any))
    expect(result.current.state.notification).toEqual({
      intent: 'success',
      text: strings.CatalogRemoveSuccessText
    })
    expect(trackedStatuses()).toEqual(['success'])
  })

  it('tells and tracks an extension the library refused to remove as a failure', async () => {
    services.ProjectExtensionsService.remove.mockRejectedValue(new Error(''))
    const result = await renderCatalog()
    await act(() => result.current.removePackage(EXTENSION as any))
    expect(services.ProjectExtensionsService.remove).toHaveBeenCalledWith(3)
    expect(result.current.state.notification).toEqual({
      intent: 'error',
      text: strings.CatalogRemoveErrorTextExtension
    })
    expect(trackedStatuses()).toEqual(['error'])
  })
})
