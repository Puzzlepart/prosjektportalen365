import { PropertyPaneFieldType } from '@microsoft/sp-property-pane'
import { act } from '@testing-library/react'
import { PropertyPaneDescription } from '.'

describe('PropertyPaneDescription', () => {
  it('is a custom field that renders its markdown and lets go of it when disposed', () => {
    const field = PropertyPaneDescription('Se **brukerveiledningen**.')
    expect(field.type).toBe(PropertyPaneFieldType.Custom)
    expect(field.properties.hidden).toBe(false)
    const element = document.createElement('div')
    act(() => {
      field.properties.onRender(element)
    })
    expect(element).toHaveTextContent('Se **brukerveiledningen**.')
    act(() => {
      field.properties.onDispose(element)
    })
    expect(element).toBeEmptyDOMElement()
  })

  it('is hidden when its condition does not hold, and gets its own key', () => {
    const shown = PropertyPaneDescription('A')
    const hidden = PropertyPaneDescription('B', false)
    expect(hidden.properties.hidden).toBe(true)
    expect(hidden.properties.key).not.toBe(shown.properties.key)
  })
})
