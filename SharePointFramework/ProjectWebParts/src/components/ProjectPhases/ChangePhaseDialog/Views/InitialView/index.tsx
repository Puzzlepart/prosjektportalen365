import * as React from 'react';
import { PrimaryButton, IButtonProps } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { IInitialViewProps } from './IInitialViewProps';
import { IInitialViewState } from './IInitialViewState';
import * as strings from 'ProjectWebPartsStrings';

/**
 * @component InitialView
 */
export default class InitialView extends React.Component<IInitialViewProps, IInitialViewState> {
    public static defaultProps: Partial<IInitialViewProps> = { commentMinLength: 4 };

    /**
     * Constructor
     *
     * @param {IInitialViewProps} props Props
     */
    constructor(props: IInitialViewProps) {
        super(props);
        this.state = { comment: props.currentChecklistItem ? (props.currentChecklistItem.GtComment || '') : '' };
    }

    public render(): JSX.Element {
        if (!this.props.currentChecklistItem) {
            return null;
        }
        return (
            <div>
                <h3>{this.props.currentChecklistItem.ID}. {this.props.currentChecklistItem.Title}</h3>
                <div style={{ marginTop: 10 }}>
                    <TextField
                        onChange={this._onCommentUpdate.bind(this)}
                        placeholder={strings.CommentLabel}
                        multiline
                        value={this.state.comment}
                        resizable={false}
                        style={{ height: 100 }} />
                </div>
                {this._renderStatusOptions()}
            </div>
        );
    }

    /**
     * Render status options
     */
    private _renderStatusOptions() {
        const { isLoading, commentMinLength } = this.props;
        const { comment } = this.state;
        const isCommentValid = (comment.length >= commentMinLength) && /\S/.test(comment);
        const actions: IButtonProps[] = [
            {
                text: strings.StatusNotRelevant,
                disabled: (isLoading || !isCommentValid),
                title: !isCommentValid ? strings.CheckpointNotRelevantTooltipCommentEmpty : strings.CheckpointNotRelevantTooltip,
                onClick: () => this._onNextCheckPoint(strings.StatusNotRelevant, comment),
            },
            {
                text: strings.StatusStillOpen,
                disabled: (isLoading || !isCommentValid),
                title: !isCommentValid ? strings.CheckpointStillOpenTooltipCommentEmpty : strings.CheckpointStillOpenTooltip,
                onClick: () => this._onNextCheckPoint(strings.StatusStillOpen, comment, false),
            },
            {
                text: strings.StatusClosed,
                disabled: isLoading,
                title: strings.CheckpointDoneTooltip,
                onClick: () => this._onNextCheckPoint(strings.StatusClosed, comment),
            }];
        return (
            <div style={{ marginTop: 20, marginBottom: 25 }}>
                {actions.map((statusOpt, key) => (
                    <span key={key} >
                        <PrimaryButton style={{ marginRight: 5 }} {...statusOpt} />
                    </span>
                ))}
            </div>
        );
    }

    /**
    * Next checkpoint action
    *
    * @param {string} status Status value
    * @param {string} comment Comment value
    * @param {boolean} _updateStatus Update status
    */
    private _onNextCheckPoint(status: string, comment: string, _updateStatus: boolean = true) {
        this.props.nextCheckPointAction(status, comment, true);
        this.setState({ comment: '' });
    }

    /**
    * On comment update
    *
    * @param {any} _event Event
    * @param {string} comment New value for comment
    */
    private _onCommentUpdate(_event: any, comment: string) {
        this.setState({ comment });
    }
}
