import { AriaLiveAnnouncer } from '@fluentui/react-components'
import { render, waitFor } from '@testing-library/react'
import { format } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import * as React from 'react'
import { CopyProgressScreen } from './index'
import { announced } from 'pp365-jest-config/lib/announce'

/**
 * The screen shown while the copies are made: the file being copied is told to a screen reader as
 * each copy starts (WCAG 4.1.3), since the bar and the file's name change in silence.
 */
describe('CopyProgressScreen', () => {
  it('tells each file as its copy starts (WCAG 4.1.3)', async () => {
    const screen = (description: string, percentComplete: number) => (
      <AriaLiveAnnouncer>
        <CopyProgressScreen
          description={description}
          percentComplete={percentComplete}
          iconOptions={{ extension: 'docx' } as any}
        />
      </AriaLiveAnnouncer>
    )
    const { rerender } = render(screen('Prosjektplan.docx', 0))
    rerender(screen('Avtale.docx', 0.5))
    await waitFor(() =>
      expect(announced()).toContain(format(strings.CopyProgressAnnouncement, 'Avtale.docx'))
    )
  })
})
