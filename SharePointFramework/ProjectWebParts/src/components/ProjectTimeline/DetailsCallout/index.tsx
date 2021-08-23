import { ITimelineItem } from '../types'
import { Callout } from 'office-ui-fabric-react/lib/Callout'
import * as strings from 'ProjectWebPartsStrings'
import { formatDate, tryParseCurrency } from 'pp365-shared/lib/helpers'
import styles from './DetailsCallout.module.scss'
import React from 'react'

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
      <p hidden={item.data.type === strings.ProjectLabel}>
        <b>{item.data.type === strings.MilestoneLabel
          ? strings.MilestoneLabel
          : item.data.type === strings.PhaseLabel
            ? strings.PhaseLabel
            : strings.SubPhaseLabel}:</b>{' '}
        <span>{item.data.title}</span>
      </p>
      <p hidden={!item.data.projectUrl}>
        <b>{strings.ProjectLabel}:</b>{' '}
        <a href={item.data.projectUrl}>
          <span>{item.data.project}</span>
        </a>
      </p>
      <p hidden={!item.data.phase}>
        <b>{strings.CurrentPhaseLabel}:</b> <span>{item.data.phase}</span>
      </p>
      <p hidden={item.data.type !== strings.MilestoneLabel}>
        <b>{strings.MilestoneDateLabel}:</b> <span>{formatDate(item.data.end_time.toString())}</span>
      </p>
      <p hidden={item.data.type === strings.MilestoneLabel}>
        <b>{strings.StartDateLabel}:</b> <span>{formatDate(item.data.start_time.toString())}</span>
      </p>
      <p hidden={item.data.type === strings.MilestoneLabel}>
        <b>{strings.EndDateLabel}:</b> <span>{formatDate(item.data.end_time.toString())}</span>
      </p>
      <p hidden={!item.data.budgetTotal}>
        <b>{strings.BudgetTotalLabel}:</b> <span>{tryParseCurrency(item.data.budgetTotal, '').toString().replace(/(?!^)(?=(?:\d{3})+(?:\.|$))/gm, ' ')}</span>
      </p>
      <p hidden={!item.data.costsTotal}>
        <b>{strings.CostsTotalLabel}:</b> <span>{tryParseCurrency(item.data.costsTotal, '').toString().replace(/(?!^)(?=(?:\d{3})+(?:\.|$))/gm, ' ')}</span>
      </p>
      <p hidden={(!item.data.budgetTotal || !item.data.costsTotal) || item.data.type !== strings.ProjectLabel}>
        <a target='_blank' rel='noreferrer' href={`${item.data.projectUrl}/SitePages/Prosjektstatus.aspx`}>
          <span>{strings.LastPublishedStatusreport}</span>
        </a>
      </p>
      <p hidden={!item.data.type || item.data.type === strings.ProjectLabel}>
        <b>{strings.TypeLabel}:</b> <span>{item.data.type}</span>
      </p>
    </Callout>
  )
}
