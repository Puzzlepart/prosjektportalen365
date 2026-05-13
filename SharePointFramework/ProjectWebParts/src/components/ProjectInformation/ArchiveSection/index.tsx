import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { Button } from '@fluentui/react-components'
import { WebPartTitle, getFluentIcon } from 'pp365-shared-library'
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
  if (!context.props.useArchive) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <WebPartTitle
        title={strings.ArchiveSectionTitle}
        description={strings.ArchiveSectionDescription}
      />
      <Button
        appearance='subtle'
        icon={getFluentIcon('Archive')}
        iconPosition='before'
        onClick={() => context.dispatch(OPEN_DIALOG('ArchiveDialog'))}
        style={{ alignSelf: 'flex-start', justifyContent: 'flex-start' }}
        aria-haspopup='dialog'
      >
        {strings.ArchiveStartButtonLabel}
      </Button>
      <ArchiveStatus />
    </div>
  )
}
