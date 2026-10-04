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

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
    // The header's X and the footer's button are both named "Lukk"; the footer's is the last.
    const close = panel.getByRole('button', { name: /^lukk$|^close$/i }).last()
    await expect(close).toBeVisible({ timeout: 30_000 })
    // The account may be picked already, saved by someone. The search leaves out who is picked, and
    // a field for one person that holds one takes no input, so it is taken out of every person field
    // first; the panel is closed without saving. In the panel, the options are the picked people's
    // tags (the search results open outside it), and a click on a tag takes it out.
    const pickedAccount = panel.getByRole('option', { name: new RegExp(escapeRegExp(name)) })
    // One at a time: a tag on its way out is still counted, and clicking it waits for nothing.
    for (let left = await pickedAccount.count(); left > 0; left--) {
      await pickedAccount.first().click()
      await expect(pickedAccount).toHaveCount(left - 1)
    }

    // The first person field with room for one more person.
    const input = panel.getByPlaceholder(PEOPLE_PLACEHOLDER).first()
    await expect(input).toBeVisible({ timeout: 30_000 })
    // The name may be on the panel still, as text elsewhere; the pick adds one more.
    const named = panel.getByText(name, { exact: true })
    const before = await named.count()
    // A click opens the list, and the search runs as the user types.
    await input.click()
    await input.pressSequentially(email.split('@')[0], { delay: 50 })
    // The people picked are options too (Fluent's tags); a search result is the one with the email.
    const option = page.getByRole('option').filter({ hasText: email }).first()
    await expect(option).toBeVisible({ timeout: 30_000 })
    await option.click()
    // The person shows as picked, by name, and the options are gone.
    await expect(named).toHaveCount(before + 1)
    await expect(page.getByRole('option').filter({ hasText: email })).toHaveCount(0)

    await close.click()
    await expect(panel).toBeHidden({ timeout: 10_000 })
  })
})
