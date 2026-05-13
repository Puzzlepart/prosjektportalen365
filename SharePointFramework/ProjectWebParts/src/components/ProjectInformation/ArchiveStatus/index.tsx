import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { customLightTheme, formatDate, getFluentIcon } from 'pp365-shared-library'
import {
  FluentProvider,
  IdPrefixProvider,
  MessageBar,
  MessageBarBody,
  Popover,
  PopoverSurface,
  PopoverTrigger
} from '@fluentui/react-components'
import { format } from '@fluentui/react'
import { ArchiveStatusDetails } from './ArchiveStatusDetails/ArchiveStatusDetails'
import { useArchiveStatus } from './useArchiveStatus'
import styles from './ArchiveStatus.module.scss'

export const ArchiveStatus: FC = () => {
  const {
    archiveInfo,
    processedOperations,
    aggregateCounts,
    intent,
    fluentProviderId,
    open,
    handleOpenChange,
    refresh,
    shouldHide
  } = useArchiveStatus()

  if (shouldHide) {
    return null
  }

  const totalEntries =
    aggregateCounts.success +
    aggregateCounts.pending +
    aggregateCounts.error +
    aggregateCounts.warning

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <Popover withArrow positioning='above' open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger disableButtonEnhancement>
            <MessageBar
              intent={intent}
              layout='multiline'
              icon={getFluentIcon('Archive')}
              className={styles.messageBar}
            >
              <MessageBarBody className={styles.messageBarBody}>
                <span className={styles.messageBarLine}>
                  {format(
                    strings.ArchiveStatusDetailedMessage,
                    formatDate(archiveInfo.lastArchiveDate)
                  )}
                </span>
                <span className={styles.messageBarLine}>
                  {format(
                    strings.ArchiveStatusAggregateCounts,
                    aggregateCounts.success,
                    aggregateCounts.pending,
                    aggregateCounts.error + aggregateCounts.warning
                  )}
                </span>
              </MessageBarBody>
            </MessageBar>
          </PopoverTrigger>
          <PopoverSurface className={styles.popoverSurface}>
            <ArchiveStatusDetails
              operations={processedOperations}
              totalEntries={totalEntries}
              successCount={aggregateCounts.success}
              pendingCount={aggregateCounts.pending}
              errorCount={aggregateCounts.error}
              warningCount={aggregateCounts.warning}
              onRefresh={refresh}
            />
          </PopoverSurface>
        </Popover>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
