/* eslint-disable no-console */
import {
  Button,
  Link,
  TableCellLayout,
  TableColumnDefinition,
  Tag,
  createTableColumn,
  tokens,
  Text,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Toast,
  ToastTitle,
  ToastBody
} from '@fluentui/react-components'
import React, { useContext } from 'react'
import {
  SparkleCircleRegular,
  LightbulbCircleRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular
} from '@fluentui/react-icons'
import styles from './ProvisionStatus.module.scss'
import { ProjectProvisionContext } from '../context'
import { formatDate, getFluentIcon } from 'pp365-shared-library'
import { IRequestItem, Status } from './types'

export const useColumns = (toast: any): TableColumnDefinition<IRequestItem>[] => {
  const context = useContext(ProjectProvisionContext)
  return [
    createTableColumn<IRequestItem>({
      columnId: 'displayName',
      compare: (a, b) => {
        return a.displayName.localeCompare(b.displayName)
      },
      renderHeaderCell: () => {
        return 'Områdetittel'
      },
      renderCell: (request) => {
        return (
          <TableCellLayout style={{ overflow: 'hidden' }}>
            {request.status === Status.SpaceCreated ? (
              <Link
                href={request.siteUrl}
                onClick={() => {
                  context.setState({ showProvisionStatus: false })
                }}
              >
                <Text truncate wrap={true}>
                  {request.displayName}
                </Text>
              </Link>
            ) : (
              <Text truncate wrap={true}>
                {request.displayName}
              </Text>
            )}
          </TableCellLayout>
        )
      }
    }),
    createTableColumn<IRequestItem>({
      columnId: 'type',
      compare: (a, b) => {
        return a.type.localeCompare(b.type)
      },
      renderHeaderCell: () => {
        return 'Områdetype'
      },
      renderCell: (request) => {
        return (
          <TableCellLayout style={{ overflow: 'hidden' }}>
            <Text truncate wrap={true}>
              {request.type}
            </Text>
          </TableCellLayout>
        )
      }
    }),
    createTableColumn<IRequestItem>({
      columnId: 'status',
      compare: (a, b) => {
        return a.status.localeCompare(b.status)
      },
      renderHeaderCell: () => {
        return 'Status'
      },
      renderCell: (request) => {
        let statusIcon, statusColor, statusText

        switch (request.status) {
          case Status.Submitted:
            statusIcon = <SparkleCircleRegular />
            statusColor = tokens.colorStatusWarningBackground2
            statusText = 'Sendt inn'
            break
          case Status.Approved:
            statusIcon = <CheckmarkCircleRegular />
            statusColor = tokens.colorStatusSuccessBackground2
            statusText = 'Godkjent'
            break
          case Status.Rejected:
            statusIcon = <ErrorCircleRegular />
            statusColor = tokens.colorStatusDangerBackground2
            statusText = 'Avslått'
            break
          case Status.PendingApproval:
            statusIcon = <SparkleCircleRegular />
            statusColor = tokens.colorStatusWarningBackground2
            statusText = 'Venter på godkjenning'
            break
          case Status.SpaceCreationFailed:
            statusIcon = <ErrorCircleRegular />
            statusColor = tokens.colorStatusDangerBackground2
            statusText = 'Område opprettelse feilet'
            break
          case Status.SpaceAlreadyExists:
            statusIcon = <ErrorCircleRegular />
            statusColor = tokens.colorStatusDangerBackground2
            statusText = 'Området eksisterer allerede'
            break
          case Status.TeamRequested:
            statusIcon = <SparkleCircleRegular />
            statusColor = tokens.colorStatusWarningBackground2
            statusText = 'Team forespurt'
            break
          case Status.SpaceCreation:
            statusIcon = <SparkleCircleRegular />
            statusColor = tokens.colorStatusWarningBackground2
            statusText = 'Område opprettes'
            break
          case Status.SpaceCreated:
            statusIcon = getFluentIcon('CheckmarkCircle')
            statusColor = tokens.colorStatusSuccessBackground2
            statusText = 'Område opprettet'
            break
          default:
            statusIcon = <LightbulbCircleRegular />
            statusColor = tokens.colorNeutralBackground6
            statusText = 'Ikke sendt'
            break
        }

        return (
          <TableCellLayout>
            <Tag
              icon={statusIcon}
              style={{
                backgroundColor: statusColor
              }}
            >
              {statusText}
            </Tag>
          </TableCellLayout>
        )
      }
    }),
    createTableColumn<IRequestItem>({
      columnId: 'created',
      compare: (a, b) => {
        return new Date(a.created).getTime() - new Date(b.created).getTime()
      },
      renderHeaderCell: () => {
        return 'Bestillingsdato'
      },
      renderCell: (request) => {
        return formatDate(request.created)
      }
    }),
    createTableColumn<IRequestItem>({
      columnId: 'actions',
      renderHeaderCell: () => null,
      renderCell: (request) => {
        const canEdit = request.status === Status.NotSubmitted
        const canDelete =
          request.status === Status.NotSubmitted ||
          request.status === Status.SpaceCreationFailed ||
          request.status === Status.SpaceAlreadyExists

        return (
          <div className={styles.actions}>
            {canEdit && (
              <Button
                appearance='subtle'
                onClick={() => console.log(`edit request ${request.id}`)}
                title='Rediger'
                icon={getFluentIcon('Edit')}
              />
            )}
            {canDelete && (
              <Popover>
                <PopoverTrigger disableButtonEnhancement>
                  <Button
                    appearance='subtle'
                    title='Slett bestilling'
                    icon={getFluentIcon('Delete')}
                  />
                </PopoverTrigger>
                <PopoverSurface tabIndex={-1}>
                  <div className={styles.deletePopover}>
                    <div>Er du sikker på at du ønsker å slette bestillingen?</div>
                    <div>
                      <Button
                        appearance='subtle'
                        onClick={() => {
                          context.props.dataAdapter
                            .deleteProvisionRequest(request.id, context.props.provisionUrl)
                            .then((response) => {
                              if (response) {
                                context.setState({
                                  refetch: new Date().getTime()
                                })
                                toast(
                                  <Toast appearance='inverted'>
                                    <ToastTitle>Slettet bestilling</ToastTitle>
                                    <ToastBody>
                                      {`Bestillingen '${request.displayName}', ble slettet.`}
                                    </ToastBody>
                                  </Toast>,
                                  { intent: 'success' }
                                )
                                context.setState({ showProvisionDrawer: false, properties: {} })
                              } else {
                                toast(
                                  <Toast appearance='inverted'>
                                    <ToastTitle>Feil ved sletting</ToastTitle>
                                    <ToastBody>
                                      Det oppstod en feil ved sletting av bestillingen. Vennligst
                                      prøv igjen, eller kontakt administrator.
                                    </ToastBody>
                                  </Toast>,
                                  { intent: 'error' }
                                )
                              }
                            })
                        }}
                        title='Slett bestilling'
                        icon={getFluentIcon('Delete')}
                      >
                        Slett
                      </Button>
                    </div>
                  </div>
                </PopoverSurface>
              </Popover>
            )}
          </div>
        )
      }
    })
  ]
}
