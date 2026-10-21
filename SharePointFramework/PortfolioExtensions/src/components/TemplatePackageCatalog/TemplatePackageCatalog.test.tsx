// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The parts of the details that fetch (the content summary, the
// history, the screenshots) are not under test here and render nothing.
jest.mock('./PackageDetails/PackageContentSummary', () => ({ PackageContentSummary: () => null }))
jest.mock('./PackageDetails/PackageHistory', () => ({ PackageHistory: () => null }))
jest.mock('./PackageDetails/PackageScreenshots', () => ({ PackageScreenshots: () => null }))

import { AriaLiveAnnouncer } from '@fluentui/react-components'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { InstallStepKey, PpPkgType } from 'models'
import strings from 'PortfolioExtensionsStrings'
import { format } from 'pp365-shared-library'
import * as React from 'react'
import { CatalogToolbar } from './CatalogToolbar'
import { TemplatePackageCatalogContext } from './context'
import { InstallProgress } from './InstallProgress'
import { PackageDetails } from './PackageDetails'
import { PackageList } from './PackageList'
import { ALL_FILTER } from './types'

/**
 * The template package catalog's parts, each under a context stand-in: the list of packages to
 * choose from, the toolbar that searches and filters them, the chosen package's details, and the
 * progress of an installation.
 */
// jsdom has no `scrollTo` on elements; the details scroll their pane to the top when chosen.
if (!Element.prototype.scrollTo) Element.prototype.scrollTo = () => undefined

const PACKAGES = [
  { id: 'a', name: 'Standardmal', version: '1.0.0', type: 'template' },
  { id: 'b', name: 'Byggprosjekt', version: '2.0.0', type: 'template' }
] as any[]

function context(overrides: Record<string, any> = {}, state: Record<string, any> = {}) {
  return {
    props: {},
    state: {
      loading: false,
      degraded: false,
      crossRef: new Map(),
      filters: {
        search: '',
        type: ALL_FILTER,
        categories: [],
        status: 'all',
        language: ALL_FILTER,
        compatibleOnly: false
      },
      sort: 'newest',
      renderMode: 'grid',
      selectedPackageId: 'a',
      detailOpen: false,
      ...state
    },
    setState: jest.fn(),
    open: true,
    close: jest.fn(),
    filteredPackages: PACKAGES,
    categories: [],
    languages: [],
    activeFilterCount: 0,
    hasActiveFilters: false,
    selectedPackage: PACKAGES[0],
    crossRefFor: (): undefined => undefined,
    isSupported: () => true,
    setFilter: jest.fn(),
    setCompatibleOnly: jest.fn(),
    setCategories: jest.fn(),
    clearFilters: jest.fn(),
    reloadCatalog: jest.fn(),
    setSort: jest.fn(),
    setRenderMode: jest.fn(),
    setSelected: jest.fn(),
    closeDetail: jest.fn(),
    importPackage: jest.fn(),
    publishCentral: jest.fn(),
    removePackage: jest.fn(),
    resolveCompatibility: jest.fn(),
    ...overrides
  } as any
}

/**
 * Renders a part under the context stand-in. The announcer goes in first, as the catalog's root
 * is there before an installation starts: a message sent while the announcer mounts waits in its
 * queue.
 */
function renderIn(value: any, element: React.ReactElement) {
  const tree = (content: React.ReactElement | null) => (
    <AriaLiveAnnouncer>
      <TemplatePackageCatalogContext.Provider value={value}>
        {content}
      </TemplatePackageCatalogContext.Provider>
    </AriaLiveAnnouncer>
  )
  const result = render(tree(null))
  result.rerender(tree(element))
  return result
}

/**
 * What the announcer's live region holds now. It writes each message as `innerText` on a span of
 * its own, which jsdom keeps as a property rather than as text: the newest message is the last.
 */
const announced = () =>
  Array.from(document.body.querySelectorAll('[aria-live]'))
    .map((region) => {
      const spans = region.querySelectorAll('span')
      const span = spans[spans.length - 1] as HTMLElement | undefined
      return (span && (span.innerText || span.textContent)) || region.textContent || ''
    })
    .join(' ')

describe('TemplatePackageCatalog', () => {
  it('lists the packages as buttons that choose one, the chosen marked current (WCAG 4.1.2)', () => {
    renderIn(context(), <PackageList />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    // A card was a list item that could be chosen, with `aria-selected`, which a list item has not.
    expect(within(items[0]).getByRole('button', { name: 'Standardmal' })).toHaveAttribute(
      'aria-current',
      'true'
    )
    expect(within(items[1]).getByRole('button', { name: 'Byggprosjekt' })).not.toHaveAttribute(
      'aria-current'
    )
    expect(document.querySelector('[role="listitem"][aria-selected]')).toBeNull()
  })

  it('searches and filters as a named search, its view buttons a group named for what they choose (WCAG 1.3.1, 4.1.2)', () => {
    renderIn(context(), <CatalogToolbar />)
    // It was a toolbar, which takes one stop and the arrow keys, holding a search box and lists.
    expect(screen.queryByRole('toolbar')).toBeNull()
    expect(screen.getByRole('search', { name: strings.CatalogToolbarLabel })).toBeInTheDocument()
    const view = screen.getByRole('group', { name: strings.CatalogViewLabel })
    expect(within(view).getByRole('button', { name: strings.CatalogViewGrid })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('names the package by a heading the focus goes to, and keeps an action it cannot run focusable, with the reason (WCAG 1.3.1, 2.4.3, 2.1.1)', () => {
    const pkg = { ...PACKAGES[0], minPPVersion: '1.16.0' }
    renderIn(
      context({ selectedPackage: pkg, isSupported: () => false }, { detailOpen: true }),
      <PackageDetails />
    )
    // The focus went to the pane's frame, which has no name and no outline.
    expect(screen.getByRole('heading', { level: 3, name: 'Standardmal' })).toHaveFocus()
    const action = screen.getByRole('button', { name: strings.CatalogActionImport })
    expect(action).toHaveAttribute('aria-disabled', 'true')
    expect(action).not.toHaveAttribute('disabled')
  })

  it('gives the focus back to the package when its installation is closed (WCAG 2.4.3)', () => {
    const value = context({}, { focusDetails: true })
    renderIn(value, <PackageDetails />)
    expect(screen.getByRole('heading', { level: 3, name: 'Standardmal' })).toHaveFocus()
    expect(value.setState).toHaveBeenCalledWith({ focusDetails: false })
  })

  it('names its progress and the status of each step, says whether its log is open, tells each step as it starts, and takes the focus (WCAG 1.1.1, 2.4.3, 4.1.2, 4.1.3)', async () => {
    const progress = {
      status: 'running',
      steps: [
        { key: InstallStepKey.Download, status: 'done' },
        { key: InstallStepKey.Unzip, status: 'running' }
      ],
      log: [{ group: 'Nedlasting', message: 'Lastet ned', level: 'info' }]
    }
    renderIn(context({}, { installProgress: progress }), <InstallProgress />)
    const label = format(strings.CatalogInstallProgressLabel, 'Standardmal')
    // The details it replaced held the button that started it: the focus comes here.
    expect(screen.getByRole('region', { name: label })).toHaveFocus()
    expect(screen.getByRole('progressbar', { name: label })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: strings.CatalogStepStatusDone })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: strings.CatalogStepStatusRunning })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.CatalogAdvancedLogLabel })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    // The announcer sends its messages a moment later.
    await waitFor(() => expect(announced()).toContain(strings.CatalogStepUnzip))
  })

  it('gives the focus back to the details as its installation is closed', () => {
    const value = context(
      {},
      {
        installProgress: {
          status: 'success',
          steps: [{ key: InstallStepKey.Download, status: 'done' }],
          log: []
        }
      }
    )
    renderIn(value, <InstallProgress />)
    fireEvent.click(screen.getByRole('button', { name: strings.CloseLabel }))
    expect(value.setState).toHaveBeenCalledWith({ installProgress: undefined, focusDetails: true })
  })
})

describe('TemplatePackageCatalog, its behaviour', () => {
  afterEach(async () => {
    cleanup()
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
  })

  const details = (pkg: Record<string, any>, ref?: Record<string, any>, state = {}) => {
    const value = context(
      { selectedPackage: { ...PACKAGES[0], ...pkg }, crossRefFor: () => ref },
      state
    )
    renderIn(value, <PackageDetails />)
    return value
  }
  const button = (name: string) => screen.getByRole('button', { name })

  it('updates an imported template, removes it after asking, and publishes it as a cloud template', () => {
    const value = details({}, { packageType: PpPkgType.Importert, updateAvailable: true })
    fireEvent.click(button(format(strings.CatalogActionUpdate, '1.0.0')))
    expect(value.importPackage).toHaveBeenCalledWith(value.selectedPackage)
    fireEvent.click(button(strings.CatalogActionPublishCentral))
    expect(value.publishCentral).toHaveBeenCalledWith(value.selectedPackage)
    fireEvent.click(button(strings.CatalogActionRemoveImport))
    expect(screen.getByRole('dialog', { name: strings.CatalogRemoveConfirmTitle })).toBeVisible()
    fireEvent.click(button(strings.CatalogRemoveConfirmButton))
    expect(value.removePackage).toHaveBeenCalledWith(value.selectedPackage)
  })

  it('reinstalls a template that is up to date, and keeps one that cannot be a cloud template from being published', () => {
    details({ cloudCompatible: false }, { packageType: PpPkgType.Importert })
    expect(button(strings.CatalogActionReinstall)).toBeInTheDocument()
    expect(button(strings.CatalogActionPublishCentral)).toHaveAttribute('aria-disabled', 'true')
  })

  it('removes a cloud template, which is published already', () => {
    const value = details({}, { packageType: PpPkgType.Sentral })
    expect(button(strings.CatalogActionPublishCentral)).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(button(strings.CatalogActionRemoveCentral))
    fireEvent.click(button(strings.CatalogRemoveConfirmButton))
    expect(value.removePackage).toHaveBeenCalled()
  })

  it('keeps the actions focusable while one runs', () => {
    details({}, { packageType: PpPkgType.Importert }, { busyAction: 'remove' })
    expect(button(strings.CatalogActionReinstall)).toHaveAttribute('aria-disabled', 'true')
    expect(button(strings.CatalogActionRemoveImport)).toHaveAttribute('aria-disabled', 'true')
  })

  it('adds, updates and reinstalls an extension, and asks before replacing one made by hand', () => {
    details({ type: 'extension' })
    expect(button(strings.CatalogActionAddExtension)).toBeInTheDocument()
    expect(screen.getByText(strings.CatalogExtensionInfo)).toBeInTheDocument()
    cleanup()
    details({ type: 'extension' }, { packageType: PpPkgType.Importert, updateAvailable: true })
    expect(button(format(strings.CatalogActionUpdateExtension, '1.0.0'))).toBeInTheDocument()
    expect(button(strings.CatalogActionRemove)).toBeInTheDocument()
    cleanup()
    details({ type: 'extension' }, { packageType: PpPkgType.Importert })
    expect(button(strings.CatalogActionReinstallExtension)).toBeInTheDocument()
    cleanup()
    const value = details(
      { type: 'extension' },
      { packageType: PpPkgType.Importert, unmanaged: true }
    )
    fireEvent.click(button(strings.CatalogActionReplaceExtension))
    expect(screen.getByRole('dialog', { name: strings.CatalogReplaceConfirmTitle })).toBeVisible()
    fireEvent.click(button(strings.CatalogReplaceConfirmButton))
    expect(value.importPackage).toHaveBeenCalled()
  })

  it("shows the package's description, tags and requirements, filters by a tag and goes back", () => {
    const value = details({
      description: 'Mal for byggeprosjekter',
      tags: ['Bygg'],
      icon: 'Building',
      thumbnail: '/bilde.png',
      minPPVersion: '1.10.0',
      requiresBestillingsportalen: true,
      requiresEntra: true,
      languages: ['nb', 'en'],
      hidden: true
    })
    expect(screen.getByText('Mal for byggeprosjekter')).toBeInTheDocument()
    expect(screen.getByText(format(strings.CatalogRequiresPP, '1.10.0'))).toBeInTheDocument()
    expect(screen.getByText(strings.CatalogRequiresBestillingsportalen)).toBeInTheDocument()
    expect(screen.getByText(strings.CatalogBadgeHidden)).toBeInTheDocument()
    // A thumbnail that cannot be fetched is left out.
    const thumbnail = document.querySelector('img')
    fireEvent.error(thumbnail)
    expect(document.querySelector('img')).toBeNull()
    fireEvent.click(screen.getByText('Bygg'))
    expect(value.setCategories).toHaveBeenCalledWith(['Bygg'])
    expect(value.closeDetail).toHaveBeenCalled()
    fireEvent.click(button(strings.CatalogBackToListText))
    expect(value.closeDetail).toHaveBeenCalledTimes(2)
  })

  it('says so when no package is chosen', () => {
    renderIn(context({ selectedPackage: undefined }), <PackageDetails />)
    expect(screen.getByText(strings.CatalogDetailsEmptyText)).toBeInTheDocument()
  })

  it("marks each card with its package's state, and chooses a package by click or key", () => {
    const refs: Record<string, any> = {
      a: { packageType: PpPkgType.Sentral, updateAvailable: true },
      b: { packageType: PpPkgType.Importert }
    }
    const value = context({
      filteredPackages: [
        ...PACKAGES,
        { id: 'c', name: 'Egen', version: '1.0.0', type: 'extension', minPPVersion: '9.0.0' }
      ],
      crossRefFor: (id: string) => refs[id] ?? (id === 'c' ? { unmanaged: true } : undefined),
      isSupported: (pkg: any) => !pkg.minPPVersion
    })
    renderIn(value, <PackageList />)
    expect(screen.getByText(strings.CatalogBadgeCentral)).toBeInTheDocument()
    expect(screen.getByText(strings.CatalogStatusUpdate)).toBeInTheDocument()
    expect(screen.getByText(strings.CatalogBadgeImported)).toBeInTheDocument()
    expect(screen.getByText(strings.CatalogBadgeLocal)).toBeInTheDocument()
    expect(screen.getByText(format(strings.CatalogRequiresVersion, '9.0.0'))).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Byggprosjekt' }))
    expect(value.setSelected).toHaveBeenCalledWith('b')
    fireEvent.keyDown(screen.getByRole('button', { name: 'Egen' }), { key: 'Enter' })
    expect(value.setSelected).toHaveBeenCalledWith('c')
  })

  it('says so when no package matches, and clears the filters', () => {
    const value = context({ filteredPackages: [], hasActiveFilters: true })
    renderIn(value, <PackageList />)
    expect(screen.getByText(strings.CatalogNoResultsTitle)).toBeInTheDocument()
    fireEvent.click(button(strings.CatalogClearFiltersText))
    expect(value.clearFilters).toHaveBeenCalled()
  })

  it('searches as the user stops typing, switches the view, filters on compatibility and clears the filters', async () => {
    const value = context(
      {
        hasActiveFilters: true,
        activeFilterCount: 2,
        languages: ['nb', 'en'],
        categories: ['Bygg', 'Vei', 'Bane']
      },
      {
        filters: {
          search: '',
          type: ALL_FILTER,
          categories: ['Bygg', 'Vei', 'Bane'],
          status: 'all',
          language: ALL_FILTER,
          compatibleOnly: false
        }
      }
    )
    renderIn(value, <CatalogToolbar />)
    expect(
      screen.getByText(
        `${strings.CatalogFilterCategoryLabel}: ${format(strings.CatalogFilterCategorySelectedCount, 3)}`
      )
    ).toBeInTheDocument()
    const search = screen.getByRole('searchbox', { name: strings.CatalogSearchPlaceholder })
    fireEvent.change(search, { target: { value: 'bygg' } })
    await waitFor(() => expect(value.setFilter).toHaveBeenCalledWith('search', 'bygg'))
    fireEvent.click(button(strings.CatalogViewList))
    expect(value.setRenderMode).toHaveBeenCalledWith('list')
    fireEvent.click(button(strings.CatalogViewGrid))
    expect(value.setRenderMode).toHaveBeenCalledWith('grid')
    fireEvent.click(screen.getByRole('switch', { name: strings.CatalogFilterCompatibleOnly }))
    expect(value.setCompatibleOnly).toHaveBeenCalledWith(true)
    fireEvent.click(button(format(strings.CatalogClearFiltersCount, 2)))
    expect(value.clearFilters).toHaveBeenCalled()
    expect(search).toHaveFocus()
  })

  it('shows a failed installation with its log open, its steps, and a retry that keeps the focus', () => {
    const progress = {
      status: 'error',
      error: 'Malen kunne ikke lagres',
      steps: [
        { key: InstallStepKey.Download, status: 'done' },
        { key: InstallStepKey.Unzip, status: 'skipped' },
        { key: InstallStepKey.ProvisionHub, status: 'error', detail: 'Feltet finnes' },
        { key: InstallStepKey.Content, status: 'pending' }
      ],
      log: [
        { group: 'Område', message: 'Lager felt', level: 'info' },
        { group: 'Område', message: 'Feltet finnes alt', level: 'warning' },
        { group: 'Område', message: 'Kunne ikke lagre', level: 'error' }
      ]
    }
    const value = context({}, { installProgress: progress })
    renderIn(value, <InstallProgress />)
    for (const status of [
      strings.CatalogStepStatusSkipped,
      strings.CatalogStepStatusError,
      strings.CatalogStepStatusPending
    ]) {
      expect(screen.getByRole('img', { name: status })).toBeInTheDocument()
    }
    expect(screen.getByText('Feltet finnes')).toBeInTheDocument()
    // An error opens the log.
    expect(button(strings.CatalogAdvancedLogLabel)).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Kunne ikke lagre')).toBeInTheDocument()
    expect(screen.getByText(strings.CatalogInstallErrorTitle)).toBeInTheDocument()
    fireEvent.click(button(strings.CatalogRetryText))
    expect(value.importPackage).toHaveBeenCalledWith(value.selectedPackage)
    expect(
      screen.getByRole('region', {
        name: format(strings.CatalogInstallProgressLabel, 'Standardmal')
      })
    ).toHaveFocus()
  })

  it("opens and closes the log of a running installation, and tells an extension's success", () => {
    const running = {
      status: 'running',
      steps: [{ key: InstallStepKey.Download, status: 'running' }],
      log: [{ group: 'Nedlasting', message: 'Henter pakken', level: 'info' }]
    }
    renderIn(context({}, { installProgress: running }), <InstallProgress />)
    fireEvent.click(button(strings.CatalogAdvancedLogLabel))
    expect(button(strings.CatalogAdvancedLogLabel)).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Henter pakken')).toBeInTheDocument()
    cleanup()
    renderIn(
      context(
        { selectedPackage: { ...PACKAGES[0], type: 'extension' } },
        { installProgress: { status: 'success', steps: [], log: [] } }
      ),
      <InstallProgress />
    )
    // No steps yet: the download is under way.
    expect(screen.getByText(strings.CatalogStepDownload)).toBeInTheDocument()
  })
})
