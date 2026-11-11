import { render, waitFor } from '@testing-library/react'
import * as React from 'react'
import { useProjectListDataFetch } from './useProjectListDataFetch'

/**
 * The project list's data fetch: the projects and the user's portfolio manager membership when
 * the adapter answers, and the error (with an empty list) when it does not.
 */
function fetchWith(dataAdapter: Record<string, any>) {
  const setState = jest.fn()
  const Probe: React.FC = () => {
    useProjectListDataFetch({ dataAdapter } as any, setState)
    return null
  }
  render(<Probe />)
  return setState
}

describe('useProjectListDataFetch', () => {
  it('hands over the projects and the membership', async () => {
    const setState = fetchWith({
      fetchEnrichedProjects: () => Promise.resolve([{ title: 'Alfa' }]),
      isUserInGroup: () => Promise.resolve(true)
    })
    await waitFor(() => expect(setState).toHaveBeenCalled())
    expect(setState).toHaveBeenCalledWith({
      projects: [{ title: 'Alfa' }],
      isDataLoaded: true,
      isUserInPortfolioManagerGroup: true
    })
  })

  it('hands over the error, with no projects, when the fetch fails', async () => {
    const setState = fetchWith({
      fetchEnrichedProjects: () => Promise.reject(new Error('Søket svarte ikke')),
      isUserInGroup: () => Promise.resolve(false)
    })
    await waitFor(() => expect(setState).toHaveBeenCalled())
    expect(setState).toHaveBeenCalledWith({
      projects: [],
      isDataLoaded: true,
      error: 'Søket svarte ikke'
    })
  })
})
