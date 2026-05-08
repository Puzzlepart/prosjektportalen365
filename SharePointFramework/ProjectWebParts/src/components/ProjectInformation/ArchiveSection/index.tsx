import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { Button, FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
import { Archive24Regular } from '@fluentui/react-icons'
import { WebPartTitle, customLightTheme } from 'pp365-shared-library'
import { useProjectInformationContext } from '../context'
import { OPEN_DIALOG } from '../reducer'
import { ArchiveStatus } from '../ArchiveStatus'

/**
 * Archive section in `ProjectInformation`. Renders a header, a "Start arkivering"-button
 * that opens the manual archive dialog, and the `ArchiveStatus` history component.
 *
 * Only rendered when `useArchive` is enabled on the webpart.
 */
export const ArchiveSection: FC = () => {
  const context = useProjectInformationContext()
  const fluentProviderId = useId('fp-archive-section')

  if (!context.props.useArchive) return null

  return (
    <>
      <WebPartTitle
        title={strings.ArchiveSectionTitle}
        description={strings.ArchiveStatusHeaderDescription}
      />
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme} style={{ background: 'transparent' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button
              icon={<Archive24Regular />}
              onClick={() => context.dispatch(OPEN_DIALOG('ArchiveDialog'))}
              style={{ alignSelf: 'flex-start' }}
            >
              {strings.ArchiveStartButtonLabel}
            </Button>
            <ArchiveStatus />
          </div>
        </FluentProvider>
      </IdPrefixProvider>
    </>
  )
}
