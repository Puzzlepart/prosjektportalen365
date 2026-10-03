import { FileIconType } from '@fluentui/react-file-type-icons'
import { render } from '@testing-library/react'
import * as React from 'react'
import { FileTypeIcon } from './FileTypeIcon'

/**
 * The file type glyph as an image from the CDN path the file type icon package names: the
 * extension's own glyph, the folder, list and document set glyphs, the generic glyph for an
 * extension nobody knows, at the size asked for (16 by default).
 */
const src = (element: JSX.Element) => render(element).container.querySelector('img')

describe('FileTypeIcon', () => {
  it("shows a file extension's glyph, as SVG, at 16 pixels unless told otherwise", () => {
    const img = src(<FileTypeIcon extension='docx' />)
    expect(img.getAttribute('src')).toMatch(/\/item-types\/16\/docx\.svg$/)
    expect(img).toHaveAttribute('width', '16')
    expect(img).toHaveAttribute('alt', '')
    expect(src(<FileTypeIcon extension='xlsx' size={48} />).getAttribute('src')).toMatch(
      /\/item-types\/48\/xlsx\.svg$/
    )
  })

  it('shows the folder, list and document set glyphs by type', () => {
    expect(src(<FileTypeIcon type={FileIconType.folder} />).getAttribute('src')).toMatch(
      /\/16\/folder\.svg$/
    )
    expect(src(<FileTypeIcon type={FileIconType.list} />).getAttribute('src')).toMatch(
      /\/16\/splist\.svg$/
    )
    expect(src(<FileTypeIcon type={FileIconType.docset} />).getAttribute('src')).toMatch(
      /\/16\/docset\.svg$/
    )
  })

  it('shows the generic glyph for an extension it does not know', () => {
    expect(src(<FileTypeIcon extension='xyz123' />).getAttribute('src')).toMatch(
      /\/16\/genericfile\.svg$/
    )
  })
})
