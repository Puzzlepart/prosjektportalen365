import * as React from 'react';
import { useState } from 'react';
import { IRiskElementProps } from './IRiskElementProps';
import styles from './RiskElement.module.scss';
import { RiskElementCallout } from './RiskElementCallout';

// tslint:disable-next-line: naming-convention
export const RiskElement = ({ style, model, calloutTemplate }: IRiskElementProps) => {
    const [callout, setCallout] = useState(null);

    const getTooltip = () => {
        let tooltip = '';
        if (model.siteTitle) {
            tooltip += `${model.siteTitle}: `;
        }
        tooltip += model.title;
        return tooltip;
    };

    return (
        <>
            <div
                onClick={event => setCallout(event.currentTarget)}
                className={styles.riskElement}
                title={getTooltip()}
                style={style}>
                {model.id}
            </div>
            {callout && (
                <RiskElementCallout
                    risk={model}
                    calloutTemplate={calloutTemplate}
                    target={callout}
                    onDismiss={_ => setCallout(null)} />
            )}
        </>
    );
};