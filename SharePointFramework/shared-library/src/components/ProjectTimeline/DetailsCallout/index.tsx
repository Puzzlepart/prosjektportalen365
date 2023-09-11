import { Callout } from '@fluentui/react/lib/Callout'
import * as strings from 'SharedLibraryStrings'
import { formatDate, tryParseCurrency } from '../../../util'
import styles from './DetailsCallout.module.scss'
import React, { FC } from 'react'
import { IDetailsCalloutProps } from './types'
import { FluentProvider, Link, useId, webLightTheme } from '@fluentui/react-components'

export const DetailsCallout: FC<IDetailsCalloutProps> = (props) => {
  const fluentProviderId = useId('fluent-provider')
  const { data } = props.timelineItem.item
  const { item } = props.timelineItem

  const calloutContent = (): JSX.Element => {
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
      <FluentProvider id={fluentProviderId} theme={webLightTheme}>
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
      </FluentProvider>
    </Callout>
  )
}
