import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import {
  WebPartTitle,
  customLightTheme,
  formatDate,
  getFluentIcon,
  format
} from 'pp365-shared-library'
import {
  FluentProvider,
  IdPrefixProvider,
  Popover,
  PopoverTrigger,
  PopoverSurface,
  MessageBar
} from '@fluentui/react-components'
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
        headingLevel={3}
      />
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <Popover
            withArrow
            positioning='below'
            mouseLeaveDelay={300}
            open={open}
            onOpenChange={handleOpenChange}
            // Its operations fold open and shut, so it holds the focus until it is closed; without
            // it Tab left for the top of the page and left the popover open (WCAG 2.4.3).
            trapFocus
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
            <PopoverSurface aria-label={strings.ArchiveStatusHeaderText}>
              <ArchiveStatusPopover archiveInfo={archiveInfo} operations={processedOperations} />
            </PopoverSurface>
          </Popover>
        </FluentProvider>
      </IdPrefixProvider>
    </>
  )
}
