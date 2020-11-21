import { Logger, LogLevel } from '@pnp/logging'
import { IPhaseChecklistItem } from 'models'
import { Dialog, DialogType } from 'office-ui-fabric-react/lib/Dialog'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import * as strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import SPDataAdapter from '../../../data'
import { Body } from './Body'
import styles from './ChangePhaseDialog.module.scss'
import { Footer } from './Footer'
import { IChangePhaseDialogProps, IChangePhaseDialogState } from './types'
import { View } from './Views'

/**
 * @component ChangePhaseDialog
 */
export default class ChangePhaseDialog extends React.Component<
  IChangePhaseDialogProps,
  IChangePhaseDialogState
> {
  /**
   * Constructor
   *
   * @param {IChangePhaseDialogProps} props
   */
  constructor(props: IChangePhaseDialogProps) {
    super(props)
    const checklistItems = props.activePhase ? props.activePhase.checklistData.items : []
    this.state = {
      isLoading: false,
      checklistItems,
      currentIdx: this._getNextIndex(checklistItems),
      currentView:
        checklistItems.filter(this._checkPointOpenFilter).length > 0 ? View.Initial : View.Confirm
    }
  }

  public render() {
    const dlgCntBaseProps = {
      currentView: this.state.currentView,
      isLoading: this.state.isLoading,
      onDismiss: this.props.onDismiss,
      onChangePhase: this.props.onChangePhase,
      newPhase: this.props.newPhase,
      activePhase: this.props.activePhase
    }
    return (
      <Dialog
        isOpen={true}
        containerClassName={styles.changePhaseDialog}
        title={strings.ChangePhaseText}
        subText={
          this.state.currentView === View.Confirm
            ? format(strings.ConfirmChangePhase, this.props.newPhase.name)
            : ''
        }
        dialogContentProps={{ type: DialogType.largeHeader }}
        modalProps={{ isDarkOverlay: true, isBlocking: false }}
        onDismiss={this.props.onDismiss}>
        <Body
          {...dlgCntBaseProps}
          checklistItems={this.state.checklistItems}
          currentIdx={this.state.currentIdx}
          saveCheckPoint={this._saveCheckPoint.bind(this)}
        />
        <Footer {...dlgCntBaseProps} onChangeView={this._onChangeView.bind(this)} />
      </Dialog>
    )
  }

  /**
   * Go to next checkpoint
   *
   * @param {string} statusValue Status value
   * @param {string} commentsValue Comments value
   */
  private async _saveCheckPoint(statusValue: string, commentsValue: string): Promise<void> {
    this.setState({ isLoading: true })
    const { checklistItems, currentIdx } = { ...this.state } as IChangePhaseDialogState
    const currentItem = checklistItems[currentIdx]
    const updatedValues: { [key: string]: string } = {
      GtComment: commentsValue,
      GtChecklistStatus: statusValue
    }
    await SPDataAdapter.project.updateChecklistItem(
      strings.PhaseChecklistName,
      currentItem.ID,
      updatedValues
    )
    checklistItems[currentIdx] = { ...currentItem, ...updatedValues }
    const newState: Partial<IChangePhaseDialogState> = {
      checklistItems,
      isLoading: false
    }
    const nextIndex = this._getNextIndex(undefined, currentIdx + 1)
    if (nextIndex !== -1) newState.currentIdx = nextIndex
    else newState.currentView = View.Summary
    this.setState(newState)
  }

  /**
   * Get next index
   *
   * @param {IPhaseChecklistItem[]} checklistItems Check list items (default to state.checklistItems)
   * @param {number} startIndex Start index (defaults to 0)
   */
  private _getNextIndex(
    checklistItems: IPhaseChecklistItem[] = this.state.checklistItems,
    startIndex = 0
  ): number {
    Logger.log({
      message: '(ChangePhaseDialog) _getNextIndex: Retrieving next index',
      data: { currentIdx: startIndex },
      level: LogLevel.Info
    })
    const [nextOpen] = []
      .concat(checklistItems)
      .splice(startIndex)
      .filter((item) => item.GtChecklistStatus === strings.StatusOpen)
    return checklistItems.indexOf(nextOpen)
  }

  /**
   * Check point open filter
   *
   * @param {IPhaseChecklistItem} item Item
   */
  private _checkPointOpenFilter(item: IPhaseChecklistItem) {
    return item.GtChecklistStatus === strings.StatusOpen
  }

  /**
   * Change view
   *
   * @param {View} view New view
   */
  private _onChangeView(view: View) {
    this.setState({ currentView: view })
  }
}

export { IChangePhaseDialogProps }
