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
import userEvent from '@testing-library/user-event'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { generateMatrixConfiguration } from '../DynamicMatrix'
import { getMatrixHeaders } from './getMatrixHeaders'
import { OpportunityMatrix } from './OpportunityMatrix'

/**
 * The opportunity matrix: the same grid as the risk matrix with the opportunities placed by
 * probability and consequence, and the switch that shows them after their actions, counted for
 * the opportunity matrix web part. A configuration that cannot be read is counted once as an
 * error.
 */
describe('OpportunityMatrix', () => {
  beforeEach(() => startTestTelemetry())

  it('draws the configured matrix with the opportunities, and counts a turn of its switch', async () => {
    const user = userEvent.setup()
    configurationFile.read = () =>
      Promise.resolve(generateMatrixConfiguration(5, getMatrixHeaders({} as any)))
    render(
      <TelemetryProvider component='OpportunityMatrixWebPart'>
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
      </TelemetryProvider>
    )
    expect(await screen.findByText(strings.MatrixHeader_High)).toBeInTheDocument()
    expect(screen.getAllByTitle('Mulighet 7')[0]).toHaveTextContent('7')
    expect(countedTelemetry().usage).toEqual({})
    await user.click(screen.getByRole('switch'))
    expect(screen.getByText(strings.ToggleUncertaintyPostActionOnText)).toBeInTheDocument()
    expect(countedTelemetry().usage).toEqual({ 'OpportunityMatrixWebPart postAction.toggled': 1 })
    expect(countedTelemetry().errors).toEqual({})
  })

  it('tells when the configuration cannot be read, and counts it once by its status', async () => {
    configurationFile.read = () =>
      Promise.reject(Object.assign(new Error('Ingen tilgang'), { status: 403 }))
    render(
      <TelemetryProvider component='OpportunityMatrixWebPart'>
        <OpportunityMatrix
          items={[]}
          pageContext={{} as any}
          manualConfigurationPath='/sites/hub/SiteAssets/matrix.json'
        />
      </TelemetryProvider>
    )
    expect(
      await screen.findByText(strings.ManualConfigurationNotFoundOrInvalid)
    ).toBeInTheDocument()
    expect(countedTelemetry().errors).toEqual({
      'OpportunityMatrixWebPart permission_denied 403': 1
    })
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
