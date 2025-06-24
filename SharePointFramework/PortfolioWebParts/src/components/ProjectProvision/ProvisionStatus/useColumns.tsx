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
  ErrorCircleRegular,
  PeopleTeamRegular,
  ArrowClockwiseDashesRegular,
  ApprovalsAppRegular,
  HourglassHalfRegular
} from '@fluentui/react-icons'
import styles from './ProvisionStatus.module.scss'
import { ProjectProvisionContext } from '../context'
import { formatDate, getFluentIcon } from 'pp365-shared-library'
import { IRequestItem, Status } from './types'
import strings from 'PortfolioWebPartsStrings'
import { format } from '@fluentui/react'

export const useColumns = (toast: any): TableColumnDefinition<IRequestItem>[] => {
  const context = useContext(ProjectProvisionContext)
  return [
    createTableColumn<IRequestItem>({
      columnId: 'displayName',
      compare: (a, b) => {
        if (a.displayName) {
          return a.displayName.localeCompare(b.displayName)
        }
        return null
      },
      renderHeaderCell: () => {
        return strings.Provision.SiteNameFieldLabel
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
        return strings.Provision.SiteTypeFieldLabel
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
        return strings.Provision.StatusLabel
      },
      renderCell: (request) => {
        let statusIcon, statusColor, statusText

        switch (request.status) {
          case Status.Submitted:
            statusIcon = getFluentIcon('SparkleCircle')
            statusColor = tokens.colorStatusWarningBackground2
            statusText = strings.Provision.SubmittedLabel
            break
          case Status.Approved:
            statusIcon = getFluentIcon('ApprovalsApp')
            statusColor = tokens.colorStatusSuccessBackground2
            statusText = strings.Provision.ApprovedLabel
            break
          case Status.Rejected:
            statusIcon = getFluentIcon('ErrorCircle')
            statusColor = tokens.colorStatusDangerBackground2
            statusText = strings.Provision.RejectedLabel
            break
          case Status.PendingApproval:
            statusIcon = getFluentIcon('ArrowClockwiseDashes')
            statusColor = tokens.colorStatusWarningBackground2
            statusText = strings.Provision.PendingApprovalLabel
            break
          case Status.SpaceCreationFailed:
            statusIcon = getFluentIcon('ErrorCircle')
            statusColor = tokens.colorStatusDangerBackground2
            statusText = strings.Provision.SpaceCreationFailedLabel
            break
          case Status.SpaceAlreadyExists:
            statusIcon = getFluentIcon('ErrorCircle')
            statusColor = tokens.colorStatusDangerBackground2
            statusText = strings.Provision.SpaceAlreadyExistsLabel
            break
          case Status.TeamRequested:
            statusIcon = getFluentIcon('PeopleTeam')
            statusColor = tokens.colorStatusWarningBackground2
            statusText = strings.Provision.TeamRequestedLabel
            break
          case Status.SpaceCreation:
            statusIcon = getFluentIcon('HourglassHalf')
            statusColor = tokens.colorStatusWarningBackground2
            statusText = strings.Provision.SpaceCreationLabel
            break
          case Status.SpaceCreated:
            statusIcon = getFluentIcon('CheckmarkCircle')
            statusColor = tokens.colorStatusSuccessBackground2
            statusText = strings.Provision.SpaceCreatedLabel
            break
          default:
            statusIcon = getFluentIcon('LightbulbCircle')
            statusColor = tokens.colorNeutralBackground6
            statusText = strings.Provision.NotSubmittedLabel
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
        return strings.Provision.SubmittedDateLabel
      },
      renderCell: (request) => {
        return formatDate(request.created)
      }
    }),
    createTableColumn<IRequestItem>({
      columnId: 'actions',
      renderHeaderCell: () => null,
      renderCell: (request) => {
        const canDelete =
          request.status === Status.NotSubmitted ||
          request.status === Status.SpaceCreationFailed ||
          request.status === Status.SpaceAlreadyExists

        return (
          <div className={styles.actions}>
            {canDelete && (
              <Popover>
                <PopoverTrigger disableButtonEnhancement>
                  <Button
                    appearance='subtle'
                    title={strings.Provision.DeleteSubmissionLabel}
                    icon={getFluentIcon('Delete')}
                  />
                </PopoverTrigger>
                <PopoverSurface tabIndex={-1}>
                  <div className={styles.deletePopover}>
                    <div>{strings.Provision.DeleteSubmissionConfirmationLabel}</div>
                    <div>
                      <Button
                        appearance='subtle'
                        onClick={() => {
                          context.props.dataAdapter
                            .deleteProvisionRequest(request.id, context.props.provisionUrl)
                            .then((response) => {
                              if (response) {
                                context.setState({
                                  isRefetching: true,
                                  refetch: new Date().getTime()
                                })
                                toast(
                                  <Toast appearance='inverted'>
                                    <ToastTitle>
                                      {strings.Provision.DeletedSubmissionToastTitle}
                                    </ToastTitle>
                                    <ToastBody>
                                      {format(
                                        strings.Provision.DeletedSubmissionToastBody,
                                        request.displayName
                                      )}
                                    </ToastBody>
                                  </Toast>,
                                  { intent: 'success' }
                                )
                                context.setState({ showProvisionDrawer: false, properties: {} })
                              } else {
                                toast(
                                  <Toast appearance='inverted'>
                                    <ToastTitle>
                                      {strings.Provision.DeletedSubmissionErrorToastTitle}
                                    </ToastTitle>
                                    <ToastBody>
                                      {strings.Provision.DeletedSubmissionErrorToastBody}
                                    </ToastBody>
                                  </Toast>,
                                  { intent: 'error' }
                                )
                              }
                            })
                        }}
                        title={strings.Provision.DeleteSubmissionLabel}
                        icon={getFluentIcon('Delete')}
                      >
                        {strings.Provision.DeleteLabel}
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
