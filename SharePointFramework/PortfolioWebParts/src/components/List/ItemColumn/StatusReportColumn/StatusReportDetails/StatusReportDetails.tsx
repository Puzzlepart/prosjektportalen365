import { Button, Divider, Link } from '@fluentui/react-components'
import { Dismiss16Regular, Open12Regular } from '@fluentui/react-icons'
import strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import { StatusTile } from '../StatusTile'
import styles from './StatusReportDetails.module.scss'
import { IStatusReportDetailsProps } from './types'
import { useStatusReportDetails } from './useStatusReportDetails'

/**
 * A status report's details: the project and when the report was published, the overall status,
 * each section's tile, value and comment as a description list in the hub's order, and a link to
 * the report on the project's status page. Pinned, it has a close button, for those who cannot
 * press Escape.
 */
export const StatusReportDetails: FC<IStatusReportDetailsProps> = (props) => {
  const { sections } = useStatusReportDetails(props)
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.heading}>
          <h2 id={props.titleId} className={styles.title}>
            {props.title}
          </h2>
          <div id={props.subtitleId} className={styles.subtitle}>
            {props.reportedText}
          </div>
        </div>
        {props.pinned && (
          <Button
            appearance='subtle'
            size='small'
            icon={<Dismiss16Regular />}
            aria-label={strings.CloseText}
            className={styles.close}
            onClick={props.onClose}
          />
        )}
      </div>
      {props.report.overallStatus && (
        <div className={styles.overall}>
          {props.overallStatusName && (
            <h3 className={styles.overallName}>{props.overallStatusName}</h3>
          )}
          <p id={props.overallId} className={styles.overallText}>
            {props.report.overallStatus}
          </p>
        </div>
      )}
      <Divider />
      <dl className={styles.sections}>
        {sections.map((section) => (
          <div key={section.fieldName} className={styles.section}>
            <dt className={styles.name}>
              <StatusTile shape={section.shape} color={section.color} />
              <span className={styles.icon} aria-hidden>
                {section.icon}
              </span>
              <span>{section.name}</span>
            </dt>
            <dd className={styles.details}>
              <div className={section.valueClassName}>{section.valueText}</div>
              {section.comment && <div className={styles.comment}>{section.comment}</div>}
            </dd>
          </div>
        ))}
      </dl>
      {props.link && (
        <Link href={props.link} target='_blank' rel='noopener noreferrer' className={styles.link}>
          {strings.StatusReportOpenLink}
          <Open12Regular aria-hidden />
        </Link>
      )}
    </div>
  )
}
