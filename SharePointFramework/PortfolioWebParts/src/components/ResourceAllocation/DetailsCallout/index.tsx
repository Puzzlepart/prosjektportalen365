import { ITimelineItem } from 'interfaces/ITimelineItem'
import { Callout } from 'office-ui-fabric-react/lib/Callout'
import * as React from 'react'
import { formatDate } from 'shared/lib/helpers/formatDate'
import styles from './DetailsCallout.module.scss'

export interface IDetailsCalloutProps {
    item: { data: ITimelineItem; element: HTMLElement };
    onDismiss: () => void;
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
            <p><b>Prosjekt:</b> <a href={item.data.projectUrl}><span>{item.data.project}</span></a></p>
            <p hidden={!item.data.resource}><b>Ressurs:</b> <span>{item.data.resource}</span></p>
            <p hidden={!item.data.role}><b>Rolle:</b> <span>{item.data.role}</span></p>
            <p><b>Allokeringsprosent:</b> <span>{item.data.allocation}%</span></p>
            <p><b>Startdato:</b> <span>{formatDate(item.data.props.GtStartDateOWSDATE)}</span></p>
            <p><b>Sluttdato:</b> <span>{formatDate(item.data.props.GtEndDateOWSDATE)}</span></p>
            <p hidden={!item.data.props.GtAllocationStatusOWSCHCS}><b>Allokeringsstatus:</b> <span>{item.data.props.GtAllocationStatusOWSCHCS}</span></p>
            <p hidden={!item.data.props.GtAllocationCommentOWSMTXT}><b>Kommentar:</b> <span>{item.data.props.GtAllocationCommentOWSMTXT}</span></p>
        </Callout>
    )
}
