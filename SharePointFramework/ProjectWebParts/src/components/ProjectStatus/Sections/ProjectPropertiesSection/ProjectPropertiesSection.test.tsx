// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The status element reads the whole report through its own
// hook; it is replaced by its label.
jest.mock('../../StatusElement', () => {
  const React = jest.requireActual('react')
  const { SectionContext } = jest.requireActual('../context')
  return {
    StatusElement: () =>
      React.createElement('div', null, React.useContext(SectionContext).headerProps.label)
  }
})

import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { ProjectStatusContext } from '../../context'
import { SectionContext } from '../context'
import { ProjectPropertiesSection } from './ProjectPropertiesSection'

/**
 * The report's project properties: the section's fields with a value, each with its label, a
 * date as numbers in SharePoint's UI language.
 */
const FIELDS = [
  { InternalName: 'GtStartDate', Title: 'Startdato', TypeAsString: 'DateTime' },
  { InternalName: 'GtEndDate', Title: 'Sluttdato', TypeAsString: 'DateTime' },
  { InternalName: 'GtProjectGoals', Title: 'Prosjektmål', TypeAsString: 'Note' },
  { InternalName: 'GtEmpty', Title: 'Tom', TypeAsString: 'Text' }
]

function renderSection() {
  render(
    <ProjectStatusContext.Provider
      value={
        {
          state: {
            isDataLoaded: true,
            data: {
              properties: {
                fields: FIELDS,
                fieldValues: {
                  _fieldValues: {
                    GtStartDate: '2026-03-15T00:00:00',
                    GtEndDate: 'ikke en dato',
                    GtProjectGoals: 'Bedre flyt'
                  },
                  _fieldValuesAsText: {
                    GtStartDate: '15.3.2026',
                    GtEndDate: 'Uke 40',
                    GtProjectGoals: 'Bedre flyt',
                    GtEmpty: ''
                  }
                }
              },
              reportFields: []
            }
          },
          props: {},
          dispatch: jest.fn()
        } as any
      }
    >
      <SectionContext.Provider
        value={
          {
            section: {
              id: 1,
              viewFields: ['GtStartDate', 'GtEndDate', 'GtProjectGoals', 'GtEmpty']
            },
            headerProps: { label: 'Prosjektegenskaper' }
          } as any
        }
      >
        <ProjectPropertiesSection />
      </SectionContext.Provider>
    </ProjectStatusContext.Provider>
  )
}

describe('ProjectPropertiesSection', () => {
  afterEach(() => {
    delete (window as any)._spPageContextInfo
  })

  it("shows the section's fields with a value, a date in SharePoint's UI language", () => {
    // jsdom's browser language is en-US, where the date would read 3/15/2026.
    ;(window as any)._spPageContextInfo = { currentUICultureName: 'nb-NO' }
    renderSection()
    expect(screen.getByText('Prosjektegenskaper')).toBeInTheDocument()
    expect(screen.getByText('Startdato')).toBeInTheDocument()
    expect(screen.getByText('15.03.2026')).toBeInTheDocument()
    expect(screen.getByText('Bedre flyt')).toBeInTheDocument()
    expect(screen.queryByText('Tom')).toBeNull()
  })

  it('shows the text of a date it cannot read', () => {
    renderSection()
    expect(screen.getByText('Sluttdato')).toBeInTheDocument()
    expect(screen.getByText('Uke 40')).toBeInTheDocument()
  })
})
