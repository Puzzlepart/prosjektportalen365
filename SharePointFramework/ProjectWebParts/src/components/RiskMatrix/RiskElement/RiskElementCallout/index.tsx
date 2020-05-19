import { Callout } from 'office-ui-fabric-react/lib/Callout';
import * as React from 'react';
import { replaceTokens } from 'shared/lib/util/replaceTokens';
import { IRiskElementCalloutProps } from './IRiskElementCalloutProps';


export const RiskElementCallout = ({ risk, calloutTemplate, target, onDismiss }: IRiskElementCalloutProps) => {
    let content = replaceTokens(calloutTemplate, risk.item);
    return (
        <Callout styles={{ root: { minWidth: 250, padding: 10 } }} target={target} onDismiss={onDismiss}>
            <span dangerouslySetInnerHTML={{ __html: content }}></span>
        </Callout>
    );
};