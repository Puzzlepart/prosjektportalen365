import { whenHostMenuHasClosed } from './whenHostMenuHasClosed'

/** A menu of SharePoint's with the focus on one of its items, as a command runs from "Mer". */
function openMenu() {
  const more = document.createElement('button')
  const menu = document.createElement('div')
  menu.setAttribute('role', 'menu')
  const item = document.createElement('button')
  item.setAttribute('role', 'menuitem')
  menu.appendChild(item)
  document.body.append(more, menu)
  item.focus()
  return {
    more,
    close: () => {
      menu.remove()
      more.focus()
    }
  }
}

afterEach(() => document.body.replaceChildren())

describe('whenHostMenuHasClosed', () => {
  it('resolves at once when no menu has the focus', async () => {
    const started = Date.now()
    await whenHostMenuHasClosed(1_000, 200)
    expect(Date.now() - started).toBeLessThan(100)
  })

  it('waits while a menu has the focus, until it has closed and SharePoint has tidied up after it', async () => {
    const { more, close } = openMenu()
    let resolved = false
    const waiting = whenHostMenuHasClosed(2_000, 100).then(() => (resolved = true))
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(resolved).toBe(false)
    close()
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(resolved).toBe(false)
    await waiting
    expect(document.activeElement).toBe(more)
  })

  it('stops waiting after the timeout when the menu stays open', async () => {
    openMenu()
    const started = Date.now()
    await whenHostMenuHasClosed(200, 50)
    expect(Date.now() - started).toBeGreaterThanOrEqual(200)
  })
})
