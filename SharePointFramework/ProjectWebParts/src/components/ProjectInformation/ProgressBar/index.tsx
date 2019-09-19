import { IProgressIndicatorProps, ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';
import * as React from 'react';

// tslint:disable-next-line: naming-convention
export const ProgressBar = (props: IProgressIndicatorProps) => {
    if (!props.label) return null;
    return (
        <div className={props.className}>
            <ProgressIndicator label={props.label} description={props.description} />
        </div>
    );
};