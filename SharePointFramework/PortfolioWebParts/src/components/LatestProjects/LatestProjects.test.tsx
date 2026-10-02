import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'PortfolioWebPartsStrings'
import * as React from 'react'
import { LatestProjects } from './LatestProjects'

/**
 * The latest projects web part: the newest sites from the data adapter, listed up to the row
 * limit with a link each, the rest behind "view more", and a message when there are none or the
 * fetch fails.
 */
const site = (title: string) => ({
  Title: title,
  Path: `/sites/${title.toLowerCase()}`,
  Created: '2026-09-01T08:00:00Z'
})

function renderLatest(result: any[] | Error, props: Record<string, any> = {}) {
  const dataAdapter = {
    fetchProjectSites: jest.fn(() =>
      result instanceof Error ? Promise.reject(result) : Promise.resolve(result)
    )
  }
  render(
    <LatestProjects
      title='Siste prosjekter'
      dataAdapter={dataAdapter as any}
      rowLimit={2}
      maxRowLimit={10}
      {...props}
    />
  )
  return dataAdapter
}

describe('LatestProjects', () => {
  it('asks the adapter for the newest sites and lists them up to the row limit, each as a link', async () => {
    const dataAdapter = renderLatest([site('Alfa'), site('Bravo'), site('Charlie')])
    expect(await screen.findByRole('link', { name: 'Alfa' })).toHaveAttribute('href', '/sites/alfa')
    // The third argument is PnP's sort direction enum, a stub under Jest.
    expect(dataAdapter.fetchProjectSites.mock.calls[0].slice(0, 2)).toEqual([10, 'Created'])
    expect(screen.getByRole('link', { name: 'Bravo' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Charlie' })).toBeNull()
    // WebPartTitle renders an <h2> around a span[role=heading]; both carry the text, so target the span.
    expect(screen.getByText('Siste prosjekter', { selector: 'span' })).toBeInTheDocument()
  })

  it('shows the rest on "view more" and folds them again on "view less"', async () => {
    const user = userEvent.setup()
    renderLatest([site('Alfa'), site('Bravo'), site('Charlie')])
    await screen.findByRole('link', { name: 'Alfa' })
    await user.click(screen.getByRole('button', { name: strings.ViewMoreText }))
    expect(screen.getByRole('link', { name: 'Charlie' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: strings.ViewLessText }))
    expect(screen.queryByRole('link', { name: 'Charlie' })).toBeNull()
  })

  it('has no "view more" when the projects fit the limit', async () => {
    renderLatest([site('Alfa')])
    await screen.findByRole('link', { name: 'Alfa' })
    expect(screen.queryByRole('button', { name: strings.ViewMoreText })).toBeNull()
  })

  it('tells when there are no projects', async () => {
    renderLatest([])
    expect(await screen.findByText(strings.NoProjectsFoundTitle)).toBeInTheDocument()
  })

  it('tells the same when the fetch fails', async () => {
    renderLatest(new Error('Søket feilet'))
    expect(await screen.findByText(strings.NoProjectsFoundTitle)).toBeInTheDocument()
  })
})
