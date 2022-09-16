import { ITimelineItem } from 'interfaces/ITimelineItem'
import { Callout } from 'office-ui-fabric-react/lib/Callout'
import * as strings from 'PortfolioWebPartsStrings'
import { formatDate, tryParseCurrency } from 'pp365-shared/lib/helpers'
import styles from './DetailsCallout.module.scss'
import React from 'react'

export interface IDetailsCalloutProps {
  timelineItem: { item: ITimelineItem; element: HTMLElement }
  onDismiss: () => void
}

export const DetailsCallout = ({ timelineItem, onDismiss }: IDetailsCalloutProps) => {
  const item = timelineItem.item.data

  const _calloutContent = (): JSX.Element => {
    switch (item.type) {
      case strings.MilestoneLabel: {
        return (
          <>
            <p hidden={!item.type}>
              <b>{item.type}:</b> <span>{timelineItem.item.title}</span>
            </p>
            <p>
              <b>{strings.MilestoneDateLabel}:</b>{' '}
              <span>{formatDate(timelineItem.item.end_time.toString())}</span>
            </p>
          </>
        )
      }
      case strings.PhaseLabel:
      case strings.SubPhaseLabel: {
        return (
          <>
            <p hidden={!item.type}>
              <b>{item.type}:</b> <span>{timelineItem.item.title}</span>
            </p>
            <p>
              <b>{strings.StartDateLabel}:</b>{' '}
              <span>{formatDate(timelineItem.item.start_time.toString())}</span>
            </p>
            <p>
              <b>{strings.EndDateLabel}:</b>{' '}
              <span>{formatDate(timelineItem.item.end_time.toString())}</span>
            </p>
          </>
        )
      }
      case strings.ProjectLabel: {
        return (
          <>
            <p hidden={!timelineItem.item.projectUrl}>
              <b>{strings.ProjectLabel}:</b>{' '}
              <a href={timelineItem.item.projectUrl}>
                <span>{timelineItem.item.project}</span>
              </a>
            </p>
            <p hidden={!item.budgetTotal || !item.costsTotal}>
              <a
                target='_blank'
                rel='noreferrer'
                href={`${timelineItem.item.projectUrl}/SitePages/Prosjektstatus.aspx`}>
                <span>{strings.LastPublishedStatusreport}</span>
              </a>
            </p>
            <p hidden={!item.phase}>
              <b>{strings.CurrentPhaseLabel}:</b> <span>{item.phase}</span>
            </p>
            <p>
              <b>{strings.StartDateLabel}:</b>{' '}
              <span>{formatDate(timelineItem.item.start_time.toString())}</span>
            </p>
            <p>
              <b>{strings.EndDateLabel}:</b>{' '}
              <span>{formatDate(timelineItem.item.end_time.toString())}</span>
            </p>
          </>
        )
      }
      default: {
        return (
          <>
            <p>
              <b>{strings.NameLabel}:</b> <span>{timelineItem.item.title}</span>
            </p>
            <p hidden={!item.description}>
              <b>{strings.DescriptionFieldLabel}:</b> <span>{item.description}</span>
            </p>
            <p hidden={item.elementType !== strings.TriangleLabel}>
              <b>{strings.ColumnRenderOptionDate}:</b>{' '}
              <span>{formatDate(timelineItem.item.end_time.toString())}</span>
            </p>
            <p hidden={item.elementType === strings.TriangleLabel}>
              <b>{strings.StartDateLabel}:</b>{' '}
              <span>{formatDate(timelineItem.item.start_time.toString())}</span>
            </p>
            <p hidden={item.elementType === strings.TriangleLabel}>
              <b>{strings.EndDateLabel}:</b>{' '}
              <span>{formatDate(timelineItem.item.end_time.toString())}</span>
            </p>
          </>
        )
      }
    }
  }

  const boundRect = document.getElementsByClassName('rct-scroll')[0].getBoundingClientRect()
  const bounds = {
    top: boundRect.top,
    left: boundRect.left,
    right: boundRect.right,
    bottom: boundRect.bottom + 450,
    width: boundRect.width,
    height: boundRect.height + 450
  }

  return (
    <Callout
      className={styles.detailsCallout}
      styles={{
        beak: { backgroundColor: item.hexColor },
        beakCurtain: {
          borderTop: `8px solid ${item.hexColor}`,
          borderRadius: '4px'
        }
      }}
      target={timelineItem.element}
      bounds={bounds}
      onDismiss={onDismiss}
      setInitialFocus={true}>
      <div className={styles.calloutHeader}>
        <div
          hidden={!item.tag}
          title={strings.TagFieldLabel}
          className={styles.tag}
          style={{
            backgroundColor: item.hexColor,
          }}>
          {item.tag}
        </div>
      </div>
      {_calloutContent()}
      <p hidden={!item.budgetTotal}>
        <b>{strings.BudgetTotalLabel}:</b> <span>{tryParseCurrency(item.budgetTotal)}</span>
      </p>
      <p hidden={!item.costsTotal}>
        <b>{strings.CostsTotalLabel}:</b> <span>{tryParseCurrency(item.costsTotal)}</span>
      </p>
      <p hidden={!item.description}>
        <b>{strings.DescriptionFieldLabel}:</b> <span>{item.description}</span>
      </p>
      <p hidden={!item.type}>
        <b>{strings.TypeLabel}:</b> <span>{item.type}</span>
      </p>
    </Callout>
  )
}
