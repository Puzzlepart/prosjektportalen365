import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { ProjectSetupDialogContext } from '../context'
import { useExtensionsSection } from './useExtensionsSection'

/**
 * The order the section lists its items in: the ones the chosen template makes mandatory first,
 * then the ones already selected, then the rest, each group in title order. Read through a probe
 * component, with stand-ins for the model that carry only what the hook reads.
 */
const item = (key: string, text: string, mandatory = false) =>
  ({ key, text, subText: '', hidden: false, isMandatoryForTemplate: () => mandatory }) as any

const Probe: React.FC = () => {
  const { items } = useExtensionsSection()
  return <div data-testid='items'>{items.map((i) => i.text).join('|')}</div>
}

function renderProbe(all: any[], selected: any[]) {
  render(
    <ProjectSetupDialogContext.Provider
      value={
        {
          props: { data: { extensions: all } },
          state: { selectedTemplate: {}, selectedExtensions: selected },
          dispatch: jest.fn()
        } as any
      }
    >
      <Probe />
    </ProjectSetupDialogContext.Provider>
  )
}

describe('useExtensionsSection', () => {
  it('lists the mandatory items first, then the selected, then the rest, each in title order', () => {
    const sierra = item('s1', 'Sierra')
    const bravo = item('s2', 'Bravo')
    renderProbe(
      [
        item('r2', 'Zulu'),
        item('m2', 'Mike', true),
        sierra,
        item('r1', 'Echo'),
        item('m1', 'Alfa', true),
        bravo
      ],
      [sierra, bravo]
    )
    expect(screen.getByTestId('items')).toHaveTextContent('Alfa|Mike|Bravo|Sierra|Echo|Zulu')
  })

  it('leaves out hidden items', () => {
    renderProbe([item('a', 'Alfa'), { ...item('h', 'Skjult'), hidden: true }], [])
    expect(screen.getByTestId('items')).toHaveTextContent('Alfa')
    expect(screen.getByTestId('items')).not.toHaveTextContent('Skjult')
  })
})
