import { format } from '@fluentui/react'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { isEmpty, groupBy } from 'underscore'
import styles from './ArchiveStatusPopover.module.scss'
import { IArchiveStatusPopoverProps } from './types'
import {
  FluentProvider,
  IdPrefixProvider,
  useId,
  Tag,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel
} from '@fluentui/react-components'
import { Archive24Regular } from '@fluentui/react-icons'
import { customLightTheme, formatDate } from 'pp365-shared-library'

export const ArchiveStatusPopover: FC<IArchiveStatusPopoverProps> = (props) => {
  const fluentProviderId = useId('fp-archive-status-popover')
  if (!props.archiveInfo || isEmpty(props.operations)) return null

  const { operations = [] } = props

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <div className={styles.root}>
          <Accordion collapsible defaultOpenItems={operations.length > 0 ? ['0'] : []}>
            {operations.map((operation, operationIndex) => {
              const scopesByStatus = groupBy(operation.scopeItems || [], (item) => item.status)

              return (
                <AccordionItem key={operationIndex} value={operationIndex.toString()}>
                  <AccordionHeader className={styles.accordionHeader}>
                    <div className={styles.header}>
                      <Archive24Regular className={styles.icon} />
                      <span className={styles.title}>
                        {operation.operation} - {formatDate(operation.date, true)} (
                        {operation.totalItems})
                      </span>
                    </div>
                  </AccordionHeader>
                  <AccordionPanel>
                    <div className={styles.content}>
                      {operation.message && (
                        <div className={styles.message}>{operation.message}</div>
                      )}

                      {Object.keys(scopesByStatus).map((statusKey) => (
                        <div key={statusKey} className={styles.statusGroup}>
                          <h4 className={styles.statusTitle}>{statusKey}</h4>
                          <div className={styles.scopeListContainer}>
                            <ul className={styles.scopeList}>
                              {scopesByStatus[statusKey].map((scopeItem, index) => (
                                <li key={`${statusKey}-${index}`}>
                                  <Tag media={scopeItem.icon} style={{ color: scopeItem.color }}>
                                    {scopeItem.scope} ({scopeItem.count})
                                  </Tag>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}

                      {(operation.documentCount > 0 || operation.listCount > 0) && (
                        <div className={styles.footer}>
                          {strings.ArchiveStatusTotalCount}
                          {operation.documentCount > 0 && (
                            <span>
                              {format(strings.ArchiveStatusDocumentCount, operation.documentCount)}
                            </span>
                          )}
                          {operation.documentCount > 0 && operation.listCount > 0 && (
                            <span>, </span>
                          )}
                          {operation.listCount > 0 && (
                            <span>
                              {format(strings.ArchiveStatusListCount, operation.listCount)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </AccordionPanel>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>
      </FluentProvider>
    </IdPrefixProvider>
  )
}

export * from './types'
