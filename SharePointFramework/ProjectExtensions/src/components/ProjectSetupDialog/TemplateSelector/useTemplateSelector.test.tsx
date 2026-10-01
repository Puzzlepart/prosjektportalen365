import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { ProjectSetupDialogContext } from '../context'
import { useTemplateSelector } from './useTemplateSelector'

/**
 * The templates the selector offers: in title order whatever order the hub's list returns them in,
 * without the hidden ones, and narrowed by the search. Read through a probe component, since the
 * combobox that shows them only renders its options when opened.
 */
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
