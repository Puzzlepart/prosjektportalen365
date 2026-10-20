import { Locator, Page } from '@playwright/test'
import { baseURL } from '../../playwright.config'
import { scanAccessibility, SURFACES, waitForContent } from '../fixtures/a11y'
import {
  configuredUrl,
  expect,
  test,
  WEB_PART,
  webPartByAlias,
  withNetworkRetry
} from '../fixtures/pp365'
import { restGet } from '../fixtures/rest'

/**
 * Accessibility scans of the surfaces the pages open (#1788, docs/plans/universal-design-wcag.md):
 * the panels, dialogs, menus and popovers no other spec opens. Each is opened as a user opens it,
 * scanned with axe like a page's web part (`scanAccessibility`), and closed with Escape, after
 * which the focus must be back on what opened it (WCAG 2.4.3). Read-only: nothing is saved, and
 * the column form's delete confirmation is answered with Escape, which gives no answer.
 */
const hub = baseURL.replace(/\/+$/, '')
const projectUrl = configuredUrl(process.env.E2E_PROJECT_URL)
const MOUNT = { timeout: 60_000 }

// A page takes most of a minute to open on a busy runner, and each test opens one and a surface.
test.describe.configure({ timeout: 180_000 })

/** An open surface: its component, how it is found, and what has the focus once it is closed. */
interface IOpenSurface {
  component: string
  /** One of `SURFACES`. */
  surface: string
  exclude?: string[]
  /** What should have the focus once the surface is closed; null when nothing in particular. */
  focusBack: Locator | null
}

/**
 * Scans the surface just opened, closes it with Escape and checks where the focus went. Escape
 * that leaves the surface open and focus that does not come back fail the test at its end, so
 * one run reports every surface; a surface Escape did not close is closed from inside it.
 *
 * @param page The page
 * @param open The surface
 */
async function scanAndClose(page: Page, { component, surface, exclude, focusBack }: IOpenSurface) {
  const opened = page.locator(surface).last()
  await expect(opened, `${component} opens`).toBeVisible({ timeout: 30_000 })
  await waitForContent(page, [surface], 15_000)
  await scanAccessibility(page, { component, include: [surface], exclude })
  await page.keyboard.press('Escape')
  const closed = await opened.waitFor({ state: 'hidden', timeout: 10_000 }).then(
    () => true,
    () => false
  )
  expect.soft(closed, `Escape closes ${component}`).toBe(true)
  if (!closed) {
    await opened.locator('a, button, [role^="menuitem"]').first().focus()
    await page.keyboard.press('Escape')
    await expect(opened).toBeHidden({ timeout: 10_000 })
  }
  if (focusBack) {
    await expect
      .soft(focusBack, `closing ${component} gives the focus back to what opened it`)
      .toBeFocused()
  }
}

/**
 * The button of a list's first column header other than the title and "add column", whose
 * column form offers everything, "Slett" included.
 *
 * @param list The list's web part
 */
async function columnHeaderButton(list: Locator) {
  const headers = list.getByRole('columnheader')
  const texts = await headers.allInnerTexts()
  const index = texts.findIndex(
    (text) => /\S/.test(text) && !/^\s*(tittel|title|legg til kolonne|add column)\s*$/i.test(text)
  )
  expect(index, `a column besides the title among: ${texts.join(' | ')}`).toBeGreaterThan(-1)
  return headers.nth(index).getByRole('button').first()
}

/**
 * Opens a column's form from its header menu: "Kolonneinnstillinger" is a submenu, whose
 * "Rediger" opens the form. Scans the menu on the way when asked to.
 *
 * @returns Whether the form opened; false when the user is not offered it
 */
async function openColumnForm(page: Page, header: Locator, menuComponent?: string) {
  await header.click()
  const menu = page.locator(SURFACES.menu).last()
  await expect(menu).toBeVisible()
  if (menuComponent) {
    await scanAccessibility(page, { component: menuComponent, include: [SURFACES.menu] })
  }
  const settings = menu.getByRole('menuitem', { name: /^kolonneinnstillinger$|^column settings$/i })
  if ((await settings.getAttribute('aria-disabled')) === 'true') {
    await page.keyboard.press('Escape')
    return false
  }
  await settings.click()
  const edit = page.getByRole('menuitem', { name: /^rediger$|^edit$/i }).last()
  await expect(edit).toBeVisible()
  if ((await edit.getAttribute('aria-disabled')) === 'true') {
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    return false
  }
  await edit.click()
  return true
}

/** Notes in the report that a surface was not offered, so a missing scan is seen. */
function notOffered(component: string, reason: string) {
  test
    .info()
    .annotations.push({ type: 'a11y', description: `${component}: not scanned (${reason})` })
}

test.describe('the portfolio overview', () => {
  async function openOverview(
    page: Page,
    openPage: (path: string) => Promise<void>,
    resolvePage: (site: string, pages: string[]) => Promise<string>
  ) {
    await openPage(await resolvePage(hub, ['Porteføljeoversikt.aspx', 'PortfolioOverview.aspx']))
    const overview = page.locator(WEB_PART).first()
    await expect(overview.getByRole('columnheader').first()).toBeVisible(MOUNT)
    return overview
  }

  test('its filter panel', async ({ page, openPage, resolvePage }) => {
    const overview = await openOverview(page, openPage, resolvePage)
    const filter = overview.getByRole('button', { name: /^filtrer$|^filter$/i })
    await filter.click()
    await scanAndClose(page, {
      component: 'FilterPanel',
      surface: SURFACES.drawer,
      focusBack: filter
    })
  })

  test('its view menu and the view form', async ({ page, openPage, resolvePage }) => {
    const overview = await openOverview(page, openPage, resolvePage)
    const views = overview.getByRole('button', { name: /porteføljevisninger|portfolio views/i })
    await views.click()
    const menu = page.locator(SURFACES.menu).last()
    await expect(menu).toBeVisible()
    await scanAccessibility(page, { component: 'ViewSelectorMenu', include: [SURFACES.menu] })
    await menu
      .getByRole('menuitem', { name: /^rediger gjeldende visning$|^edit current view$/i })
      .click()
    await scanAndClose(page, {
      component: 'ViewFormPanel',
      surface: SURFACES.drawer,
      focusBack: views
    })
  })

  test('a column menu, the column form and its delete confirmation', async ({
    page,
    openPage,
    resolvePage
  }) => {
    const overview = await openOverview(page, openPage, resolvePage)
    const header = await columnHeaderButton(overview)
    if (!(await openColumnForm(page, header, 'ColumnContextMenu'))) {
      return notOffered('ColumnFormPanel', 'the column form is not offered to the test user')
    }
    const panel = page.locator(SURFACES.drawer).last()
    await expect(panel).toBeVisible({ timeout: 30_000 })
    await scanAccessibility(page, { component: 'ColumnFormPanel', include: [SURFACES.drawer] })
    const remove = panel.getByRole('button', { name: /^slett$|^delete$/i })
    if (await remove.isEnabled()) {
      await remove.click()
      // Escape gives the confirmation no answer, so nothing is deleted.
      await scanAndClose(page, {
        component: 'ConfirmDialog',
        surface: SURFACES.dialog,
        focusBack: remove
      })
    }
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden({ timeout: 10_000 })
    await expect
      .soft(header, 'closing the column form gives the focus back to the column')
      .toBeFocused()
  })

  test('"Vis eller skjul kolonner"', async ({ page, openPage, resolvePage }) => {
    const overview = await openOverview(page, openPage, resolvePage)
    const addColumn = overview
      .getByRole('columnheader', { name: /legg til kolonne|add column/i })
      .getByRole('button')
      .first()
    if (!(await addColumn.isVisible())) {
      return notOffered('EditViewColumnsPanel', 'only site admins get the "add column" header')
    }
    await addColumn.click()
    await page
      .locator(SURFACES.menu)
      .last()
      .getByRole('menuitem', { name: /vis eller skjul kolonner|show or hide columns/i })
      .click()
    await scanAndClose(page, {
      component: 'EditViewColumnsPanel',
      surface: SURFACES.drawer,
      focusBack: addColumn
    })
  })

  test("a project's status report", async ({ page, openPage, resolvePage }) => {
    const overview = await openOverview(page, openPage, resolvePage)
    const status = overview
      .getByRole('button', { name: /^statusrapport:|^status report:/i })
      .first()
    if (!(await status.isVisible())) {
      return notOffered(
        'StatusReportPopover',
        'the view has no status report column, or no reports'
      )
    }
    await status.click()
    await scanAndClose(page, {
      component: 'StatusReportPopover',
      surface: SURFACES.popover,
      focusBack: status
    })
  })
})

test.describe('the aggregated overview', () => {
  test('a column menu, the column form, the view menu and the view form', async ({
    page,
    openPage,
    resolvePage
  }) => {
    await openPage(
      await resolvePage(hub, [
        'Leveranseoversikt.aspx',
        'DeliveryOverview.aspx',
        'Nytteoversikt.aspx'
      ])
    )
    const aggregation = page.locator(WEB_PART).first()
    await expect(aggregation.getByRole('columnheader').first()).toBeVisible(MOUNT)
    await test.step('the column menu and form', async () => {
      const header = await columnHeaderButton(aggregation)
      if (!(await openColumnForm(page, header, 'AggregationColumnContextMenu'))) {
        return notOffered('AggregationColumnFormPanel', 'the column form is not offered')
      }
      await scanAndClose(page, {
        component: 'AggregationColumnFormPanel',
        surface: SURFACES.drawer,
        focusBack: header
      })
    })
    await test.step('the view menu and form', async () => {
      const views = aggregation.getByRole('button', { name: /visninger|views/i }).first()
      if (!(await views.isVisible())) return notOffered('AggregationViewFormPanel', 'no view menu')
      await views.click()
      const edit = page
        .locator(SURFACES.menu)
        .last()
        .getByRole('menuitem', { name: /^rediger gjeldende visning$|^edit current view$/i })
      if (!(await edit.isVisible())) {
        await page.keyboard.press('Escape')
        return notOffered('AggregationViewFormPanel', 'the view menu offers no edit')
      }
      await edit.click()
      await scanAndClose(page, {
        component: 'AggregationViewFormPanel',
        surface: SURFACES.drawer,
        focusBack: views
      })
    })
  })
})

test.describe('the footer', () => {
  test('the footer and what it opens', async ({ page, openPage, resolvePage }) => {
    await openPage(await resolvePage(hub, ['Home.aspx', 'Hjem.aspx']))
    // SharePoint's bottom placeholder, where the application customizer renders.
    const footer = page.locator('#spBottomPlaceholder')
    await expect(footer.getByRole('button').first()).toBeVisible(MOUNT)
    await scanAccessibility(page, { component: 'Footer', include: ['#spBottomPlaceholder'] })
    const surfaces: Array<{
      component: string
      name: RegExp
      surface: string
      exclude?: string[]
    }> = [
      {
        component: 'FooterSiteSettingsMenu',
        name: /^flere valg for området$|^more options for the site$/i,
        surface: SURFACES.menu
      },
      {
        component: 'FooterFavoriteProjects',
        name: /^mine favorittprosjekter$|^my favorite projects$/i,
        surface: SURFACES.popover
      },
      {
        component: 'FooterPromotedLinks',
        name: /^nyttige lenker$|^useful links$/i,
        surface: SURFACES.menu
      },
      { component: 'FooterInstallVersion', name: /^v\d/i, surface: SURFACES.popover },
      {
        component: 'FooterHelpContent',
        name: /^hjelp tilgjengelig$|^help available$/i,
        surface: SURFACES.dialog
      },
      // The assistant's conversation is another service's page, in a frame.
      {
        component: 'FooterAssistant',
        name: /^assistent$|^assistant$/i,
        surface: SURFACES.drawer,
        exclude: ['iframe']
      }
    ]
    for (const { component, name, surface, exclude } of surfaces) {
      await test.step(component, async () => {
        const opener = footer.getByRole('button', { name }).first()
        if (!(await opener.isVisible())) return notOffered(component, 'not shown on this hub')
        await opener.click()
        await scanAndClose(page, { component, surface, exclude, focusBack: opener })
      })
    }
  })
})

test.describe('the template package catalog', () => {
  test('the catalog and a package', async ({ page, consoleGuard }) => {
    void consoleGuard
    const response = await restGet(
      page,
      `${hub}/_api/web/lists?$select=Title,RootFolder/ServerRelativeUrl&$expand=RootFolder&$top=500`
    )
    const lists = (
      (await response.json()) as { value: { RootFolder: { ServerRelativeUrl: string } }[] }
    ).value
    // The command set shows on the template options list only, found by its URL, which is the
    // same in every language.
    const list = lists.find((l) =>
      /\/lists\/(maloppsett|templateoptions)$/i.test(l.RootFolder.ServerRelativeUrl)
    )
    test.skip(!list, 'the hub has no template options list')
    await withNetworkRetry(() =>
      page.goto(`${new URL(hub).origin}${list!.RootFolder.ServerRelativeUrl}/AllItems.aspx`, {
        timeout: 90_000
      })
    )
    await expect(
      page.locator('[data-automationid="CommandBar"], [role="menubar"]').first()
    ).toBeVisible(MOUNT)
    const name = /^malpakkekatalog$|^template package catalog$/i
    let command = page
      .getByRole('menuitem', { name })
      .or(page.getByRole('button', { name }))
      .first()
    // The command set adds its command once it has checked the user's permissions.
    await command.waitFor({ timeout: 15_000 }).catch(() => undefined)
    // Where the focus goes back to: the command, or SharePoint's "Mer" when the command is in
    // its menu.
    let opener = command
    if (!(await command.isVisible())) {
      opener = page.getByRole('menuitem', { name: /^mer$|^more$/i }).first()
      await opener.click()
      command = page.getByRole('menuitem', { name }).first()
    }
    await expect(command, 'the catalog command is offered to an admin').toBeVisible({
      timeout: 30_000
    })
    await command.click()
    // By its role and name, which only a catalog screen readers can find has: opened from "Mer",
    // SharePoint hid it from them (aria-hidden, 2026-10-19).
    const catalog = page.getByRole('dialog', {
      name: /^malpakkekatalog$|^template package catalog$/i
    })
    await expect(catalog).toBeVisible({ timeout: 30_000 })
    // Each package is a card, a button named by the package, in a cell of the catalog's list.
    const firstPackage = catalog.getByRole('listitem').getByRole('button').first()
    await expect(firstPackage).toBeVisible(MOUNT)
    await waitForContent(page, [SURFACES.drawer])
    await scanAccessibility(page, {
      component: 'TemplatePackageCatalog',
      include: [SURFACES.drawer]
    })
    await firstPackage.click()
    await expect(catalog.getByRole('heading', { level: 3 }).first()).toBeVisible({
      timeout: 30_000
    })
    await scanAccessibility(page, {
      component: 'TemplatePackageDetails',
      include: [SURFACES.drawer]
    })
    await page.keyboard.press('Escape')
    await expect(catalog).toBeHidden({ timeout: 10_000 })
    await expect
      .soft(opener, 'closing the catalog gives the focus back to what opened it')
      .toBeFocused()
  })
})

test.describe('the project home', () => {
  test.skip(!projectUrl, 'E2E_PROJECT_URL is not set (or is the .env.example placeholder)')

  async function openHome(
    page: Page,
    openPage: (path: string) => Promise<void>,
    resolvePage: (site: string, pages: string[]) => Promise<string>
  ) {
    await openPage(await resolvePage(projectUrl!, ['ProjectHome.aspx', 'Hjem.aspx', 'Home.aspx']))
    const info = webPartByAlias(page, 'ProjectInformation').first()
    await expect(
      info.getByRole('button', {
        name: /vis all prosjektinformasjon|show all project information/i
      })
    ).toBeVisible(MOUNT)
    return info
  }

  test("the project information's panels and dialogs", async ({ page, openPage, resolvePage }) => {
    const info = await openHome(page, openPage, resolvePage)
    const surfaces = [
      {
        component: 'AllPropertiesPanel',
        name: /^vis all prosjektinformasjon$|^show all project information$/i,
        surface: SURFACES.drawer
      },
      // "Rediger <the web part's title>" comes before "Rediger områdeinformasjon".
      { component: 'EditPropertiesPanel', name: /^rediger |^edit /i, surface: SURFACES.drawer },
      // Both dialogs only ask; Escape closes them before anything runs.
      {
        component: 'CreateParentDialog',
        name: /^gjør om til overordnet prosjekt$|^convert to parent project$/i,
        surface: SURFACES.dialog
      },
      {
        component: 'RunProjectSetupDialog',
        name: /^kjør oppsettveiviser$|^run setup wizard$/i,
        surface: SURFACES.dialog
      }
    ]
    for (const { component, name, surface } of surfaces) {
      await test.step(component, async () => {
        const opener = info.getByRole('button', { name }).first()
        if (!(await opener.isVisible()))
          return notOffered(component, 'not offered to the test user')
        await opener.click()
        await scanAndClose(page, { component, surface, focusBack: opener })
      })
    }
  })

  test('a phase and the change phase dialog', async ({ page, openPage, resolvePage }) => {
    await openHome(page, openPage, resolvePage)
    const list = webPartByAlias(page, 'ProjectPhases').getByRole('list', {
      name: /prosjektets faser|the project's phases/i
    })
    await expect(list).toBeVisible(MOUNT)
    // Another phase than the current, which offers the change.
    const phase = list.locator('li > button:not([aria-current="step"])').first()
    await phase.click()
    const popover = page.locator(SURFACES.popover).last()
    await expect(popover).toBeVisible()
    await scanAccessibility(page, { component: 'ProjectPhasePopover', include: [SURFACES.popover] })
    const change = popover.getByRole('button', {
      name: /^endre til denne fasen$|^change to this phase$/i
    })
    if (!(await change.isVisible())) {
      await page.keyboard.press('Escape')
      return notOffered('ChangePhaseDialog', 'the test user may not change the phase')
    }
    await change.click()
    // The dialog asks first; Escape closes it before the phase is changed.
    await scanAndClose(page, {
      component: 'ChangePhaseDialog',
      surface: SURFACES.dialog,
      focusBack: phase
    })
  })

  test('the news and the news dialog', async ({ page, openPage, resolvePage }) => {
    await openHome(page, openPage, resolvePage)
    // SharePoint mounts the news only when they come into view, below the fold; the wheel scrolls
    // what is under the pointer, so the pointer goes over the page's canvas first.
    await page.mouse.move(800, 500)
    await page.mouse.wheel(0, 5000)
    const news = webPartByAlias(page, 'ProjectNews').first()
    await news.scrollIntoViewIfNeeded().catch(() => undefined)
    const create = news.getByRole('button', {
      name: /^opprett nyhetsartikkel$|^create an article$/i
    })
    await expect(create).toBeVisible(MOUNT)
    await scanAccessibility(page, {
      component: 'ProjectNewsWebPart',
      include: ['[data-sp-feature-tag*="ProjectNews"]']
    })
    await create.click()
    await scanAndClose(page, {
      component: 'CreateNewsDialog',
      surface: SURFACES.dialog,
      focusBack: create
    })
  })
})
