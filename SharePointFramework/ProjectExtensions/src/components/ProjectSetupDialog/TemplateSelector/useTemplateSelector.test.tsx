import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { ProjectSetupDialogContext } from '../context'
import { useTemplateSelector } from './useTemplateSelector'

/** Minimal template model for selector filtering and ordering tests. */
const template = (id: number, text: string, extra: Record<string, any> = {}) =>
  ({
    id,
    text,
    subText: `Om ${text}`,
    hidden: false,
    isDefault: false,
    extensions: [],
    contentConfig: [],
    ...extra
  }) as any

/** Exposes matching templates without depending on the combobox's popup rendering. */
const Probe: React.FC = () => {
  const { matchingTemplates } = useTemplateSelector()
  return <div data-testid='templates'>{matchingTemplates.map((t) => t.text).join('|')}</div>
}

function renderProbe(templates: any[]) {
  render(
    <ProjectSetupDialogContext.Provider
      value={
        {
          props: { data: { templates, hasExistingTemplate: false } },
          state: { selectedTemplate: null, isResolvingCloudTemplate: false },
          dispatch: jest.fn()
        } as any
      }
    >
      <Probe />
    </ProjectSetupDialogContext.Provider>
  )
}

describe('useTemplateSelector', () => {
  it('offers the templates in title order', () => {
    renderProbe([template(2, 'Bravo-mal'), template(3, 'Charlie-mal'), template(1, 'Alfa-mal')])
    expect(screen.getByTestId('templates')).toHaveTextContent('Alfa-mal|Bravo-mal|Charlie-mal')
  })

  it('leaves out hidden templates', () => {
    renderProbe([template(1, 'Alfa-mal'), template(2, 'Skjult mal', { hidden: true })])
    expect(screen.getByTestId('templates')).toHaveTextContent('Alfa-mal')
    expect(screen.getByTestId('templates')).not.toHaveTextContent('Skjult mal')
  })
})
