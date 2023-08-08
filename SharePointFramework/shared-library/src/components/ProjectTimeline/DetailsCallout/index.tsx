import { Callout } from '@fluentui/react/lib/Callout'
import * as strings from 'SharedLibraryStrings'
import { formatDate, tryParseCurrency } from '../../../util'
import styles from './DetailsCallout.module.scss'
import React, { FC } from 'react'
import { IDetailsCalloutProps } from './types'

export const DetailsCallout: FC<IDetailsCalloutProps> = (props) => {
  const { data } = props.timelineItem.item

  const calloutContent = (): JSX.Element => {
    switch (data.type) {
      case strings.MilestoneLabel: {
        return (
          <>
            <p hidden={!data.type}>
              <b>{data.type}:</b> <span>{props.timelineItem.item.title}</span>
            </p>
            <p>
              <b>{strings.MilestoneDateLabel}:</b>{' '}
              <span>{formatDate(props.timelineItem.item.end_time.toString())}</span>
            </p>
          </>
        )
      }
      case strings.PhaseLabel:
      case strings.SubPhaseLabel: {
        return (
          <>
            <p hidden={!data.type}>
              <b>{data.type}:</b> <span>{props.timelineItem.item.title}</span>
            </p>
            <p>
              <b>{strings.StartDateLabel}:</b>{' '}
              <span>{formatDate(props.timelineItem.item.start_time.toString())}</span>
            </p>
            <p>
              <b>{strings.EndDateLabel}:</b>{' '}
              <span>{formatDate(props.timelineItem.item.end_time.toString())}</span>
            </p>
          </>
        )
      }
      case strings.ProjectLabel: {
        return (
          <>
            <p hidden={!props.timelineItem.item.data.projectUrl}>
              <b>{strings.ProjectLabel}:</b>{' '}
              <a href={props.timelineItem.item.data.projectUrl}>
                <span>{props.timelineItem.item.data.project}</span>
              </a>
            </p>
            <p hidden={!data.budgetTotal || !data.costsTotal}>
              <a
                target='_blank'
                rel='noreferrer'
                href={`${props.timelineItem.item.data.projectUrl}/SitePages/Prosjektstatus.aspx`}
              >
                <span>{strings.LastPublishedStatusreport}</span>
              </a>
            </p>
            <p hidden={!data.phase}>
              <b>{strings.CurrentPhaseLabel}:</b> <span>{data.phase}</span>
            </p>
            <p>
              <b>{strings.StartDateLabel}:</b>{' '}
              <span>{formatDate(props.timelineItem.item.start_time.toString())}</span>
            </p>
            <p>
              <b>{strings.EndDateLabel}:</b>{' '}
              <span>{formatDate(props.timelineItem.item.end_time.toString())}</span>
            </p>
          </>
        )
      }
      default: {
        return (
          <>
            <p>
              <b>{strings.NameLabel}:</b> <span>{props.timelineItem.item.title}</span>
            </p>
            <p hidden={data.elementType !== strings.TriangleLabel}>
              <b>{strings.ColumnRenderOptionDate}:</b>{' '}
              <span>{formatDate(props.timelineItem.item.end_time.toString())}</span>
            </p>
            <p hidden={data.elementType === strings.TriangleLabel}>
              <b>{strings.StartDateLabel}:</b>{' '}
              <span>{formatDate(props.timelineItem.item.start_time.toString())}</span>
            </p>
            <p hidden={data.elementType === strings.TriangleLabel}>
              <b>{strings.EndDateLabel}:</b>{' '}
              <span>{formatDate(props.timelineItem.item.end_time.toString())}</span>
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
        beak: { backgroundColor: data.bgColorHex },
        beakCurtain: {
          borderTop: `8px solid ${data.bgColorHex}`,
          borderRadius: '4px'
        }
      }}
      target={props.timelineItem.element}
      bounds={bounds}
      onDismiss={props.onDismiss}
      setInitialFocus={true}
    >
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
      {calloutContent()}
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
    </Callout>
  )
}
