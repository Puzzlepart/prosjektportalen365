//#region Imports
import * as React from 'react';
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';
import IChangingPhaseViewProps from './IChangingPhaseViewProps';
import IChangingPhaseViewState from './IChangingPhaseViewState';
import * as strings from 'ProjectWebPartsStrings';
import * as format from 'string-format';
//#endregion

/**
 * Changing phase view
 */
export default class ChangingPhaseView extends React.Component<IChangingPhaseViewProps, IChangingPhaseViewState> {
    public static displayName = 'ChangingPhaseView';

    /**
     * Constructor
     *
     * @param {IChangingPhaseViewProps} props Props
     */
    constructor(props: IChangingPhaseViewProps) {
        super(props);
    }

    public render(): JSX.Element {
        return (
            <ProgressIndicator label={strings.ChangingPhaseLabel} description={format(strings.ChangingPhaseDescription, this.props.newPhase.name)} />
        );
    }
}
