import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { FileNameColumn } from '.'

/**
 * The file name column of the aggregated views: the file's coloured type glyph before its name (a
 * folder's and a document set's glyphs for those), and the name as a button that opens the file in
 * the browser: Office files through `Doc.aspx` on the site the file is on, a PDF as a download, a
 * file with a redirect at its redirect. A folder's name is text.
 */
const glyph = (container: HTMLElement) => container.querySelector('img')?.getAttribute('src')

function renderColumn(item: Record<string, any>, extra: Record<string, any> = {}) {
  return render(<FileNameColumn item={item} columnValue={item.FileLeafRef} {...extra} />)
}

describe('FileNameColumn', () => {
  let open: jest.SpyInstance

  beforeEach(() => {
    open = jest.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => open.mockRestore())

  it("shows the file's type glyph, and opens an Office file in the browser on its site", () => {
    const { container } = renderColumn({
      FileLeafRef: 'Prosjektplan.docx',
      FileRef: '/sites/frisbee/Delte dokumenter/Prosjektplan.docx',
      File_x0020_Type: 'docx'
    })
    expect(glyph(container)).toMatch(/\/item-types\/20\/docx\.svg$/)
    fireEvent.click(screen.getByRole('button', { name: 'Prosjektplan.docx' }))
    expect(open).toHaveBeenCalledWith(
      `${window.location.origin}/sites/frisbee/_layouts/15/Doc.aspx?sourcedoc=${encodeURIComponent(
        '/sites/frisbee/Delte dokumenter/Prosjektplan.docx'
      )}&action=view`,
      '_blank',
      'noopener,noreferrer'
    )
  })

  it('downloads a PDF, and opens a file at its redirect when it has one', () => {
    renderColumn({
      FileLeafRef: 'Kontrakt.pdf',
      FileRef: '/sites/frisbee/Delte dokumenter/Kontrakt.pdf',
      FileExtension: 'pdf'
    })
    fireEvent.click(screen.getByRole('button', { name: 'Kontrakt.pdf' }))
    expect(open).toHaveBeenLastCalledWith(
      '/sites/frisbee/Delte dokumenter/Kontrakt.pdf?download=1',
      '_blank',
      'noopener,noreferrer'
    )
    renderColumn({
      FileLeafRef: 'Budsjett.xlsx',
      FileRef: '/sites/frisbee/Delte dokumenter/Budsjett.xlsx',
      File_x0020_Type: 'xlsx',
      ServerRedirectedURL: 'https://contoso.sharepoint.com/:x:/r/sites/frisbee/budsjett'
    })
    fireEvent.click(screen.getByRole('button', { name: 'Budsjett.xlsx' }))
    expect(open).toHaveBeenLastCalledWith(
      'https://contoso.sharepoint.com/:x:/r/sites/frisbee/budsjett',
      '_blank',
      'noopener,noreferrer'
    )
  })

  it("shows a folder's glyph and its name as text, and a document set's glyph", () => {
    const { container } = renderColumn({
      FileLeafRef: 'Kontrakter',
      FileRef: '/sites/frisbee/Delte dokumenter/Kontrakter',
      FSObjType: 1
    })
    expect(glyph(container)).toMatch(/\/item-types\/20\/folder\.svg$/)
    expect(screen.getByText('Kontrakter').tagName).toBe('SPAN')
    expect(screen.queryByRole('button')).toBeNull()
    const docSet = renderColumn({
      FileLeafRef: 'Anbud',
      FileRef: '/sites/frisbee/Delte dokumenter/Anbud',
      ContentTypeId: '0x0120D520008A1B2C'
    })
    expect(glyph(docSet.container)).toMatch(/\/item-types\/20\/docset\.svg$/)
  })

  it('leaves the glyph out when told to, and shows a name without a file as text', () => {
    const { container } = renderColumn(
      { FileLeafRef: 'Notat.txt', File_x0020_Type: 'txt' },
      { showFileExtensionIcon: false }
    )
    expect(glyph(container)).toBeUndefined()
    expect(screen.getByText('Notat.txt').tagName).toBe('SPAN')
  })
})
