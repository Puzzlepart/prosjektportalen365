import { render, screen } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { ProjectInformationContextProvider } from '../context'
import { ProjectProperties } from './index'

/**
 * The properties block: the visible, non-empty properties with their values rendered by type
 * (text, user, link, date, note), the hidden ones left out unless all are asked for, and the
 * message when nothing is left to show.
 */
type Property = Record<string, any>

function property(
  internalName: string,
  displayName: string,
  value: any,
  type = 'Text',
  overrides: Partial<Property> = {}
): Property {
  return {
    internalName,
    displayName,
    type,
    isSystemField: false,
    isEmpty: value === null || value === undefined || value === '',
    isVisible: () => true,
    getParsedValue: () => value,
    ...overrides
  }
}

function renderProperties(properties: Property[], props: Record<string, any> = {}) {
  render(
    <ProjectInformationContextProvider
      value={
        {
          props: { page: 'Frontpage', showFieldExternal: {}, fallbackVisibleFields: [] },
          state: { properties, data: { fieldValues: { get: () => '' } } },
          dispatch: jest.fn()
        } as any
      }
    >
      <ProjectProperties {...props} />
    </ProjectInformationContextProvider>
  )
}

describe('ProjectProperties', () => {
  it('shows each visible property with its label and value by type', () => {
    renderProperties([
      property('GtProjectGoals', 'Prosjektmål', 'Bedre flyt'),
      property('GtProjectOwner', 'Prosjekteier', [{ text: 'Kari Nordmann', imageUrl: '' }], 'User'),
      property(
        'GtProjectUrl',
        'Lenke',
        { url: 'https://contoso.no', description: 'Contoso' },
        'URL'
      ),
      property('GtStartDate', 'Startdato', new Date('2026-03-15T00:00:00'), 'DateTime'),
      property('GtProjectDescription', 'Beskrivelse', 'Linje 1\nLinje 2', 'Note')
    ])
    expect(screen.getByText('Prosjektmål')).toBeInTheDocument()
    expect(screen.getByText('Bedre flyt')).toBeInTheDocument()
    expect(screen.getByText('Kari Nordmann')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Contoso' })).toHaveAttribute(
      'href',
      'https://contoso.no'
    )
    expect(
      screen.getByText(new Date('2026-03-15T00:00:00').toLocaleDateString())
    ).toBeInTheDocument()
    expect(screen.getByText(/Linje 1/).innerHTML).toContain('<br>')
  })

  it('leaves out hidden, empty and system properties', () => {
    renderProperties([
      property('GtProjectGoals', 'Prosjektmål', 'Bedre flyt'),
      property('GtHidden', 'Skjult', 'x', 'Text', { isVisible: () => false }),
      property('GtEmpty', 'Tom', ''),
      property('Created', 'Opprettet', 'x', 'Text', { isSystemField: true })
    ])
    expect(screen.getByText('Prosjektmål')).toBeInTheDocument()
    expect(screen.queryByText('Skjult')).toBeNull()
    expect(screen.queryByText('Tom')).toBeNull()
    expect(screen.queryByText('Opprettet')).toBeNull()
  })

  it('shows the hidden properties too when all are asked for', () => {
    renderProperties([property('GtHidden', 'Skjult', 'x', 'Text', { isVisible: () => false })], {
      displayAllProperties: true
    })
    expect(screen.getByText('Skjult')).toBeInTheDocument()
  })

  it('tells when no property is left to show', () => {
    renderProperties([property('GtEmpty', 'Tom', '')])
    expect(screen.getByText(strings.NoPropertiesTitle)).toBeInTheDocument()
  })

  it('says so for a value it cannot render', () => {
    renderProperties([
      property('GtBroken', 'Ødelagt', null, 'Text', { isEmpty: false }),
      property('GtThrows', 'Kaster', 'x', 'Text', {
        getParsedValue: () => {
          throw new Error('parse')
        }
      })
    ])
    expect(screen.getAllByText(strings.PropertyValueRenderError)).toHaveLength(2)
  })
})
