import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import strings from 'SharedLibraryStrings'
import * as React from 'react'
import { ProjectLogo } from '.'
import { format } from '../../util'

const URL = 'https://contoso.sharepoint.com/sites/frisbee'
const SITE_LOGO = `${URL}/_api/siteiconmanager/getsitelogo?type='1'`

/**
 * The logo is preloaded through `new Image()`, which jsdom never loads. This stand-in loads (or
 * fails) after the current task with the height `logo.height`: SharePoint's own logos are 96, 648
 * or 1024 pixels high, so any other height is a logo of the project's own.
 */
const logo = { height: 200, fails: false }
class FakeImage {
  public onload: () => void
  public onerror: () => void
  public get naturalHeight() {
    return logo.height
  }
  private _src: string
  public get src() {
    return this._src
  }
  public set src(value: string) {
    this._src = value
    setTimeout(() => (logo.fails ? this.onerror() : this.onload()))
  }
}

const originalImage = window.Image

beforeEach(() => {
  ;(window as any).Image = FakeImage
  logo.height = 200
  logo.fails = false
})

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
  window.Image = originalImage
})

const image = () => screen.getByAltText(format(strings.Aria.ProjectTitle, 'Frisbeegolfbane'))

describe('ProjectLogo', () => {
  it("shows the project's own logo", async () => {
    const onImageLoad = jest.fn()
    render(<ProjectLogo title='Frisbeegolfbane' url={URL} onImageLoad={onImageLoad} />)
    await waitFor(() => expect(image()).toBeVisible())
    expect(image()).toHaveAttribute('src', SITE_LOGO)
    expect(onImageLoad).toHaveBeenCalledWith(true)
  })

  it("shows the project's initials when the site has SharePoint's own logo", async () => {
    logo.height = 96
    render(<ProjectLogo title='Frisbeegolfbane' url={URL} />)
    expect(await screen.findByText('FR')).toBeInTheDocument()
    expect(image()).not.toBeVisible()
  })

  it('shows the whole title on a card', async () => {
    logo.height = 648
    render(<ProjectLogo title='Frisbeegolfbane' url={URL} renderMode='card' />)
    expect(await screen.findByText('Frisbeegolfbane')).toBeInTheDocument()
  })

  it('sets the title on a card in its own element, which wraps a long word and ends in «…» after four lines (WCAG 1.4.12)', async () => {
    // The avatar centres its initials with flexbox, which cannot cut lines off: a name of one long
    // word, or any long name with more text spacing, went past the box and was cut.
    logo.height = 648
    render(<ProjectLogo title='EtAldriSåLiteProsjektForTesting' url={URL} renderMode='card' />)
    const title = await screen.findByText('EtAldriSåLiteProsjektForTesting')
    expect(title).toHaveClass('cardTitle')
    expect(title).not.toHaveClass('fui-Avatar__initials')
  })

  it("shows the template's image when the project has no logo of its own", async () => {
    logo.height = 1024
    render(<ProjectLogo title='Frisbeegolfbane' url={URL} fallbackImageUrl='/maler/bygg.png' />)
    await waitFor(() => expect(image()).toBeVisible())
    expect(image()).toHaveAttribute('src', '/maler/bygg.png')
  })

  it('falls back to the template image, or the initials, when the logo cannot be loaded', async () => {
    logo.fails = true
    const { unmount } = render(
      <ProjectLogo title='Frisbeegolfbane' url={URL} fallbackImageUrl='/maler/bygg.png' />
    )
    await waitFor(() => expect(image()).toHaveAttribute('src', '/maler/bygg.png'))
    unmount()
    render(<ProjectLogo title='Frisbeegolfbane' url={URL} />)
    expect(await screen.findByText('FR')).toBeInTheDocument()
  })

  it('names the logo and the initials alike, and breaks no rule axe can check', async () => {
    const name = format(strings.Aria.ProjectTitle, 'Frisbeegolfbane')
    const logoShown = render(<ProjectLogo title='Frisbeegolfbane' url={URL} />)
    await waitFor(() => expect(image()).toBeVisible())
    expect(screen.getByRole('img', { name })).toBe(image())
    expect(await axeComponent(logoShown.container)).toHaveNoViolations()
    logoShown.unmount()
    logo.height = 96
    const initials = render(<ProjectLogo title='Frisbeegolfbane' url={URL} />)
    expect(await screen.findByText('FR')).toBeInTheDocument()
    expect(screen.getByRole('img', { name })).not.toBe(image())
    expect(await axeComponent(initials.container)).toHaveNoViolations()
  })
})
