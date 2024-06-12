import {
  Button,
  Link,
  TableCellLayout,
  TableColumnDefinition,
  Tag,
  createTableColumn,
  tokens,
  Text
} from '@fluentui/react-components'
import React, { useContext } from 'react'
import {
  SparkleCircleRegular,
  LightbulbCircleRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  DeleteRegular
} from '@fluentui/react-icons'
import styles from './ProvisionStatus.module.scss'
import { ProjectProvisionContext } from '../context'
import { formatDate } from 'pp365-shared-library'

type RequestItem = {
  title: string
  siteUrl: string
  created: Date
  status: string
  type: string
}

export const useColumns = (): TableColumnDefinition<RequestItem>[] => {
  const context = useContext(ProjectProvisionContext)

  return [
    createTableColumn<RequestItem>({
      columnId: 'title',
      compare: (a, b) => {
        return a.title.localeCompare(b.title)
      },
      renderHeaderCell: () => {
        return 'Bestilling'
      },
      renderCell: (request) => {
        return (
          <TableCellLayout style={{ overflow: 'hidden' }}>
            {request.status === 'Space Created' ? (
              <Link
                href={request.siteUrl}
                onClick={() => {
                  context.setState({ showProvisionStatus: false })
                }}
              >
                <Text truncate wrap={true}>
                  {request.title}
                </Text>
              </Link>
            ) : (
              <Text truncate wrap={true}>
                {request.title}
              </Text>
            )}
          </TableCellLayout>
        )
      }
    }),
    createTableColumn<RequestItem>({
      columnId: 'type',
      compare: (a, b) => {
        return a.type.localeCompare(b.type)
      },
      renderHeaderCell: () => {
        return 'Type'
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
    createTableColumn<RequestItem>({
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
          case 'Submitted':
            statusIcon = <SparkleCircleRegular />
            statusColor = tokens.colorStatusWarningBackground2
            statusText = 'Sendt inn'
            break
          case 'Approved':
            statusIcon = <CheckmarkCircleRegular />
            statusColor = tokens.colorStatusSuccessBackground2
            statusText = 'Godkjent'
            break
          case 'Rejected':
            statusIcon = <ErrorCircleRegular />
            statusColor = tokens.colorStatusDangerBackground2
            statusText = 'Avslått'
            break
          case 'Pending Approval':
            statusIcon = <SparkleCircleRegular />
            statusColor = tokens.colorStatusWarningBackground2
            statusText = 'Venter på godkjenning'
            break
          case 'Space Creation Failed':
            statusIcon = <ErrorCircleRegular />
            statusColor = tokens.colorStatusDangerBackground2
            statusText = 'Område opprettelse feilet'
            break
          case 'Space Already Exists':
            statusIcon = <ErrorCircleRegular />
            statusColor = tokens.colorStatusDangerBackground2
            statusText = 'Området eksisterer allerede'
            break
          case 'Team Requested':
            statusIcon = <SparkleCircleRegular />
            statusColor = tokens.colorStatusWarningBackground2
            statusText = 'Team forespurt'
            break
          case 'Space Creation':
            statusIcon = <SparkleCircleRegular />
            statusColor = tokens.colorStatusWarningBackground2
            statusText = 'Område opprettes'
            break
          case 'Space Created':
            statusIcon = <CheckmarkCircleRegular />
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
    createTableColumn<RequestItem>({
      columnId: 'created',
      compare: (a, b) => {
        return new Date(a.created).getTime() - new Date(b.created).getTime()
      },
      renderHeaderCell: () => {
        return 'Dato'
      },
      renderCell: (request) => {
        return formatDate(request.created)
      }
    }),
    createTableColumn<RequestItem>({
      columnId: 'actions',
      renderHeaderCell: () => null,
      renderCell: (request) => {
        return (
          <div className={styles.actions}>
            {/* <Button title='Rediger' icon={<EditRegular />} /> */}
            {request.status === 'Not Submitted' && <Button title='Fjern' icon={<DeleteRegular />} />}
          </div>
        )
      }
    })
  ]
}
