import { ITimelineItem } from 'interfaces/ITimelineItem';
import { Callout } from 'office-ui-fabric-react/lib/Callout';
import * as React from 'react';
import { formatDate } from 'shared/lib/helpers/formatDate';
import styles from './DetailsCallout.module.scss';

export interface IDetailsCalloutProps {
    item: { data: ITimelineItem, element: HTMLElement };
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
            <p><b>Ressurs:</b> {item.data.resource}</p>
            <p><b>Allokeringsprosent:</b> {item.data.allocation}%</p>
            <p><b>Startdato:</b> {formatDate(item.data.props.GtStartDateOWSDATE)}</p>
            <p><b>Sluttdato:</b> {formatDate(item.data.props.GtEndDateOWSDATE)}</p>
            <p hidden={!item.data.props.GtAllocationStatusOWSCHCS}><b>Allokeringsstatus:</b> {item.data.props.GtAllocationStatusOWSCHCS}</p>
            <p hidden={!item.data.props.GtAllocationCommentOWSMTXT}><b>Kommentar:</b> {item.data.props.GtAllocationCommentOWSMTXT}</p>
        </Callout>
    );
};
