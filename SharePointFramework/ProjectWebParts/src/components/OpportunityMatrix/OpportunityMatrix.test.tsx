// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The configuration file is read through the data adapter.
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

import { render, screen } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { generateMatrixConfiguration } from '../DynamicMatrix'
import { getMatrixHeaders } from './getMatrixHeaders'
import { OpportunityMatrix } from './OpportunityMatrix'

/**
 * The opportunity matrix: the same grid as the risk matrix with the opportunities placed by
 * probability and consequence.
 */
describe('OpportunityMatrix', () => {
  it('draws the configured matrix with the opportunities', async () => {
    configurationFile.read = () =>
      Promise.resolve(generateMatrixConfiguration(5, getMatrixHeaders({} as any)))
    render(
      <OpportunityMatrix
        items={[
          {
            id: 7,
            tooltip: 'Mulighet 7',
            probability: 3,
            consequence: 3,
            item: { Title: 'Mulighet 7' }
          } as any
        ]}
        pageContext={{} as any}
        manualConfigurationPath='/sites/hub/SiteAssets/matrix.json'
      />
    )
    expect(await screen.findByText(strings.MatrixHeader_High)).toBeInTheDocument()
    expect(screen.getAllByTitle('Mulighet 7')[0]).toHaveTextContent('7')
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('reads the configuration again when another is chosen, and drops the error', async () => {
    configurationFile.read = (path) =>
      path === '/sites/hub/SiteAssets/ny.json'
        ? Promise.resolve(generateMatrixConfiguration(6, getMatrixHeaders({} as any)))
        : Promise.reject(new Error('404'))
    const pageContext = {} as any
    const { rerender } = render(
      <OpportunityMatrix
        items={[]}
        pageContext={pageContext}
        manualConfigurationPath='/sites/hub/SiteAssets/borte.json'
      />
    )
    expect(
      await screen.findByText(strings.ManualConfigurationNotFoundOrInvalid)
    ).toBeInTheDocument()
    rerender(
      <OpportunityMatrix
        items={[]}
        pageContext={pageContext}
        manualConfigurationPath='/sites/hub/SiteAssets/ny.json'
      />
    )
    expect(await screen.findByText(strings.MatrixHeader_ExtremelyHigh)).toBeInTheDocument()
    expect(screen.queryByText(strings.ManualConfigurationNotFoundOrInvalid)).toBeNull()
  })
})
