import { render, screen } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import * as React from 'react'
import { IdeaModuleContext } from '../context'
import { IdeaField } from './IdeaField'

/**
 * A field of an idea: its name and its value as a pair in the idea's description list, a person
 * shown by picture and name and read by the name.
 */
const field = (type: string, value: any) =>
  ({
    displayName: 'Idéeier',
    internalName: 'GtIdeaOwner',
    type,
    getParsedValue: () => value
  }) as any

function renderField(model: any) {
  const context = {
    props: {},
    state: { configuration: { registration: [], processing: [] } },
    setState: jest.fn()
  } as any
  return render(
    <IdeaModuleContext.Provider value={context}>
      <dl>
        <IdeaField model={model} />
      </dl>
    </IdeaModuleContext.Provider>
  )
}

describe('IdeaField', () => {
  it('is a name and value pair, a person in it read once, by name (WCAG 1.3.1, 1.1.1)', () => {
    renderField(
      field('User', [
        { id: 'i:0#.f|membership|kari@contoso.no', text: 'Kari Nordmann', imageUrl: '/foto' }
      ])
    )
    expect(screen.getByRole('term')).toHaveTextContent('Idéeier')
    expect(screen.getByRole('definition')).toHaveTextContent('Kari Nordmann')
    // The picture beside the name says nothing more.
    expect(screen.queryByRole('img')).toBeNull()
    // A login name is no id: one person twice on the page gave two elements the same id.
    expect(document.querySelector('[id^="i:0#"]')).toBeNull()
  })

  it('says so when the field has no value', () => {
    renderField(field('Text', null))
    expect(screen.getByRole('definition')).toHaveTextContent(strings.NotSpecifiedText)
  })
})
