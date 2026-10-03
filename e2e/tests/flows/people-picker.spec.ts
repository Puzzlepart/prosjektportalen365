import { configuredUrl, expect, test, webPartByAlias } from '../fixtures/pp365'
import { restGet } from '../fixtures/rest'

/**
 * The person fields of the project information panel run on Fluent UI v9's TagPicker since phase
 * 4, slice 7. Jest types into a stand-in, since the TagPicker loops the Jest worker on React 17, so
 * this is where the real picker is typed into, in SharePoint, with the people search behind it: a
 * search for the signed-in account offers it, and picking it shows it as picked. Read only: the
 * panel is closed without saving.
 */
const projectUrl = configuredUrl(process.env.E2E_PROJECT_URL)
const PEOPLE_PLACEHOLDER = /angi et navn eller en e-postadresse|enter a name or email address/i

test.describe('the project information panel', () => {
  test.skip(
    !projectUrl,
    'E2E_PROJECT_URL is not set (or is the .env.example placeholder); skipping'
  )

  test('finds a person in a person field and shows them picked, without saving', async ({
    page,
    openPage,
    resolvePage
  }) => {
    const response = await restGet(page, `${projectUrl}/_api/web/currentuser?$select=Title,Email`)
    expect(response.ok(), `current user: HTTP ${response.status()}`).toBe(true)
    const { Title: name, Email: email } = (await response.json()) as {
      Title: string
      Email: string
    }

    await openPage(await resolvePage(projectUrl!, ['ProjectHome.aspx', 'Hjem.aspx', 'Home.aspx']))
    const info = webPartByAlias(page, 'ProjectInformation').first()
    await expect(info).toBeVisible({ timeout: 60_000 })
    // "Rediger <the web part's title>" comes before "Rediger områdeinformasjon".
    await info
      .getByRole('button', { name: /^Rediger/ })
      .first()
      .click()
    const panel = page.getByRole('dialog').last()
    // A person field with room for one more person: a field for one that holds one takes no input.
    const input = panel.getByPlaceholder(PEOPLE_PLACEHOLDER).first()
    await expect(input).toBeVisible({ timeout: 30_000 })

    // The name may be on the panel already, in another field; the pick adds one more.
    const named = panel.getByText(name, { exact: true })
    const before = await named.count()
    await input.fill(email.split('@')[0])
    // The people picked are options too (Fluent's tags); a search result is the one with the email.
    const option = page.getByRole('option').filter({ hasText: email }).first()
    await expect(option).toBeVisible({ timeout: 30_000 })
    await option.click()
    // The person shows as picked, by name, and the options are gone.
    await expect(named).toHaveCount(before + 1)
    await expect(page.getByRole('option').filter({ hasText: email })).toHaveCount(0)

    await panel.getByRole('button', { name: /^lukk$|^close$/i }).click()
    await expect(panel).toBeHidden({ timeout: 10_000 })
  })
})
