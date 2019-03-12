//#region Imports
import * as React from "react";
import { Dialog, DialogType } from "office-ui-fabric-react/lib/Dialog";
import { autobind } from "office-ui-fabric-react/lib/Utilities";
import { View } from "./Views";
import { Body } from "./Body";
import { Footer } from "./Footer";
import IChangePhaseDialogProps from "./IChangePhaseDialogProps";
import IChangePhaseDialogState from "./IChangePhaseDialogState";
import styles from './ChangePhaseDialog.module.scss';
import * as strings from 'ProjectPhasesWebPartStrings';
import * as stringFormat from 'string-format';
//#endregion

/**
 * Change phase dialog
 */
export default class ChangePhaseDialog extends React.Component<IChangePhaseDialogProps, IChangePhaseDialogState> {
    private openChecklistItems: any[] = [];

    /**
     * Constructor
     */
    constructor(props: IChangePhaseDialogProps) {
        super(props);
        this.state = {
            currentIdx: 0,
            isLoading: false,
            currentView: View.Initial,
        };
        if (props.activePhase) {
            this.openChecklistItems = props.activePhase.checklistData.items.filter(item => item.GtChecklistStatus === strings.StatusOpen);
        }
    }

    public componentDidMount(): void {
        if (this.openChecklistItems.length === 0) {
            const currentView = View.Confirm;
            this.setState({ currentView });
        }
    }

    public render() {
        const dlgCntBaseProps = {
            currentView: this.state.currentView,
            isLoading: this.state.isLoading,
            onDismiss: this.props.onDismiss,
            onChangePhase: this.props.onChangePhase,
            newPhase: this.props.newPhase,
            activePhase: this.props.activePhase,
        };
        return (
            <Dialog
                isOpen={true}
                containerClassName={styles.changePhaseDialog}
                title={strings.ChangePhaseText}
                subText={this.state.currentView === View.Confirm ? stringFormat(strings.ConfirmChangePhase, this.props.newPhase.name) : ''}
                dialogContentProps={{ type: DialogType.largeHeader }}
                modalProps={{ isDarkOverlay: true, isBlocking: false }}
                onDismiss={this.props.onDismiss}>
                <Body
                    {...dlgCntBaseProps}
                    openCheckListItems={this.openChecklistItems}
                    currentIdx={this.state.currentIdx}
                    nextCheckPointAction={this.nextCheckPoint} />
                <Footer {...dlgCntBaseProps} onChangeView={this.onChangeView} />
            </Dialog>
        );
    }

    /**
     * Go to next checkpoint
     *
     * @param {string} statusValue Status value
     * @param {string} commentsValue Comments value
     * @param {boolean} updateStatus Should status be updated
     */
    @autobind
    private async nextCheckPoint(statusValue: string, commentsValue: string, updateStatus: boolean = true): Promise<void> {
        this.setState({ isLoading: true });
        const { activePhase } = this.props;
        const { currentIdx } = this.state;
        let updatedValues: { [key: string]: string } = { GtComment: commentsValue };
        if (updateStatus) {
            updatedValues.GtChecklistStatus = statusValue;
        }
        await this.props.phaseChecklist.items.getById(this.openChecklistItems[currentIdx].ID).update(updatedValues);
        let currentItem = { ...this.openChecklistItems[currentIdx], ...updatedValues };
        activePhase.checklistData.items = activePhase.checklistData.items.map(item => {
            if (currentItem.ID === item.ID) {
                return currentItem;
            }
            return item;
        });
        this.openChecklistItems[currentIdx] = currentItem;
        let newState: Partial<IChangePhaseDialogState> = { isLoading: false };
        if (currentIdx < (this.openChecklistItems.length - 1)) {
            newState.currentIdx = (currentIdx + 1);
        } else {
            newState.currentView = View.Summary;
        }
        this.setState(newState);
    }

    /**
     * Change view
     *
     * @param {View} newView New view
     */
    @autobind
    private onChangeView(newView: View) {
        this.setState({ currentView: newView });
    }
}

export { IChangePhaseDialogProps };
