// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. An open Fluent popover or menu is positioned against its
// trigger, which costs seconds per test under jsdom (see the testing guide), so the footer's
// popovers and menus are plain stand-ins that keep Fluent's contract: the trigger toggles through
// `onOpenChange` (a render function gets its props, as a split button's menu button does), and the
// surface shows while open, with its props, marked when it was asked to trap the focus.
jest.mock('@fluentui/react-components', () => {
  const actual = jest.requireActual('@fluentui/react-components')
  const React = jest.requireActual('react')
  const overlay = (role: string) => {
    const Context = React.createContext({
      open: false,
      toggle: (_event: any) => undefined,
      trapFocus: undefined
    })
    const Root = ({ open: controlled, onOpenChange, trapFocus, children }: any) => {
      const [uncontrolled, setUncontrolled] = React.useState(false)
      const open = controlled ?? uncontrolled
      const toggle = (event: any) => {
        setUncontrolled(!open)
        onOpenChange?.(event, { open: !open })
      }
      return React.createElement(Context.Provider, { value: { open, toggle, trapFocus } }, children)
    }
    const Trigger = ({ children }: any) => {
      const { toggle } = React.useContext(Context)
      return typeof children === 'function'
        ? children({ onClick: toggle })
        : React.createElement('span', { onClick: toggle }, children)
    }
    const Surface = ({ children, ...props }: any) => {
      const { open, trapFocus } = React.useContext(Context)
      return open
        ? React.createElement('div', { role, ...props, 'data-trap-focus': trapFocus }, children)
        : null
    }
    return { Root, Trigger, Surface }
  }
  const popover = overlay('dialog')
  const menu = overlay('menu')
  return {
    __esModule: true,
    ...actual,
    Popover: popover.Root,
    PopoverTrigger: popover.Trigger,
    PopoverSurface: popover.Surface,
    Menu: menu.Root,
    MenuTrigger: menu.Trigger,
    MenuPopover: menu.Surface,
    MenuList: ({ children }: any) => React.createElement(React.Fragment, null, children),
    MenuItem: ({ children, onClick }: any) =>
      React.createElement('button', { role: 'menuitem', onClick }, children),
    MenuItemLink: ({ children, href, target }: any) =>
      React.createElement('a', { role: 'menuitem', href, target }, children)
  }
})

import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HelpContentModel, IGitHubRelease, InstallationEntry } from 'extensions/footer/types'
import strings from 'PortfolioExtensionsStrings'
import { formatDate, getContrastRatio } from 'pp365-shared-library'
import * as React from 'react'
import resource from 'SharedResources'
import { useAssistant } from './Assistant/useAssistant'
import { FooterContext } from './context'
import { Footer } from './Footer'
import { LATEST_GIT_HUB_RELEASE_DEFAULT_PROPS } from './InstallVersion/InstallVersionTooltipContent/LatestGitHubRelease'
import { useLatestGitHubRelease } from './InstallVersion/InstallVersionTooltipContent/LatestGitHubRelease/useLatestGitHubRelease'
import { IFooterProps } from './types'

const HUB = 'https://contoso.sharepoint.com/sites/pp365'
const PROJECT = 'https://contoso.sharepoint.com/sites/frisbee'
const INSTALLED = '2026-09-30T10:00:00Z'

function installation(channel = 'test') {
  return new InstallationEntry({
    InstallEndTime: INSTALLED,
    InstallVersion: '1.15.0.a1b2c3d',
    InstallChannel: channel
  })
}

function release(tag: string, body = 'Risiko- og mulighetsmatrise for program'): IGitHubRelease {
  return {
    tag_name: tag,
    html_url: `https://github.com/Puzzlepart/prosjektportalen365/releases/tag/${tag}`,
    body
  } as IGitHubRelease
}

function help(title: string, text: string, resourceLink?: { Url: string; Description: string }) {
  return new HelpContentModel(
    { Title: title, GtTextContent: text, GtURL: '/SitePages', GtResourceLink: resourceLink },
    undefined
  )
}

function footerProps(
  overrides: Partial<IFooterProps> = {},
  { isSiteAdmin = true, webUrl = HUB } = {}
): IFooterProps {
  return {
    installEntries: [installation()],
    loadGitHubReleases: jest.fn(() => Promise.resolve([release('v1.15.2')])),
    loadHelpContent: jest.fn(() => Promise.resolve([])),
    loadLinks: jest.fn(() => Promise.resolve([])),
    loadFavoriteProjects: jest.fn(() => Promise.resolve([])),
    pageContext: { web: { absoluteUrl: webUrl }, legacyPageContext: { isSiteAdmin } } as any,
    portalUrl: HUB,
    useAssistant: false,
    hasAssistantAccess: false,
    assistantEndpointUrl: 'https://assistent.example/chat',
    showFooter: true,
    minimizeFooter: false,
    ...overrides
  }
}

/** Runs a hook inside the footer's context and returns what it returned. */
function withFooterContext<T>(context: Record<string, any>, hook: () => T): T {
  let result: T
  const Probe: React.FC = () => {
    result = hook()
    return null
  }
  render(
    <FooterContext.Provider value={context as any}>
      <Probe />
    </FooterContext.Provider>
  )
  return result
}

let open: jest.SpyInstance

beforeEach(() => {
  open = jest.spyOn(window, 'open').mockImplementation(() => null)
})

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
  open.mockRestore()
})

describe('Footer', () => {
  it('renders nothing when the footer is turned off', () => {
    const { container } = render(<Footer {...footerProps({ showFooter: false })} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('minimizes itself when the setting says so', () => {
    const { container } = render(<Footer {...footerProps({ minimizeFooter: true })} />)
    expect(container.querySelector('.footer.minimize')).not.toBeNull()
  })

  it('gives site admins the site settings, on the hub only, and the configuration page', () => {
    const { unmount } = render(<Footer {...footerProps()} />)
    expect(screen.getByText(strings.SiteSettingsLabel)).toBeVisible()
    expect(screen.getByText(strings.ConfigurationLabel)).toBeVisible()
    unmount()

    render(<Footer {...footerProps({}, { webUrl: PROJECT })} />)
    expect(screen.getByText(strings.SiteSettingsLabel)).not.toBeVisible()
    expect(screen.getByText(strings.ConfigurationLabel)).toBeVisible()
  })

  it('gives other users neither', () => {
    render(<Footer {...footerProps({}, { isSiteAdmin: false })} />)
    expect(screen.queryByText(strings.SiteSettingsLabel)).toBeNull()
    expect(screen.queryByText(strings.ConfigurationLabel)).toBeNull()
  })

  it("links to the hub's site settings, its site contents and the configuration page (WCAG 4.1.2)", () => {
    render(<Footer {...footerProps()} />)
    // What goes somewhere is a link, which can be opened where the user wants it.
    expect(screen.getByRole('link', { name: strings.SiteSettingsLabel })).toHaveAttribute(
      'href',
      `${HUB}/_layouts/15/settings.aspx`
    )
    // The split button's menu button has a name of its own: without one it took the settings'.
    fireEvent.click(screen.getByRole('button', { name: strings.SiteSettingsMoreLabel }))
    expect(screen.getByRole('menuitem', { name: strings.SiteContentsLabel })).toHaveAttribute(
      'href',
      `${HUB}/_layouts/15/viewlsts.aspx`
    )
    expect(screen.getByRole('link', { name: strings.ConfigurationLabel })).toHaveAttribute(
      'href',
      `${HUB}/SitePages/${resource.ClientSidePages_Configuration_PageName}`
    )
  })

  it('loads the favorite projects on the first opening only, and links to them', async () => {
    const loadFavoriteProjects = jest.fn(() =>
      Promise.resolve([{ name: 'Frisbeegolfbane', url: PROJECT }])
    )
    render(<Footer {...footerProps({ loadFavoriteProjects })} />)
    const trigger = screen.getByText(strings.FavoriteProjectsLabel, { selector: 'button' })
    fireEvent.click(trigger)
    expect(await screen.findByText('Frisbeegolfbane')).toHaveAttribute('href', PROJECT)
    fireEvent.click(trigger)
    fireEvent.click(trigger)
    expect(screen.getByText('Frisbeegolfbane')).toBeInTheDocument()
    expect(loadFavoriteProjects).toHaveBeenCalledTimes(1)
  })

  it('keeps the focus in the favourite projects and the installation while open, each named (WCAG 2.4.3, 4.1.2)', async () => {
    render(<Footer {...footerProps()} />)
    fireEvent.click(screen.getByText(strings.FavoriteProjectsLabel, { selector: 'button' }))
    // Without the trap, Tab from the last link went to the top of the page, leaving it open.
    expect(screen.getByRole('dialog', { name: strings.FavoriteProjectsLabel })).toHaveAttribute(
      'data-trap-focus',
      'true'
    )
    await screen.findByText(strings.FavoriteProjectsNoItemsMessage)
    fireEvent.click(screen.getByText('v1.15.0.a1b2c3d (test)'))
    expect(screen.getByRole('dialog', { name: strings.LastInstallHeaderText })).toHaveAttribute(
      'data-trap-focus',
      'true'
    )
    await screen.findByText('1.15.2')
  })

  it('says so when the user follows no projects', async () => {
    render(<Footer {...footerProps()} />)
    fireEvent.click(screen.getByText(strings.FavoriteProjectsLabel, { selector: 'button' }))
    expect(await screen.findByText(strings.FavoriteProjectsNoItemsMessage)).toBeInTheDocument()
  })

  it('lists the useful links, the administrator links for site admins only', async () => {
    const links = [
      { Url: 'https://alfa.example', Description: 'Alfa' },
      {
        Url: 'https://admin.example',
        Description: 'Kun for administratorer',
        Level: strings.AdministratorLabel
      }
    ]
    const { unmount } = render(
      <Footer {...footerProps({ loadLinks: jest.fn(() => Promise.resolve(links)) })} />
    )
    fireEvent.click(screen.getByText(strings.LinksListLabel))
    expect(await screen.findByRole('menuitem', { name: 'Alfa' })).toHaveAttribute(
      'href',
      'https://alfa.example'
    )
    expect(screen.getByText('Kun for administratorer')).toBeInTheDocument()
    // The list the links come from is in the menu: the tooltip held a link no keyboard reached.
    expect(screen.getByRole('menuitem', { name: strings.LinksListOpenLabel })).toHaveAttribute(
      'href',
      `${HUB}/${resource.Lists_Links_Url}/AllItems.aspx`
    )
    unmount()

    render(
      <Footer
        {...footerProps(
          { loadLinks: jest.fn(() => Promise.resolve(links)) },
          { isSiteAdmin: false }
        )}
      />
    )
    fireEvent.click(screen.getByText(strings.LinksListLabel))
    expect(await screen.findByText('Alfa')).toBeInTheDocument()
    expect(screen.queryByText('Kun for administratorer')).toBeNull()
  })

  it('shows the installed version and, opened, the installation and the latest release', async () => {
    const loadGitHubReleases = jest.fn(() => Promise.resolve([release('v1.15.2')]))
    render(<Footer {...footerProps({ loadGitHubReleases })} />)
    fireEvent.click(screen.getByText('v1.15.0.a1b2c3d (test)'))
    expect(
      screen.getByText(strings.LastInstallHeaderText, { selector: 'span' })
    ).toBeInTheDocument()
    expect(screen.getByText(formatDate(new Date(INSTALLED)))).toBeInTheDocument()
    expect(screen.getByText('1.15.0.a1b2c3d')).toBeInTheDocument()
    expect(screen.getByText('test')).toBeInTheDocument()
    expect(await screen.findByText('1.15.2')).toBeInTheDocument()
    expect(screen.getByText('Risiko- og mulighetsmatrise for program')).toBeInTheDocument()
    expect(loadGitHubReleases).toHaveBeenCalledTimes(1)

    // A newer release than the installed one offers the download. Each of these goes somewhere,
    // so each is a link (WCAG 4.1.2); the release notes' link had no address at all.
    const link = (name: string) => screen.getByRole('link', { name })
    expect(link(strings.LatestGitHubReleaseDownloadButtonText)).toHaveAttribute(
      'href',
      'https://github.com/Puzzlepart/prosjektportalen365/releases'
    )
    expect(link(strings.LatestGitHubReleaseLinkTitle)).toHaveAttribute(
      'href',
      'https://github.com/Puzzlepart/prosjektportalen365/blob/main/releasenotes/1.15.0.md'
    )
    expect(link('1.15.2')).toHaveAttribute('href', release('v1.15.2').html_url)
    expect(link(strings.SeeAllInstallationsLinkText)).toHaveAttribute(
      'href',
      `${HUB}/${resource.Lists_InstallationLog_Url}`
    )
    // The release's highlights scroll: a named region the keyboard reaches.
    expect(
      screen.getByRole('region', { name: strings.LatestGitHubReleaseHighlightsLabel })
    ).toHaveAttribute('tabindex', '0')
  })

  it('offers no download when the installed version is the latest', async () => {
    const loadGitHubReleases = jest.fn(() => Promise.resolve([release('v1.15.0')]))
    render(<Footer {...footerProps({ loadGitHubReleases, installEntries: [installation('')] })} />)
    fireEvent.click(screen.getByText('v1.15.0.a1b2c3d'))
    expect(await screen.findByText('1.15.0')).toBeInTheDocument()
    expect(screen.getByText(strings.LatestGitHubReleaseDownloadButtonText)).not.toBeVisible()
    expect(screen.queryByText(strings.InstallChannelLabel)).toBeNull()
  })

  it('leaves the latest release out when GitHub cannot be reached', async () => {
    const loadGitHubReleases = jest.fn(() => Promise.reject(new Error('rate limited')))
    render(<Footer {...footerProps({ loadGitHubReleases })} />)
    fireEvent.click(screen.getByText('v1.15.0.a1b2c3d (test)'))
    await waitFor(() => expect(screen.queryByText(strings.LatestGitHubReleaseLabel)).toBeNull())
    expect(screen.getByText(strings.SeeAllInstallationsLinkText)).toBeInTheDocument()
  })

  it('opens the help for the page, one tab per entry', async () => {
    const loadHelpContent = jest.fn(() =>
      Promise.resolve([
        help('Kom i gang', '<b>Velkommen</b>', {
          Url: 'https://hjelp.example/start',
          Description: 'Les mer'
        }),
        help('Statusrapport', 'Slik rapporterer du status')
      ])
    )
    render(<Footer {...footerProps({ loadHelpContent })} />)
    fireEvent.click(screen.getByText(strings.HelpContentAvailableLabel))
    expect(await screen.findByText('Velkommen')).toBeInTheDocument()
    // Named by its title, with a button that closes it; it had neither (WCAG 4.1.2).
    expect(screen.getByRole('dialog', { name: strings.HelpContentDialogTitle })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.CloseLabel })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Kom i gang' })).toHaveAttribute('aria-selected', 'true')
    // The tab's content is its panel (WCAG 1.3.1).
    expect(screen.getByRole('tabpanel', { name: 'Kom i gang' })).toHaveTextContent('Velkommen')
    expect(screen.getByRole('link', { name: 'Les mer' })).toHaveAttribute(
      'href',
      'https://hjelp.example/start'
    )

    fireEvent.click(screen.getByRole('tab', { name: 'Statusrapport' }))
    expect(screen.getByText('Slik rapporterer du status')).toBeInTheDocument()
    expect(screen.queryByText('Velkommen')).toBeNull()
    expect(loadHelpContent).toHaveBeenCalledTimes(1)
  })

  it('says that the page has no help once none was found', async () => {
    render(<Footer {...footerProps()} />)
    fireEvent.click(screen.getByText(strings.HelpContentAvailableLabel))
    // The help button's tooltip says the same, so the text is looked for in the dialog.
    const dialog = await screen.findByRole('dialog')
    expect(
      await within(dialog).findByText(strings.HelpContentUnavailableDescription)
    ).toBeInTheDocument()
    // Focusable while it cannot be used, so the keyboard reaches the description that says why.
    const button = screen.getByText(strings.HelpContentUnavailableLabel).closest('button')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).not.toHaveAttribute('disabled')
  })

  it('offers the assistant to users with access, with the page as its source', async () => {
    render(<Footer {...footerProps({ useAssistant: true, hasAssistantAccess: true })} />)
    // The drawer opens from state: the button is where the focus goes back as it closes.
    const button = screen.getByText(strings.AssistantButtonLabel).closest('button')
    expect(button.getAttribute('data-tabster')).toContain('restorer')
    fireEvent.click(button)
    const frame = await screen.findByTitle(strings.AssistantIframeTitle)
    // A dialog named by its title; its role was 'panel', which is no role.
    expect(screen.getByRole('dialog', { name: strings.AssistantDrawerTitle })).toBeInTheDocument()
    expect(frame).toHaveAttribute('src', `https://assistent.example/chat?source=${HUB}`)
    expect(frame).toHaveAttribute('allow', 'clipboard-write')
    expect(screen.getByText(strings.AssistantLoadingText)).toBeInTheDocument()
    fireEvent.load(frame)
    expect(screen.queryByText(strings.AssistantLoadingText)).toBeNull()
    // Named, where a title was all; the settings are a list, so a link.
    expect(screen.getByRole('link', { name: strings.AssistantSettingsTooltip })).toHaveAttribute(
      'href',
      `${HUB}/${resource.Lists_Global_Settings_Url}`
    )
    expect(screen.getByRole('button', { name: strings.CloseLabel })).toBeInTheDocument()
  })

  it("shows the assistant's settings to site admins only", async () => {
    render(
      <Footer
        {...footerProps({ useAssistant: true, hasAssistantAccess: true }, { isSiteAdmin: false })}
      />
    )
    fireEvent.click(screen.getByText(strings.AssistantButtonLabel))
    await screen.findByTitle(strings.AssistantIframeTitle)
    // A link cannot be disabled, and a disabled button said nothing of why.
    expect(screen.queryByTitle(strings.AssistantSettingsTooltip)).toBeNull()
    expect(screen.queryByRole('link', { name: strings.AssistantSettingsTooltip })).toBeNull()
  })

  it('leaves the assistant out when it is off or the user has no access', () => {
    const { unmount } = render(<Footer {...footerProps({ hasAssistantAccess: true })} />)
    expect(screen.queryByText(strings.AssistantButtonLabel)).toBeNull()
    unmount()
    render(<Footer {...footerProps({ useAssistant: true })} />)
    expect(screen.queryByText(strings.AssistantButtonLabel)).toBeNull()
  })
})

describe('useLatestGitHubRelease', () => {
  const compare = (tag: string) =>
    withFooterContext(
      { gitHubReleases: [release(tag)], props: { installEntries: [installation()] } },
      () => useLatestGitHubRelease(LATEST_GIT_HUB_RELEASE_DEFAULT_PROPS)
    ).versionComparisonIconProps

  const {
    latestGitHubReleaseIsNewerIconColor: newer,
    latestGitHubReleaseIsOlderIconColor: older,
    latestGitHubReleaseIsSameIconColor: same
  } = LATEST_GIT_HUB_RELEASE_DEFAULT_PROPS

  it('compares the latest release with the installed version', () => {
    expect(compare('v1.15.2')).toEqual({
      name: 'ArrowCircleUpSparkle',
      options: { color: newer, title: strings.LatestGitHubReleaseIsNewerText }
    })
    expect(compare('v1.14.3')).toEqual({
      name: 'ArrowCircleDown',
      options: { color: older, title: strings.LatestGitHubReleaseIsOlderText }
    })
    expect(compare('v1.15.0')).toEqual({
      name: 'CheckmarkCircle',
      options: { color: same, title: strings.LatestGitHubReleaseIsSameText }
    })
  })

  it('draws the comparison in colours that stand out from the popover (WCAG 1.4.11)', () => {
    // Orange was 2:1 against white.
    for (const color of [newer, older, same]) {
      expect(getContrastRatio(color, '#ffffff')).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('useAssistant', () => {
  it('keeps the assistant loaded once it has been opened', () => {
    let assistant: ReturnType<typeof useAssistant>
    const Probe: React.FC = () => {
      assistant = useAssistant()
      return null
    }
    render(<Probe />)
    expect(assistant.hasOpened).toBe(false)
    act(() => assistant.toggle())
    expect(assistant.open).toBe(true)
    act(() => assistant.close())
    expect(assistant.open).toBe(false)
    expect(assistant.hasOpened).toBe(true)
    expect(assistant.loading).toBe(true)
    act(() => assistant.setLoading(false))
    expect(assistant.loading).toBe(false)
  })
})
