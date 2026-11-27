import { cleanup, render, screen } from '@testing-library/react'
import strings from 'ProjectExtensionsStrings'
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

/** Exposes the choices and how they are shown, without depending on the controls' rendering. */
const Probe: React.FC = () => {
  const { choices, showAsCards } = useTemplateSelector()
  return (
    <>
      <div data-testid='templates'>{choices.map((t) => t.text).join('|')}</div>
      <div data-testid='shown-as'>{showAsCards ? 'cards' : 'dropdown'}</div>
    </>
  )
}

function renderProbe(templates: any[], hasExistingTemplate = false, selectedTemplate: any = null) {
  render(
    <ProjectSetupDialogContext.Provider
      value={
        {
          props: { data: { templates, hasExistingTemplate } },
          state: { selectedTemplate, isResolvingCloudTemplate: false },
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

  it('offers the default template first, where the eye starts', () => {
    renderProbe([template(1, 'Alfa-mal'), template(2, 'Standardmal', { isDefault: true })])
    expect(screen.getByTestId('templates')).toHaveTextContent('Standardmal|Alfa-mal')
  })

  it('leaves out hidden templates', () => {
    renderProbe([template(1, 'Alfa-mal'), template(2, 'Skjult mal', { hidden: true })])
    expect(screen.getByTestId('templates')).toHaveTextContent('Alfa-mal')
    expect(screen.getByTestId('templates')).not.toHaveTextContent('Skjult mal')
  })

  it('offers «Ingen mal» first on a project that has a template already', () => {
    renderProbe([template(2, 'Bravo-mal'), template(1, 'Alfa-mal')], true)
    expect(screen.getByTestId('templates')).toHaveTextContent(
      `${strings.ProjectTemplateSelectorNoTemplateLabel}|Alfa-mal|Bravo-mal`
    )
  })

  it('shows up to four templates as cards, all visible at once, and more in a dropdown', () => {
    const four = [1, 2, 3, 4].map((id) => template(id, `Mal ${id}`))
    renderProbe(four)
    expect(screen.getByTestId('shown-as')).toHaveTextContent('cards')
    cleanup()
    renderProbe([...four, template(5, 'Mal 5')])
    expect(screen.getByTestId('shown-as')).toHaveTextContent('dropdown')
  })

  it('shows a hidden template while it is the one that will be applied', () => {
    const hidden = template(2, 'Skjult standardmal', { hidden: true })
    renderProbe([template(1, 'Alfa-mal'), hidden], false, hidden)
    expect(screen.getByTestId('templates')).toHaveTextContent('Alfa-mal|Skjult standardmal')
  })
})
