// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The project information inside the panel is its own concern;
// the stand-in shows the title it is given unless told to leave it out, as the real one does.
jest.mock('../ProjectInformation', () => ({
  ProjectInformation: ({ title, hideTitle }: { title?: string; hideTitle?: boolean }) => {
    const React = jest.requireActual('react')
    return React.createElement(
      'div',
      null,
      title && !hideTitle ? React.createElement('h2', null, title) : null,
      'Prosjektinformasjon (panel)'
    )
  }
}))

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { ProjectInformationPanel } from './index'

/**
 * The panel the lists open the project information in: closed until shown, opened by the
 * element it renders as its trigger, showing the children beside it, and titled with the project
 * in its header.
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

  it('names the panel after the project in its header, beside the close button, and only there', () => {
    render(<ProjectInformationPanel {...base} title='Ny svømmehall' hidden={false} />)
    expect(screen.getByRole('dialog', { name: 'Ny svømmehall' })).toBeInTheDocument()
    expect(screen.getAllByText('Ny svømmehall')).toHaveLength(1)
  })
})
