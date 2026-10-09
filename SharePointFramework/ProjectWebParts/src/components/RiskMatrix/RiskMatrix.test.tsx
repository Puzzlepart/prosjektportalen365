// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The matrix's manual configuration is a file in the hub, read
// through the data adapter; the stand-in answers with what `configurationFile` holds.
const configurationFile: { read: (path?: string) => Promise<any> } = {
  read: () => Promise.resolve([])
}
jest.mock('../../data', () => ({
  __esModule: true,
  default: {
    portalDataService: {
      web: {
        getFileByServerRelativePath: (path: string) => ({
          using: () => ({ getJSON: () => configurationFile.read(path) })
        })
      }
    }
  }
}))

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { generateMatrixConfiguration } from '../DynamicMatrix'
import { getMatrixHeaders } from './getMatrixHeaders'
import { RiskMatrix } from './RiskMatrix'

/**
 * The risk matrix: the configured matrix with the risks placed by probability and consequence,
 * the switch that shows them after their actions instead, and the error when the configuration
 * cannot be read.
 */
const risk = (id: number, probability: number, consequence: number, post: [number, number]) =>
  ({
    id,
    title: `Risiko ${id}`,
    tooltip: `Risiko ${id}`,
    probability,
    consequence,
    probabilityPostAction: post[0],
    consequencePostAction: post[1],
    item: { Title: `Risiko ${id}` }
  }) as any

function renderMatrix(items: any[] = []) {
  render(
    <RiskMatrix
      items={items}
      pageContext={{} as any}
      manualConfigurationPath='/sites/hub/SiteAssets/matrix.json'
      showTitle
      title='Risikomatrise'
    />
  )
}

describe('RiskMatrix', () => {
  it('draws the configured matrix with the risks, and shows them after their actions on the switch', async () => {
    const user = userEvent.setup()
    configurationFile.read = () =>
      Promise.resolve(generateMatrixConfiguration(6, getMatrixHeaders({} as any)))
    renderMatrix([risk(1, 6, 6, [2, 2])])
    expect(await screen.findByText(strings.MatrixHeader_VeryHigh)).toBeInTheDocument()
    expect(screen.getByText('Risikomatrise', { selector: 'span' })).toBeInTheDocument()
    // The risk is drawn twice: where it is, and where its actions take it (hidden until asked).
    const [before, after] = screen.getAllByTitle('Risiko 1')
    expect(before).toHaveStyle({ opacity: '1' })
    expect(after).toHaveStyle({ opacity: '0' })
    await user.click(screen.getByRole('switch'))
    expect(screen.getByText(strings.ToggleUncertaintyPostActionOnText)).toBeInTheDocument()
    expect(before).toHaveStyle({ opacity: '0' })
    expect(after).toHaveStyle({ opacity: '1' })
  })

  it('tells when the configuration cannot be read', async () => {
    configurationFile.read = () => Promise.reject(new Error('404'))
    renderMatrix()
    expect(
      await screen.findByText(strings.ManualConfigurationNotFoundOrInvalid)
    ).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('switch')).toBeNull())
  })

  it('reads the configuration again when another is chosen, and drops the error', async () => {
    configurationFile.read = (path) =>
      path === '/sites/hub/SiteAssets/ny.json'
        ? Promise.resolve(generateMatrixConfiguration(6, getMatrixHeaders({} as any)))
        : Promise.reject(new Error('404'))
    const pageContext = {} as any
    const { rerender } = render(
      <RiskMatrix
        items={[]}
        pageContext={pageContext}
        manualConfigurationPath='/sites/hub/SiteAssets/borte.json'
      />
    )
    expect(
      await screen.findByText(strings.ManualConfigurationNotFoundOrInvalid)
    ).toBeInTheDocument()
    rerender(
      <RiskMatrix
        items={[]}
        pageContext={pageContext}
        manualConfigurationPath='/sites/hub/SiteAssets/ny.json'
      />
    )
    expect(await screen.findByText(strings.MatrixHeader_VeryHigh)).toBeInTheDocument()
    expect(screen.queryByText(strings.ManualConfigurationNotFoundOrInvalid)).toBeNull()
  })

  it('is drawn as wide as the property pane shows when it is not full width', async () => {
    configurationFile.read = () =>
      Promise.resolve(generateMatrixConfiguration(4, getMatrixHeaders({} as any)))
    const { container } = render(
      <RiskMatrix
        items={[]}
        pageContext={{} as any}
        manualConfigurationPath='/sites/hub/SiteAssets/matrix.json'
        fullWidth={false}
      />
    )
    expect(await screen.findByText(strings.MatrixHeader_Insignificant)).toBeInTheDocument()
    expect(container.querySelector('.dynamicMatrix')).toHaveStyle({ width: '400px' })
  })
})
