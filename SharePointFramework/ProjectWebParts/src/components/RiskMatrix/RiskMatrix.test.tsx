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
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { generateMatrixConfiguration } from '../DynamicMatrix'
import { getMatrixHeaders } from './getMatrixHeaders'
import { RiskMatrix } from './RiskMatrix'

/**
 * The risk matrix: the configured matrix with the risks placed by probability and consequence,
 * the switch that shows them after their actions instead, and the error when the configuration
 * cannot be read. The switch is counted for the risk matrix web part, and a configuration that
 * cannot be read once as an error, for the web part the matrix is in.
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

/**
 * Renders the matrix in the web part with the alias `host`, as the base web part does.
 */
function renderMatrix(items: any[] = [], host = 'RiskMatrixWebPart') {
  render(
    <TelemetryProvider component={host}>
      <RiskMatrix
        items={items}
        pageContext={{} as any}
        manualConfigurationPath='/sites/hub/SiteAssets/matrix.json'
        showTitle
        title='Risikomatrise'
      />
    </TelemetryProvider>
  )
}

describe('RiskMatrix', () => {
  beforeEach(() => startTestTelemetry())

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
    // The set not shown is hidden, not only transparent: a screen reader read both, and the
    // keyboard would have reached an element no one could see.
    expect(screen.getAllByRole('img', { name: '1: Risiko 1' })).toEqual([before])
    await user.click(screen.getByRole('switch'))
    expect(screen.getByText(strings.ToggleUncertaintyPostActionOnText)).toBeInTheDocument()
    expect(before).toHaveStyle({ opacity: '0' })
    expect(after).toHaveStyle({ opacity: '1' })
    expect(screen.getAllByRole('img', { name: '1: Risiko 1' })).toEqual([after])
    // Each turn of the switch is counted, for the risk matrix web part.
    expect(countedTelemetry().usage).toEqual({ 'RiskMatrixWebPart postAction.toggled': 1 })
    await user.click(screen.getByRole('switch'))
    expect(countedTelemetry().usage).toEqual({ 'RiskMatrixWebPart postAction.toggled': 2 })
    expect(countedTelemetry().errors).toEqual({})
  })

  it('counts no switch in the status report, whose web part has no such event', async () => {
    const user = userEvent.setup()
    configurationFile.read = () =>
      Promise.resolve(generateMatrixConfiguration(6, getMatrixHeaders({} as any)))
    renderMatrix([risk(1, 6, 6, [2, 2])], 'ProjectStatusWebPart')
    expect(await screen.findByText(strings.MatrixHeader_VeryHigh)).toBeInTheDocument()
    await user.click(screen.getByRole('switch'))
    expect(screen.getByText(strings.ToggleUncertaintyPostActionOnText)).toBeInTheDocument()
    expect(countedTelemetry().usage).toEqual({})
  })

  it('tells when the configuration cannot be read, and counts it once by its status', async () => {
    configurationFile.read = () =>
      Promise.reject(Object.assign(new Error('Filen finnes ikke'), { status: 404 }))
    renderMatrix()
    expect(
      await screen.findByText(strings.ManualConfigurationNotFoundOrInvalid)
    ).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('switch')).toBeNull())
    expect(countedTelemetry().errors).toEqual({ 'RiskMatrixWebPart not_found 404': 1 })
  })

  it('counts a configuration that cannot be read in a status report for the status web part', async () => {
    // A file that is no JSON has no status: the failure is counted as unknown.
    configurationFile.read = () => Promise.reject(new SyntaxError('Unexpected token < in JSON'))
    renderMatrix([], 'ProjectStatusWebPart')
    expect(
      await screen.findByText(strings.ManualConfigurationNotFoundOrInvalid)
    ).toBeInTheDocument()
    expect(countedTelemetry().errors).toEqual({ 'ProjectStatusWebPart unknown': 1 })
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
