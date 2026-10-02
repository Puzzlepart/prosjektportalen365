// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The project information inside the panel is its own concern.
jest.mock('../ProjectInformation', () => ({
  ProjectInformation: () => {
    const React = jest.requireActual('react')
    return React.createElement('div', null, 'Prosjektinformasjon (panel)')
  }
}))

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { ProjectInformationPanel } from './index'

/**
 * The panel the lists open the project information in: closed until shown, opened by the
 * element it renders as its trigger, and showing the children beside it.
 */
const base = {
  siteId: 'site-1',
  webAbsoluteUrl: '/sites/alfa',
  spfxContext: {} as any,
  page: 'Portfolio' as const
}

describe('ProjectInformationPanel', () => {
  it('stays closed while hidden and opens when shown', () => {
    const { rerender } = render(<ProjectInformationPanel {...base} hidden />)
    expect(screen.queryByText('Prosjektinformasjon (panel)')).toBeNull()
    rerender(<ProjectInformationPanel {...base} hidden={false} />)
    expect(screen.getByText('Prosjektinformasjon (panel)')).toBeInTheDocument()
  })

  it('opens from its own trigger element and shows the children beside it', async () => {
    const user = userEvent.setup()
    render(
      <ProjectInformationPanel
        {...base}
        onRenderToggleElement={(onToggle) => <button onClick={onToggle}>Åpne</button>}
      >
        <span>Alfa</span>
      </ProjectInformationPanel>
    )
    expect(screen.getByText('Alfa')).toBeInTheDocument()
    expect(screen.queryByText('Prosjektinformasjon (panel)')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Åpne' }))
    expect(screen.getByText('Prosjektinformasjon (panel)')).toBeInTheDocument()
  })
})
