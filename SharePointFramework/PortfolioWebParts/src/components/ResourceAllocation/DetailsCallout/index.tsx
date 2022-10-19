import { ITimelineItem } from 'interfaces/ITimelineItem'
import { Callout } from '@fluentui/react/lib/Callout'
import * as strings from 'PortfolioWebPartsStrings'
import { formatDate } from 'pp365-shared/lib/helpers/formatDate'
import React from 'react'
import styles from './DetailsCallout.module.scss'

export interface IDetailsCalloutProps {
  item: { data: ITimelineItem; element: HTMLElement }
  onDismiss: () => void
}

export const DetailsCallout = ({ item, onDismiss }: IDetailsCalloutProps) => {
  return (
    <Callout
      className={styles.detailsCallout}
      gapSpace={10}
      target={item.element}
      onDismiss={onDismiss}
      setInitialFocus={true}>
      <p>
        <b>{strings.ProjectLabel}:</b>{' '}
        <a href={item.data.projectUrl}>
          <span>{item.data.project}</span>
        </a>
      </p>
      <p hidden={!item.data.resource}>
        <b>{strings.ResourceLabel}:</b> <span>{item.data.resource}</span>
      </p>
      <p hidden={!item.data.role}>
        <b>{strings.RoleLabel}:</b> <span>{item.data.role}</span>
      </p>
      <p>
        <b>{strings.AllocationPercetageLabel}:</b> <span>{item.data.allocation}%</span>
      </p>
      <p>
        <b>{strings.StartDateLabel}:</b>{' '}
        <span>{formatDate(item.data.props.GtStartDateOWSDATE)}</span>
      </p>
      <p>
        <b>{strings.EndDateLabel}:</b> <span>{formatDate(item.data.props.GtEndDateOWSDATE)}</span>
      </p>
      <p hidden={!item.data.props.GtAllocationStatusOWSCHCS}>
        <b>{strings.AllocationStatusLabel}:</b>{' '}
        <span>{item.data.props.GtAllocationStatusOWSCHCS}</span>
      </p>
      <p hidden={!item.data.props.GtAllocationCommentOWSMTXT}>
        <b>{strings.CommentLabel}:</b> <span>{item.data.props.GtAllocationCommentOWSMTXT}</span>
      </p>
    </Callout>
  )
}
