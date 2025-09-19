import { Link, Popover, PopoverSurface } from '@fluentui/react-components'
import * as strings from 'SharedLibraryStrings'
import React, { FC } from 'react'
import { formatDate, tryParseCurrency } from '../../../util'
import styles from './DetailsPopover.module.scss'
import { IDetailsPopoverProps } from './types'
import resource from 'SharedResources'

export const DetailsPopover: FC<IDetailsPopoverProps> = (props) => {
  const { data } = props.timelineItem.item
  const { item } = props.timelineItem

  const popoverContent = (): JSX.Element => {
    // Sjekk om dette er en fravær/linjeaktivitet (ikke prosjektallokering)
    const isAbsence = !!(data.type && data.project === '' && data.type !== strings.ResourceLabel);
    if (isAbsence) {
      return (
        <>
          <p>
            <b>
              <Link href={strings.ResourceAllocationListUrl} target="_blank">
                {strings.ResourceAllocationListLabel}
              </Link>
              :
            </b>{' '}
            <span>{data.type}</span>
          </p>
          <p hidden={!item.title}>
            <b>{strings.DescriptionFieldLabel}:</b> <span>{item.title}</span>
          </p>
          <p hidden={!data.type}>
            <b>{strings.TypeLabel}:</b> <span>{data.type}</span>
          </p>
          <p hidden={!data.comment}>
            <b>{strings.CommentLabel}:</b> <span>{data.comment}</span>
          </p>
          <p hidden={typeof data.allocation !== 'number'}>
            <b>{strings.AllocationPercetageLabel}:</b> <span>{data.allocation}%</span>
          </p>
          {/* Show any extra fields if present */}
          {data.status && (
            <p>
              <b>{strings.AllocationStatusLabel}:</b> <span>{data.status}</span>
            </p>
          )}
          {data.department && (
            <p>
              <b>{strings.DepartmentLabel}:</b> <span>{data.department}</span>
            </p>
          )}
          <p>
            <b>{strings.StartDateLabel}:</b> <span>{formatDate(item.start_time.toString())}</span>
          </p>
          <p>
            <b>{strings.EndDateLabel}:</b> <span>{formatDate(item.end_time.toString())}</span>
          </p>
        </>
      );
    }
    switch (data.type) {
      case resource.TimelineConfiguration_Milestone_Title: {
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
      case resource.TimelineConfiguration_Phase_Title:
      case resource.TimelineConfiguration_SubPhase_Title: {
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
              <b>{resource.TimelineConfiguration_Project_Title}:</b>{' '}
              <Link href={data.projectUrl} target='_blank' title={data.project}>
                {data.project}
              </Link>
            </p>
            <p hidden={!data.resource}>
              <b>{strings.ResourceLabel}:</b> <span>{data.resource}</span>
            </p>
            <p hidden={!data.department}>
              <b>{strings.DepartmentLabel}:</b> <span>{data.department}</span>
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
      case resource.TimelineConfiguration_Project_Title: {
        return (
          <>
            <p hidden={!data.projectUrl}>
              <b>{resource.TimelineConfiguration_Project_Title}:</b>{' '}
              <Link href={data.projectUrl} target='_blank' title={data.project}>
                {data.project}
              </Link>
            </p>
            <p hidden={!data.budgetTotal || !data.costsTotal}>
              <Link
                href={`${data.projectUrl}/${resource.Navigation_ProjectStatus_Url}`}
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
            <p hidden={data.elementType !== resource.TimelineConfiguration_Triangle_ElementType}>
              <b>{strings.ColumnRenderOptionDate}:</b>{' '}
              <span>{formatDate(item.end_time.toString())}</span>
            </p>
            <p hidden={data.elementType === resource.TimelineConfiguration_Triangle_ElementType}>
              <b>{strings.StartDateLabel}:</b> <span>{formatDate(item.start_time.toString())}</span>
            </p>
            <p hidden={data.elementType === resource.TimelineConfiguration_Triangle_ElementType}>
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
