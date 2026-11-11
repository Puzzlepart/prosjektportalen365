// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The properties have tests of their own.
jest.mock('../ProjectProperties', () => ({ ProjectProperties: () => 'Prosjektnummer: P-1' }))

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import * as React from 'react'
import { ProjectInformationContextProvider } from '../context'
import { CLOSE_PANEL } from '../reducer'
import { AllPropertiesPanel } from './index'

/**
 * The panel with all of the project's properties, opened from the actions: text to read, with
 * nothing in it to work in.
 */
function renderPanel(activePanel?: string) {
  const dispatch = jest.fn()
  render(
    <ProjectInformationContextProvider
      value={{ props: { title: 'Prosjektinformasjon' }, state: { activePanel }, dispatch } as any}
    >
      <AllPropertiesPanel />
    </ProjectInformationContextProvider>
  )
  return dispatch
}

describe('AllPropertiesPanel', () => {
  it("lets the keyboard scroll the properties: its body is a region named by the panel's title that takes the focus (WCAG 2.1.1)", async () => {
    renderPanel('AllPropertiesPanel')
    // At 200 % zoom the properties were taller than the panel and the close button was its only
    // stop, so the arrow keys, Page Down and space scrolled nothing (the Windows round, 26.10.2026).
    const body = screen.getByRole('region', { name: 'Prosjektinformasjon' })
    expect(body).toHaveAttribute('tabindex', '0')
    expect(body).toHaveTextContent('Prosjektnummer: P-1')
    expect(await axeComponent(document.body)).toHaveNoViolations()
  })

  it('opens only as the active panel, and closes from its close button', async () => {
    const user = userEvent.setup()
    renderPanel('EditPropertiesPanel')
    expect(screen.queryByRole('dialog')).toBeNull()
    const dispatch = renderPanel('AllPropertiesPanel')
    await user.click(within(screen.getByRole('dialog')).getByRole('button'))
    expect(dispatch).toHaveBeenCalledWith(CLOSE_PANEL())
  })
})
