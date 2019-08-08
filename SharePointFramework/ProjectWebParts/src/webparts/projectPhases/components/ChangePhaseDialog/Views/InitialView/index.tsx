import * as React from 'react';
import { PrimaryButton, IButtonProps } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import IInitialViewProps, { InitialViewDefaultProps } from './IInitialViewProps';
import IInitialViewState from './IInitialViewState';
import * as ProjectPhasesWebPartStrings from 'ProjectPhasesWebPartStrings';

/**
 * Initial view
 */
export default class InitialView extends React.Component<IInitialViewProps, IInitialViewState> {
    public static defaultProps = InitialViewDefaultProps;

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
            <div className={this.props.className}>
                <h3>{this.props.currentChecklistItem.Title}</h3>
                <div style={{ marginTop: 10 }}>
                    <TextField
                        onChange={this.onCommentUpdate}
                        placeholder={ProjectPhasesWebPartStrings.CommentLabel}
                        multiline
                        value={this.state.comment}
                        resizable={false}
                        style={{ height: 100 }} />
                </div>
                {this.renderStatusOptions()}
            </div>
        );
    }

    /**
     * Render status options
     */
    private renderStatusOptions() {
        const { isLoading, commentMinLength } = this.props;
        const { comment } = this.state;
        const isCommentValid = (comment.length >= commentMinLength) && /\S/.test(comment);
        const statusOptions: IButtonProps[] = [
            {
                text: ProjectPhasesWebPartStrings.StatusNotRelevant,
                disabled: (isLoading || !isCommentValid),
                title: !isCommentValid ? ProjectPhasesWebPartStrings.CheckpointNotRelevantTooltipCommentEmpty : ProjectPhasesWebPartStrings.CheckpointNotRelevantTooltip,
                onClick: () => this.onNextCheckPoint(ProjectPhasesWebPartStrings.StatusNotRelevant, comment),
            },
            {
                text: ProjectPhasesWebPartStrings.StatusStillOpen,
                disabled: (isLoading || !isCommentValid),
                title: !isCommentValid ? ProjectPhasesWebPartStrings.CheckpointStillOpenTooltipCommentEmpty : ProjectPhasesWebPartStrings.CheckpointStillOpenTooltip,
                onClick: () => this.onNextCheckPoint(ProjectPhasesWebPartStrings.StatusStillOpen, comment, false),
            },
            {
                text: ProjectPhasesWebPartStrings.StatusClosed,
                disabled: isLoading,
                title: ProjectPhasesWebPartStrings.CheckpointDoneTooltip,
                onClick: () => this.onNextCheckPoint(ProjectPhasesWebPartStrings.StatusClosed, comment),
            }];
        return (
            <div style={{ marginTop: 20, marginBottom: 25 }}>
                {statusOptions.map((statusOpt, key) => (
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
    private onNextCheckPoint(status: string, comment: string, _updateStatus: boolean = true) {
        this.props.nextCheckPointAction(status, comment, true);
        this.setState({ comment: '' });
    }

    /**
    * On comment update
    *
    * @param {any} _event Event
    * @param {string} comment New value for comment
    */
    private onCommentUpdate = (_event: any, comment: string) => {
        this.setState({ comment });
    }
}
