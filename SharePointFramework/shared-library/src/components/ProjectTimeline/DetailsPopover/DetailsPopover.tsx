import { Link, Popover, PopoverSurface } from '@fluentui/react-components'
import * as strings from 'SharedLibraryStrings'
import React, { FC } from 'react'
import { formatDate, tryParseCurrency } from '../../../util'
import styles from './DetailsPopover.module.scss'
import { IDetailsPopoverProps } from './types'

export const DetailsPopover: FC<IDetailsPopoverProps> = (props) => {
  const { data } = props.timelineItem.item
  const { item } = props.timelineItem

  const popoverContent = (): JSX.Element => {
    switch (data.type) {
      case strings.MilestoneLabel: {
        return (
          <>
            <p hidden={!data.type}>
              <b>{data.type}:</b> <span>{item.title}</span>
            </p>
            <p>
              <b>{strings.MilestoneDateLabel}:</b>{' '}
              <span>{formatDate(item.end_time.toString())}</span>
            </p>
          </>
        )
      }
      case strings.PhaseLabel:
      case strings.SubPhaseLabel: {
        return (
          <>
            <p hidden={!data.type}>
              <b>{data.type}:</b> <span>{item.title}</span>
            </p>
            <p>
              <b>{strings.StartDateLabel}:</b> <span>{formatDate(item.start_time.toString())}</span>
            </p>
            <p>
              <b>{strings.EndDateLabel}:</b> <span>{formatDate(item.end_time.toString())}</span>
            </p>
          </>
        )
      }
      case strings.ResourceLabel: {
        return (
          <>
            <p hidden={!data.projectUrl}>
              <b>{strings.ProjectLabel}:</b>{' '}
              <Link href={data.projectUrl} target='_blank' title={data.project}>
                {data.project}
              </Link>
            </p>
            <p hidden={!data.resource}>
              <b>{strings.ResourceLabel}:</b> <span>{data.resource}</span>
            </p>
            <p hidden={!data.role}>
              <b>{strings.RoleLabel}:</b> <span>{data.role}</span>
            </p>
            <p hidden={!data.allocation}>
              <b>{strings.AllocationPercetageLabel}:</b> <span>{data.allocation}%</span>
            </p>
            <p hidden={!data.status}>
              <b>{strings.AllocationStatusLabel}:</b> <span>{data.status}</span>
            </p>
            <p hidden={!data.comment}>
              <b>{strings.CommentLabel}:</b> <span>{data.comment}</span>
            </p>
            <p>
              <b>{strings.StartDateLabel}:</b> <span>{formatDate(item.start_time.toString())}</span>
            </p>
            <p>
              <b>{strings.EndDateLabel}:</b> <span>{formatDate(item.end_time.toString())}</span>
            </p>
          </>
        )
      }
      case strings.ProjectLabel: {
        return (
          <>
            <p hidden={!data.projectUrl}>
              <b>{strings.ProjectLabel}:</b>{' '}
              <Link href={data.projectUrl} target='_blank' title={data.project}>
                {data.project}
              </Link>
            </p>
            <p hidden={!data.budgetTotal || !data.costsTotal}>
              <Link
                href={`${data.projectUrl}/SitePages/Prosjektstatus.aspx`}
                target='_blank'
                title={strings.LastPublishedStatusreport}
              >
                {strings.LastPublishedStatusreport}
              </Link>
            </p>
            <p hidden={!data.phase}>
              <b>{strings.CurrentPhaseLabel}:</b> <span>{data.phase}</span>
            </p>
            <p>
              <b>{strings.StartDateLabel}:</b> <span>{formatDate(item.start_time.toString())}</span>
            </p>
            <p>
              <b>{strings.EndDateLabel}:</b> <span>{formatDate(item.end_time.toString())}</span>
            </p>
          </>
        )
      }
      default: {
        return (
          <>
            <p>
              <b>{strings.NameLabel}:</b> <span>{item.title}</span>
            </p>
            <p hidden={data.elementType !== strings.TriangleLabel}>
              <b>{strings.ColumnRenderOptionDate}:</b>{' '}
              <span>{formatDate(item.end_time.toString())}</span>
            </p>
            <p hidden={data.elementType === strings.TriangleLabel}>
              <b>{strings.StartDateLabel}:</b> <span>{formatDate(item.start_time.toString())}</span>
            </p>
            <p hidden={data.elementType === strings.TriangleLabel}>
              <b>{strings.EndDateLabel}:</b> <span>{formatDate(item.end_time.toString())}</span>
            </p>
          </>
        )
      }
    }
  }

  return (
    <Popover
      withArrow
      open={props.open}
      onOpenChange={(_, data) => {
        if (!data.open) {
          props.onDismiss()
        }
      }}
      trapFocus
      closeOnScroll
      positioning={{
        target: props.timelineItem?.element,
        overflowBoundary: document.getElementsByClassName('rct-scroll')[0] as HTMLElement
      }}
    >
      <PopoverSurface className={styles.detailsPopover}>
        <div className={styles.calloutHeader}>
          <div
            hidden={!data.tag}
            title={strings.TagFieldLabel}
            className={styles.tag}
            style={{
              backgroundColor: data.bgColorHex
            }}
          >
            {data.tag}
          </div>
        </div>
        {popoverContent()}
        <p hidden={!data.budgetTotal}>
          <b>{strings.BudgetTotalLabel}:</b> <span>{tryParseCurrency(data.budgetTotal)}</span>
        </p>
        <p hidden={!data.costsTotal}>
          <b>{strings.CostsTotalLabel}:</b> <span>{tryParseCurrency(data.costsTotal)}</span>
        </p>
        <p hidden={!data.description}>
          <b>{strings.DescriptionFieldLabel}:</b> <span>{data.description}</span>
        </p>
        <p hidden={!data.type}>
          <b>{strings.TypeLabel}:</b> <span>{data.type}</span>
        </p>
      </PopoverSurface>
    </Popover>
  )
}

DetailsPopover.displayName = 'DetailsPopover'
DetailsPopover.defaultProps = {
  open: true
}
