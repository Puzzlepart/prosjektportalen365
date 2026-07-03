import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Tag,
  Text,
  Tooltip
} from '@fluentui/react-components'
import {
  ArrowClockwise16Regular,
  DocumentMultiple16Regular,
  ListBar16Regular,
  CheckmarkCircle16Filled,
  HourglassHalf16Regular,
  DismissCircle16Filled,
  Warning16Filled
} from '@fluentui/react-icons'
import * as strings from 'ProjectWebPartsStrings'
import { formatDate } from 'pp365-shared-library'
import React, { FC } from 'react'
import { IArchiveOperation } from '../../../../data/SPDataAdapter/types'
import { primaryStatusOf, useArchiveStatusDetails } from './useArchiveStatusDetails'
import styles from './ArchiveStatusDetails.module.scss'

/**
 * Props for {@link ArchiveStatusDetails} — the operations and the aggregate
 * per-status counts to render.
 */
export interface IArchiveStatusDetailsProps {
  operations: IArchiveOperation[]
  totalEntries: number
  successCount: number
  pendingCount: number
  errorCount: number
  warningCount: number
  onRefresh?: () => void
}

const StatusTag: FC<{ status: string }> = ({ status }) => {
  if (status === strings.ArchiveLogStatusSuccess) {
    return (
      <Tag
        appearance='outline'
        size='small'
        icon={<CheckmarkCircle16Filled />}
        className={`${styles.statusTag} ${styles.success}`}
      >
        {status}
      </Tag>
    )
  }
  if (status === strings.ArchiveLogStatusInProgress) {
    return (
      <Tag
        appearance='outline'
        size='small'
        icon={<HourglassHalf16Regular />}
        className={`${styles.statusTag} ${styles.pending}`}
      >
        {status}
      </Tag>
    )
  }
  if (status === strings.ArchiveLogStatusWarning) {
    return (
      <Tag
        appearance='outline'
        size='small'
        icon={<Warning16Filled />}
        className={`${styles.statusTag} ${styles.warning}`}
      >
        {status}
      </Tag>
    )
  }
  if (status === strings.ArchiveLogStatusError) {
    return (
      <Tag
        appearance='outline'
        size='small'
        icon={<DismissCircle16Filled />}
        className={`${styles.statusTag} ${styles.error}`}
      >
        {status}
      </Tag>
    )
  }
  return (
    <Tag appearance='outline' size='small'>
      {status}
    </Tag>
  )
}

/** Single stacked bar showing the success/pending/warning/error split of all entries. */
const SegmentedProgressBar: FC<{
  success: number
  pending: number
  error: number
  warning: number
}> = ({ success, pending, error, warning }) => {
  const total = success + pending + error + warning
  if (total === 0) return null
  const pct = (n: number) => `${(n / total) * 100}%`
  return (
    <div
      className={styles.progressTrack}
      role='progressbar'
      aria-valuenow={success}
      aria-valuemax={total}
    >
      {success > 0 && <div className={styles.progressSuccess} style={{ width: pct(success) }} />}
      {pending > 0 && <div className={styles.progressPending} style={{ width: pct(pending) }} />}
      {warning > 0 && <div className={styles.progressWarning} style={{ width: pct(warning) }} />}
      {error > 0 && <div className={styles.progressError} style={{ width: pct(error) }} />}
    </div>
  )
}

/**
 * Expanded archive history for a project: a summary strip with a segmented
 * progress bar, status filter chips, and a sortable table of archive operations.
 */
export const ArchiveStatusDetails: FC<IArchiveStatusDetailsProps> = ({
  operations,
  totalEntries,
  successCount,
  pendingCount,
  errorCount,
  warningCount,
  onRefresh
}) => {
  const { filter, setFilter, sortedRows, headerSortProps } = useArchiveStatusDetails(operations)

  return (
    <div className={styles.root}>
      {onRefresh && (
        <Tooltip content={strings.ArchiveRefreshTooltip} relationship='label' withArrow>
          <Button
            appearance='subtle'
            size='small'
            className={styles.refreshButton}
            icon={<ArrowClockwise16Regular />}
            onClick={onRefresh}
            aria-label={strings.ArchiveRefreshLabel}
          />
        </Tooltip>
      )}
      <div className={styles.summary}>
        <Text className={styles.number}>{totalEntries}</Text>
        <div className={styles.divider} />
        <div className={styles.body}>
          <Text className={styles.label}>{strings.ArchiveStatusSummaryLabel}</Text>
          <div className={styles.breakdown}>
            <span className={`${styles.breakdownItem} ${styles.success}`}>
              <CheckmarkCircle16Filled />
              <span>{successCount}</span>
            </span>
            <span className={styles.dot}>·</span>
            <span className={`${styles.breakdownItem} ${styles.pending}`}>
              <HourglassHalf16Regular />
              <span>{pendingCount}</span>
            </span>
            <span className={styles.dot}>·</span>
            <span className={`${styles.breakdownItem} ${styles.error}`}>
              <DismissCircle16Filled />
              <span>{errorCount + warningCount}</span>
            </span>
          </div>
          <SegmentedProgressBar
            success={successCount}
            pending={pendingCount}
            error={errorCount}
            warning={warningCount}
          />
          <Text className={styles.help}>{strings.ArchiveStatusSummaryHelp}</Text>
        </div>
      </div>

      <div className={styles.filterRow}>
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
          {strings.ArchiveStatusFilterAll}
        </FilterChip>
        <FilterChip
          active={filter === 'success'}
          onClick={() => setFilter('success')}
          count={successCount}
        >
          {strings.ArchiveLogStatusSuccess}
        </FilterChip>
        <FilterChip
          active={filter === 'pending'}
          onClick={() => setFilter('pending')}
          count={pendingCount}
        >
          {strings.ArchiveLogStatusInProgress}
        </FilterChip>
        <FilterChip
          active={filter === 'failed'}
          onClick={() => setFilter('failed')}
          count={errorCount + warningCount}
        >
          {strings.ArchiveLogStatusError}
        </FilterChip>
      </div>

      <div className={styles.tableScroll}>
        {sortedRows.length === 0 ? (
          <div className={styles.emptyState}>{strings.ArchiveStatusEmpty}</div>
        ) : (
          <Table size='small' sortable aria-label={strings.ArchiveStatusHeaderText}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell {...headerSortProps('time')}>
                  {strings.ArchiveStatusColumnTime}
                </TableHeaderCell>
                <TableHeaderCell {...headerSortProps('operation')}>
                  {strings.ArchiveStatusColumnOperation}
                </TableHeaderCell>
                <TableHeaderCell {...headerSortProps('status')}>
                  {strings.ArchiveStatusColumnStatus}
                </TableHeaderCell>
                <TableHeaderCell {...headerSortProps('documents')} className={styles.numericCell}>
                  <DocumentMultiple16Regular style={{ verticalAlign: 'middle' }} />
                </TableHeaderCell>
                <TableHeaderCell {...headerSortProps('lists')} className={styles.numericCell}>
                  <ListBar16Regular style={{ verticalAlign: 'middle' }} />
                </TableHeaderCell>
                <TableHeaderCell>{strings.ArchiveStatusColumnMessage}</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.map(({ item }, idx) => (
                <TableRow key={idx}>
                  <TableCell title={formatDate(item.date, true)}>{formatDate(item.date)}</TableCell>
                  <TableCell>{item.operation}</TableCell>
                  <TableCell className={styles.statusCell}>
                    <StatusTag status={primaryStatusOf(item)} />
                  </TableCell>
                  <TableCell className={styles.numericCell}>{item.documentCount || ''}</TableCell>
                  <TableCell className={styles.numericCell}>{item.listCount || ''}</TableCell>
                  <TableCell className={styles.messageCell}>{item.message || ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

const FilterChip: FC<{
  active: boolean
  count?: number
  onClick: () => void
  children: string
}> = ({ active, count, onClick, children }) => (
  <Tooltip content={children} relationship='label' withArrow>
    <Button appearance={active ? 'primary' : 'outline'} size='small' onClick={onClick}>
      {children}
      {typeof count === 'number' && <span style={{ marginLeft: 6, opacity: 0.75 }}>({count})</span>}
    </Button>
  </Tooltip>
)
