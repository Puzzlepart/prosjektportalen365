import { Callout } from '@fluentui/react/lib/Callout'
import * as strings from 'PortfolioWebPartsStrings'
import { formatDate } from 'pp365-shared-library/lib/helpers/formatDate'
import React, { FC } from 'react'
import styles from './DetailsCallout.module.scss'
import { IDetailsCalloutProps } from './types'

export const DetailsCallout: FC<IDetailsCalloutProps> = (props) => {
  const { item } = props.viewItem
  return (
    <Callout
      className={styles.detailsCallout}
      gapSpace={10}
      target={props.viewItem.element}
      onDismiss={props.onDismiss}
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
        <b>{strings.StartDateLabel}:</b> <span>{formatDate(item.props.GtStartDateOWSDATE)}</span>
      </p>
      <p>
        <b>{strings.EndDateLabel}:</b> <span>{formatDate(item.props.GtEndDateOWSDATE)}</span>
      </p>
      <p hidden={!item.props.GtAllocationStatusOWSCHCS}>
        <b>{strings.AllocationStatusLabel}:</b> <span>{item.props.GtAllocationStatusOWSCHCS}</span>
      </p>
      <p hidden={!item.props.GtAllocationCommentOWSMTXT}>
        <b>{strings.CommentLabel}:</b> <span>{item.props.GtAllocationCommentOWSMTXT}</span>
      </p>
    </Callout>
  )
}
