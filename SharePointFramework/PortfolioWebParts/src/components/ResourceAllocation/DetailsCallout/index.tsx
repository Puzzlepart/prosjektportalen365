import { Callout } from 'office-ui-fabric-react/lib/Callout';
import * as React from 'react';
import { ITimelineItem } from 'interfaces/ITimelineItem';
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
            <p>
                Message body is optional. If help documentation is available, consider adding a link to learn more at the bottom.
              </p>
        </Callout>
    );
};
