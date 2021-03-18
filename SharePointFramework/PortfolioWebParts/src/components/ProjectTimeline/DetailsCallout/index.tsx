import { ITimelineItem } from 'interfaces/ITimelineItem'
import { Callout } from 'office-ui-fabric-react/lib/Callout'
import { formatDate, tryParseCurrency } from 'pp365-shared/lib/helpers'
import React from 'react'
import styles from './DetailsCallout.module.scss'

export interface IDetailsCalloutProps {
  item: { data: ITimelineItem; element: HTMLElement }
  onDismiss: () => void
}

// tslint:disable-next-line: naming-convention
export const DetailsCallout = ({ item, onDismiss }: IDetailsCalloutProps) => {
  console.log(item);  

  return (
    <Callout
      className={styles.detailsCallout}
      gapSpace={10}
      target={item.element}
      onDismiss={onDismiss}
      setInitialFocus={true}>
      <p hidden={!item.data.project}>
        <b>Prosjekt:</b>{' '}
        <a href={item.data.projectUrl}>
          <span>{item.data.project}</span>
        </a>
      </p>
      <p hidden={!item.data.phase}>
        <b>Gjeldende fase:</b> <span>{item.data.phase}</span>
      </p>
      <p>
        <b>Startdato:</b> <span>{formatDate(item.data.start_time.toString())}</span>
      </p>
      <p>
        <b>Sluttdato:</b> <span>{formatDate(item.data.end_time.toString())}</span>
      </p>
      <p hidden={!item.data.budgetTotal}>
        <b>Totalbudsjett for prosjektet:</b> <span>{tryParseCurrency(item.data.budgetTotal, '').toString().replace(/(?!^)(?=(?:\d{3})+(?:\.|$))/gm, ' ')}</span>
      </p>
      <p hidden={!item.data.costsTotal}>
        <b>Kostnader påløpt totalt:</b> <span>{tryParseCurrency(item.data.costsTotal, '').toString().replace(/(?!^)(?=(?:\d{3})+(?:\.|$))/gm, ' ')}</span>
      </p>
      <p hidden={(!item.data.budgetTotal || !item.data.costsTotal) || item.data.type !== 'Prosjekt'}>
        <a target="_blank" href={`${item.data.projectUrl}/SitePages/Prosjektstatus.aspx`}>
          <span>{`Siste publiserte statusrapport`}</span>
        </a>
      </p>
      <p hidden={!item.data.type || item.data.type === 'Prosjekt'}>
        <b>Type:</b> <span>{item.data.type}</span>
      </p>
    </Callout>
  )
}
