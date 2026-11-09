// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The image colour hook loads the project's logo into a canvas;
// the stand-in keeps a hook of its own, as the library does, so a call it skips changes the count.
const mockImageColor = jest.fn()
jest.mock('use-image-color', () => ({
  __esModule: true,
  default: (src: string, settings: any) => {
    const { useState } = jest.requireActual('react')
    useState(null)
    mockImageColor(src, settings)
    return { colors: src ? ['#123456', '#fedcba'] : undefined }
  }
}))

import { render } from '@testing-library/react'
import * as React from 'react'
import { ProjectCardContext } from '../context'
import { useProjectCardHeader } from './useProjectCardHeader'

/**
 * A project card's header: with dynamic colours, the colours of the project's site logo, read
 * through the image colour hook; without them, or with a logo of its own, transparent. The hook
 * runs on every render, so turning dynamic colours on or off keeps the card rendering.
 */
const project = { url: 'https://contoso.sharepoint.com/sites/frisbee' } as any

function renderHeader(context: Record<string, any>) {
  const result: { colors?: string[] } = {}
  const Probe: React.FC = () => {
    result.colors = useProjectCardHeader().colors
    return null
  }
  const ui = (ctx: Record<string, any>) => (
    <ProjectCardContext.Provider
      value={{ showProjectLogo: true, shouldDisplay: () => true, ...ctx } as any}
    >
      <Probe />
    </ProjectCardContext.Provider>
  )
  const { rerender } = render(ui(context))
  return { result, rerender: (ctx: Record<string, any>) => rerender(ui(ctx)) }
}

beforeEach(() => mockImageColor.mockClear())

describe('useProjectCardHeader', () => {
  it("colours the header from the project's site logo with dynamic colours", () => {
    const { result } = renderHeader({ useDynamicColors: true, project })
    expect(mockImageColor).toHaveBeenLastCalledWith(
      `${project.url}/_api/siteiconmanager/getsitelogo?type='1'`,
      { cors: true, colors: 2, windowSize: 5 }
    )
    expect(result.colors).toEqual(['#123456', '#fedcba'])
  })

  it('loads no logo and stays transparent without dynamic colours, or with a logo of its own', () => {
    const { result } = renderHeader({ useDynamicColors: false, project })
    expect(mockImageColor).toHaveBeenLastCalledWith('', expect.anything())
    expect(result.colors).toEqual(['transparent', 'transparent'])
    const withLogo = renderHeader({
      useDynamicColors: true,
      project: { ...project, logo: 'https://contoso.sharepoint.com/logo.png' }
    })
    expect(mockImageColor).toHaveBeenLastCalledWith('', expect.anything())
    expect(withLogo.result.colors).toEqual(['transparent', 'transparent'])
  })

  it('keeps rendering when dynamic colours are turned on, and when the project arrives', () => {
    const { result, rerender } = renderHeader({ useDynamicColors: false, project })
    expect(() => rerender({ useDynamicColors: true, project })).not.toThrow()
    expect(result.colors).toEqual(['#123456', '#fedcba'])
    const loading = renderHeader({ useDynamicColors: true, project: undefined })
    expect(() => loading.rerender({ useDynamicColors: true, project })).not.toThrow()
  })
})
