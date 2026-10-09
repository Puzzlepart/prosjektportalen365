import { baseURL } from '../../playwright.config'
import { configuredUrl, expect, test, webPartByAlias } from '../fixtures/pp365'

/**
 * Read-only: two things about the project information panels that only a browser shows.
 *
 * A person field's placeholder starts where a text field's text does: a class from v8's people
 * picker, with a misspelt padding token, once left the v9 picker with no padding of its own, so
 * the placeholder sat against the border.
 *
 * The panel a project card opens names the project in its header, on the close button's line:
 * it once had an empty header and the name as a web part title in its body.
 */
const hub = baseURL.replace(/\/+$/, '')
const projectUrl = configuredUrl(process.env.E2E_PROJECT_URL)
const PEOPLE_PLACEHOLDER = /angi et navn eller en e-postadresse|enter a name or email address/i

test("a person field's placeholder starts where a text field's text does", async ({
  page,
  openPage,
  resolvePage
}) => {
  test.skip(!projectUrl, 'E2E_PROJECT_URL is not set (or is the .env.example placeholder)')
  await openPage(await resolvePage(projectUrl!, ['ProjectHome.aspx', 'Hjem.aspx', 'Home.aspx']))
  const info = webPartByAlias(page, 'ProjectInformation').first()
  await expect(info).toBeVisible({ timeout: 60_000 })
  await info
    .getByRole('button', { name: /^Rediger/ })
    .first()
    .click()
  const panel = page.getByRole('dialog').last()
  const close = panel.getByRole('button', { name: /^lukk$|^close$/i }).last()
  await expect(close).toBeVisible({ timeout: 30_000 })
  // A person field with nobody picked: in one that holds people, the input follows their tags.
  // Without one, the people in the first field are taken out (a click on a tag does); the panel
  // is closed without saving.
  const controls = panel.locator('.fui-TagPickerControl')
  await controls.first().waitFor({ timeout: 30_000 })
  const empty = controls.filter({ hasNot: page.locator('.fui-Tag') })
  if ((await empty.count()) === 0) {
    const tags = controls.first().locator('.fui-Tag')
    for (let left = await tags.count(); left > 0; left--) {
      await tags.first().click()
      await expect(tags).toHaveCount(left - 1)
    }
  }
  const person = empty.getByPlaceholder(PEOPLE_PLACEHOLDER).first()
  await expect(person).toBeVisible({ timeout: 10_000 })
  // Where the text starts, from the field's outer edge: border, the box's padding, the input's.
  const textStart = (input: import('@playwright/test').Locator, box: string) =>
    input.evaluate((element, boxSelector) => {
      const field = element.closest(boxSelector)!
      const style = getComputedStyle(element)
      return (
        element.getBoundingClientRect().left +
        parseFloat(style.paddingLeft) -
        field.getBoundingClientRect().left
      )
    }, box)
  const personStart = await textStart(person, '.fui-TagPickerControl')
  const textStartInText = await textStart(panel.locator('.fui-Input__input').first(), '.fui-Input')
  expect(
    Math.abs(personStart - textStartInText),
    `the placeholder starts ${personStart}px in, a text field's text ${textStartInText}px`
  ).toBeLessThanOrEqual(1)
  await close.click()
  await expect(panel).toBeHidden({ timeout: 10_000 })
})

test('the panel a project card opens names the project in its header, not in its body', async ({
  page,
  openPage,
  resolvePage
}) => {
  await openPage(await resolvePage(hub, ['Home.aspx', 'Hjem.aspx']))
  const list = webPartByAlias(page, 'ProjectList').first()
  await expect(list).toBeVisible({ timeout: 60_000 })
  const open = list
    .getByRole('button', { name: /åpne prosjektinformasjonspanel|open project information panel/i })
    .first()
  test.skip(
    !(await open
      .waitFor({ timeout: 60_000 })
      .then(() => true)
      .catch(() => false)),
    'the project list shows no project cards to the test user'
  )
  await open.click()
  const drawer = page.getByRole('dialog').last()
  const heading = drawer.locator('.fui-DrawerHeader').getByRole('heading').first()
  await expect(heading, 'the header names the project').toHaveText(/\S/, { timeout: 30_000 })
  const name = (await heading.innerText()).trim()
  // A card shows its title once its logo has loaded, so the list, not one card, is asked.
  await expect(list, "the header names one of the list's projects").toContainText(name)
  await expect(
    drawer.locator('.fui-DrawerBody').getByRole('heading', { name, exact: true }),
    'the body does not repeat the name as a title'
  ).toHaveCount(0)
  await drawer
    .locator('.fui-DrawerHeader')
    .getByRole('button', { name: /^lukk$|^close$/i })
    .click()
  await expect(drawer).toBeHidden({ timeout: 10_000 })
})
