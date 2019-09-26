import { IProgressIndicatorProps, ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';
import * as React from 'react';

// tslint:disable-next-line: naming-convention
export const ProgressBar = ({ label, description, className }: IProgressIndicatorProps) => {
    if (!label) return null;
    return (
        <div className={className}>
            <ProgressIndicator label={label} description={description} />
        </div>
    );
};