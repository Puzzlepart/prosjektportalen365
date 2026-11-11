import { render, screen } from '@testing-library/react'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import * as React from 'react'
import { FileNameColumn } from '.'

/**
 * The file name column of the aggregated views: the file's coloured type glyph before its name (a
 * folder's and a document set's glyphs for those), and the name as a link that opens the file in
 * a new tab: Office files through `Doc.aspx` on the site the file is on, a PDF as a download, a
 * file with a redirect at its redirect. A folder's name is text. A link rather than a button, so
 * it is read and listed as one, and can be copied or opened where the user wants it (WCAG 4.1.2).
 */
const glyph = (container: HTMLElement) => container.querySelector('img')?.getAttribute('src')

function renderColumn(item: Record<string, any>, extra: Record<string, any> = {}) {
  return render(<FileNameColumn item={item} columnValue={item.FileLeafRef} {...extra} />)
}

/** The link of a file, asserted to open in a new tab without handing that tab the page. */
function fileLink(name: string) {
  const link = screen.getByRole('link', { name })
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  return link
}

describe('FileNameColumn', () => {
  it("shows the file's type glyph, and links an Office file to the browser on its site", async () => {
    const { container } = renderColumn({
      FileLeafRef: 'Prosjektplan.docx',
      FileRef: '/sites/frisbee/Delte dokumenter/Prosjektplan.docx',
      File_x0020_Type: 'docx'
    })
    expect(glyph(container)).toMatch(/\/item-types\/20\/docx\.svg$/)
    expect(fileLink('Prosjektplan.docx')).toHaveAttribute(
      'href',
      `${window.location.origin}/sites/frisbee/_layouts/15/Doc.aspx?sourcedoc=${encodeURIComponent(
        '/sites/frisbee/Delte dokumenter/Prosjektplan.docx'
      )}&action=view`
    )
    expect(await axeComponent(container)).toHaveNoViolations()
  })

  it('downloads a PDF, and links a file to its redirect when it has one', () => {
    renderColumn({
      FileLeafRef: 'Kontrakt.pdf',
      FileRef: '/sites/frisbee/Delte dokumenter/Kontrakt.pdf',
      FileExtension: 'pdf'
    })
    expect(fileLink('Kontrakt.pdf')).toHaveAttribute(
      'href',
      '/sites/frisbee/Delte dokumenter/Kontrakt.pdf?download=1'
    )
    renderColumn({
      FileLeafRef: 'Budsjett.xlsx',
      FileRef: '/sites/frisbee/Delte dokumenter/Budsjett.xlsx',
      File_x0020_Type: 'xlsx',
      ServerRedirectedURL: 'https://contoso.sharepoint.com/:x:/r/sites/frisbee/budsjett'
    })
    expect(fileLink('Budsjett.xlsx')).toHaveAttribute(
      'href',
      'https://contoso.sharepoint.com/:x:/r/sites/frisbee/budsjett'
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
    expect(screen.queryByRole('link')).toBeNull()
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
