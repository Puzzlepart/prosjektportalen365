import { render, screen } from '@testing-library/react'
import { Fluent } from 'pp365-shared-library'
import React from 'react'
import { ProjectInformationContextProvider } from '../context'
import { SustainabilityGoals } from './SustainabilityGoals'

function renderGoals(
  terms: Array<{ key: string; name: string }>,
  props: Record<string, any> = {},
  visible = true
) {
  const model = {
    internalName: 'GtUNSustDevGoals',
    displayName: 'FNs bærekraftsmål',
    isEmpty: terms.length === 0,
    isVisible: jest.fn(() => visible),
    getParsedValue: jest.fn(() => terms)
  }

  render(
    <ProjectInformationContextProvider
      value={
        {
          props: {
            page: 'Frontpage',
            showFieldExternal: {},
            fallbackVisibleFields: [],
            showSustainabilityGoals: true,
            sustainabilityGoalIconSize: 48,
            ...props
          },
          state: { properties: [model] },
          dispatch: jest.fn()
        } as any
      }
    >
      <Fluent transparent>
        <SustainabilityGoals />
      </Fluent>
    </ProjectInformationContextProvider>
  )

  return model
}

describe('SustainabilityGoals', () => {
  it('shows selected goals in numeric order at the configured size', () => {
    const model = renderGoals(
      [
        { key: 'climate', name: '13. Stoppe klimaendringene' },
        { key: 'energy', name: '07. Ren energi til alle' },
        { key: 'innovation', name: '09. Industri, innovasjon og infrastruktur' }
      ],
      { sustainabilityGoalIconSize: 64 }
    )

    expect(screen.getByText('FNs bærekraftsmål')).toBeInTheDocument()
    const images = screen.getAllByRole('img')
    expect(images.map((image) => image.getAttribute('alt'))).toEqual([
      '07. Ren energi til alle',
      '09. Industri, innovasjon og infrastruktur',
      '13. Stoppe klimaendringene'
    ])
    expect(images.every((image) => image.getAttribute('width') === '64')).toBe(true)
    expect(screen.getByRole('list')).toHaveClass('goals')
    expect(model.isVisible).toHaveBeenCalled()
  })

  it('renders nothing when the section is disabled or the field is not visible', () => {
    renderGoals([{ key: 'energy', name: '07. Ren energi til alle' }], {
      showSustainabilityGoals: false
    })
    expect(screen.queryByText('FNs bærekraftsmål')).toBeNull()

    renderGoals([{ key: 'climate', name: '13. Stoppe klimaendringene' }], {}, false)
    expect(screen.queryByRole('img')).toBeNull()
  })
})
