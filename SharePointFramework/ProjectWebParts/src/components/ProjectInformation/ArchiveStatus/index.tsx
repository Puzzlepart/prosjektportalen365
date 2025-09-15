import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { WebPartTitle, customLightTheme, formatDate, getFluentIcon } from 'pp365-shared-library'
import {
  FluentProvider,
  IdPrefixProvider,
  Popover,
  PopoverTrigger,
  PopoverSurface,
  MessageBar
} from '@fluentui/react-components'
import { format } from '@fluentui/react'
import { ArchiveStatusPopover } from './ArchiveStatusPopover'
import { useArchiveStatus } from './useArchiveStatus'
import styles from './ArchiveStatus.module.scss'

export const ArchiveStatus: FC = () => {
  const { archiveInfo, processedOperations, open, fluentProviderId, handleOpenChange, shouldHide } =
    useArchiveStatus()

  if (shouldHide) {
    return null
  }

  return (
    <>
      <WebPartTitle
        title={strings.ArchiveStatusHeaderText}
        description={strings.ArchiveStatusHeaderDescription}
      />
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <Popover
            withArrow
            positioning='below'
            mouseLeaveDelay={300}
            open={open}
            onOpenChange={handleOpenChange}
          >
            <PopoverTrigger disableButtonEnhancement>
              <MessageBar
                intent='info'
                icon={getFluentIcon('Archive')}
                className={styles.messageBar}
              >
                {format(
                  strings.ArchiveStatusDetailedMessage,
                  formatDate(archiveInfo.lastArchiveDate)
                )}
              </MessageBar>
            </PopoverTrigger>
            <PopoverSurface>
              <ArchiveStatusPopover archiveInfo={archiveInfo} operations={processedOperations} />
            </PopoverSurface>
          </Popover>
        </FluentProvider>
      </IdPrefixProvider>
    </>
  )
}
