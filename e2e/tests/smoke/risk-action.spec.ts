import * as fs from 'fs'
import * as path from 'path'
import { Page } from '@playwright/test'
import { baseURL } from '../../playwright.config'
import { configuredUrl, expect, test, withNetworkRetry } from '../fixtures/pp365'
import { restGet } from '../fixtures/rest'

/**
 * Read-only smoke of the risk actions: the Planner field customizer on `GtRiskAction`. The
 * project's risk list shows each risk's actions through the customizer, whose popover offers a
 * new task and the migration of the text to Planner; the panel for a new task opens with its
 * fields; the migration dialog lists the lines it would turn into tasks. Nothing is saved: the
 * panel and the dialog are closed again, and the button that creates tasks is never clicked.
 *
 * The customizer renders only while the hub's `RiskActionPlannerEnabled` setting is on (the test
 * hub has it on); off, the cell shows SharePoint's plain text and the popover never opens, so the
 * setting is asserted first, and a changed setting fails the test rather than hides it.
 */
const projectUrl = configuredUrl(process.env.E2E_PROJECT_URL)
const hubUrl = baseURL.replace(/\/+$/, '')
const pointsAtHub = !!projectUrl && projectUrl.toLowerCase() === hubUrl.toLowerCase()
const CHANNEL = process.env.E2E_CHANNEL || 'test'
const MOUNT_TIMEOUT = { timeout: 60_000 }

interface IList {
  id: string
  title: string
  url: string
}

/**
 * The first list of a site that has a field, preferring the titles given: how the risk list and
 * the hub's settings list are found, whatever a tenant named them. The settings list is hidden
 * (the template hides it from the site contents), so hidden lists are searched when asked for.
 */
async function listWithField(
  page: Page,
  siteUrl: string,
  internalName: string,
  preferred: RegExp,
  includeHidden = false
): Promise<IList | undefined> {
  const filter = includeHidden ? 'BaseTemplate eq 100' : 'BaseTemplate eq 100 and Hidden eq false'
  const response = await restGet(
    page,
    `${siteUrl}/_api/web/lists?$filter=${filter}&$select=Id,Title,DefaultViewUrl&$top=200`
  )
  if (!response.ok())
    throw new Error(`Could not list the lists of ${siteUrl}: HTTP ${response.status()}`)
  const lists = ((await response.json()) as { value: Record<string, string>[] }).value
  lists.sort((a, b) => Number(preferred.test(b.Title)) - Number(preferred.test(a.Title)))
  for (const list of lists) {
    const fields = await restGet(
      page,
      `${siteUrl}/_api/web/lists(guid'${list.Id}')/fields?$filter=InternalName eq '${internalName}'&$select=InternalName`
    )
    if (fields.ok() && ((await fields.json()) as { value: unknown[] }).value.length > 0) {
      return {
        id: list.Id,
        title: list.Title,
        url: `${new URL(siteUrl).origin}${list.DefaultViewUrl}`
      }
    }
  }
  return undefined
}

/** The value of a setting in the hub's global settings list, or `undefined` when there is none. */
async function hubSetting(page: Page, key: string): Promise<string | undefined> {
  const list = await listWithField(page, hubUrl, 'GtSettingsKey', /innstillinger|settings/i, true)
  if (!list) return undefined
  const response = await restGet(
    page,
    `${hubUrl}/_api/web/lists(guid'${list.id}')/items?$filter=GtSettingsKey eq '${key}'&$select=GtSettingsValue&$top=1`
  )
  if (!response.ok()) return undefined
  return ((await response.json()) as { value: { GtSettingsValue: string }[] }).value[0]
    ?.GtSettingsValue
}

/** The component id the test channel's package gives the customizer (`channels/<channel>.json`). */
function channelCustomizerId(): string | undefined {
  const file = path.resolve(__dirname, '..', '..', '..', 'channels', `${CHANNEL}.json`)
  if (!fs.existsSync(file)) return undefined
  const channel = JSON.parse(fs.readFileSync(file, 'utf8'))
  return channel?.spfx?.solutions?.ProjectExtensions?.components?.RiskActionPlanner?.toLowerCase()
}

test.describe('risk actions', () => {
  test.skip(
    !projectUrl,
    'E2E_PROJECT_URL is not set (or is the .env.example placeholder); skipping risk action smoke tests'
  )
  test.skip(
    pointsAtHub,
    `E2E_PROJECT_URL points at the hub (${projectUrl}); set it to a provisioned project site`
  )

  test("the risk list's actions open the Planner popover, the task panel and the migration dialog", async ({
    page,
    consoleGuard
  }) => {
    void consoleGuard
    test.setTimeout(180_000)
    expect(
      await hubSetting(page, 'RiskActionPlannerEnabled'),
      'RiskActionPlannerEnabled must be 1 on the hub for the customizer to render'
    ).toBe('1')

    const list = await listWithField(page, projectUrl!, 'GtRiskAction', /usikkerhet|risiko|risk/i)
    test.skip(!list, `${projectUrl} has no list with the field GtRiskAction`)

    // The customizer must be the one of the channel under test: another channel's package runs
    // that package's code, which says nothing about this build.
    const field = await restGet(
      page,
      `${projectUrl}/_api/web/lists(guid'${list!.id}')/fields/getbyinternalnameortitle('GtRiskAction')?$select=ClientSideComponentId`
    )
    const expectedId = channelCustomizerId()
    if (field.ok() && expectedId) {
      const { ClientSideComponentId } = (await field.json()) as { ClientSideComponentId: string }
      expect(
        ClientSideComponentId.toLowerCase(),
        `GtRiskAction in "${list!.title}" is bound to another package's customizer than the ${CHANNEL} channel's`
      ).toBe(expectedId)
    }

    const items = await restGet(
      page,
      `${projectUrl}/_api/web/lists(guid'${list!.id}')/items?$select=Id,Title,GtRiskAction&$orderby=Id&$top=10`
    )
    const risks = ((await items.json()) as { value: { Title: string; GtRiskAction?: string }[] })
      .value
    const risk = risks.find((r) => r.GtRiskAction?.trim())
    test.skip(!risk, `"${list!.title}" has no risk with actions written in GtRiskAction`)
    // The first line of the actions, as the cell shows the text: enough of it to be found.
    const actions = risk!.GtRiskAction!.split(/\r?\n/)[0].trim().slice(0, 40)

    // A list view is not an SPFx web part page, so the canvas wait of `openPage` does not apply.
    await withNetworkRetry(() => page.goto(list!.url, { timeout: 90_000 }))
    const row = page.locator('[data-automationid="DetailsRow"]').filter({ hasText: risk!.Title })
    await expect(row.first()).toBeVisible(MOUNT_TIMEOUT)
    const cellText = row.first().getByText(actions)
    await expect(cellText.first(), 'the customizer shows the actions in the cell').toBeVisible(
      MOUNT_TIMEOUT
    )

    // The popover: the risk's title, and the two things to do with text that is not in Planner.
    await cellText.first().click()
    await expect(
      page.getByText(new RegExp(`^(Tiltak for|Risk action for) ${escapeRegExp(risk!.Title)}`))
    ).toBeVisible()
    const addButton = page.getByRole('button', {
      name: /legg til nytt tiltak|add new risk action/i
    })
    const migrateButton = page.getByRole('button', {
      name: /migrer tiltakene til planner|migrate risk actions to planner/i
    })
    await expect(addButton).toBeVisible()
    await expect(migrateButton).toBeVisible()
    await expect(
      page.getByRole('button', { name: /synkroniser endringer|synchronize changes/i })
    ).toBeHidden()

    // The panel for a new task: its fields, save disabled without a title, closed unsaved.
    await addButton.click()
    const panel = page.getByRole('dialog')
    await expect(panel).toBeVisible()
    await expect(panel.getByText(/legg til nytt tiltak for|new risk action/i).first()).toBeVisible()
    for (const label of [
      /^(Tittel|Title)\b/,
      /^(Beskrivelse|Description)\b/,
      /^(Startdato|Start date)\b/,
      /^(Forfallsdato|Due date)\b/,
      /^(Ansvarlig|Responsible)\b/,
      /^(Opprett flere|Create multiple)\b/
    ]) {
      await expect(panel.getByText(label).first(), `the panel has the field ${label}`).toBeVisible()
    }
    await expect(panel.getByRole('button', { name: /^(lagre|save)$/i })).toBeDisabled()
    await panel.getByRole('button', { name: /^(lukk|close)$/i }).click()
    await expect(panel).toBeHidden()

    // The migration dialog: the lines it would make tasks of, closed without making any.
    await cellText.first().click()
    await expect(migrateButton).toBeVisible()
    await migrateButton.click()
    const dialog = page.getByRole('dialog')
    await expect(
      dialog.getByText(/migrering av tiltak for|migration of risk actions for/i)
    ).toBeVisible()
    await expect(dialog.getByRole('listitem').first()).toBeVisible()
    await expect(
      dialog.getByRole('button', { name: /opprett \d+ tiltak i planner|create planner tasks/i })
    ).toBeVisible()
    // The text button, not the title's close cross: both are named «Lukk» in Norwegian.
    await dialog.getByText(/^(lukk|cancel)$/i).click()
    await expect(dialog).toBeHidden()
  })
})

/** Escapes a string for use inside a regular expression. */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
