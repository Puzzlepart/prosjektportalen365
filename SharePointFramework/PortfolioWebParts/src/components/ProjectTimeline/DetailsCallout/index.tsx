import { ITimelineItem } from 'interfaces/ITimelineItem'
import { Callout } from 'office-ui-fabric-react/lib/Callout'
import { formatDate } from 'pp365-shared/lib/helpers/formatDate'
import React from 'react'
import styles from './DetailsCallout.module.scss'

export interface IDetailsCalloutProps {
  item: { data: ITimelineItem; element: HTMLElement }
  onDismiss: () => void
}

// tslint:disable-next-line: naming-convention
export const DetailsCallout = ({ item, onDismiss }: IDetailsCalloutProps) => {
  return (
    <Callout
      className={styles.detailsCallout}
      gapSpace={10}
      target={item.element}
      onDismiss={onDismiss}
      setInitialFocus={true}>
      <p>
        <b>Prosjekt:</b>{' '}
        <a href={item.data.projectUrl}>
          <span>{item.data.project}</span>
        </a>
      </p>
      <p>
        <b>Gjeldende fase:</b> <span>{item.data.phase}</span>
      </p>
      <p>
        <b>Startdato:</b> <span>{formatDate(item.data.start_time.toString())}</span>
      </p>
      <p>
        <b>Sluttdato:</b> <span>{formatDate(item.data.end_time.toString())}</span>
      </p>
    </Callout>
  )
}
