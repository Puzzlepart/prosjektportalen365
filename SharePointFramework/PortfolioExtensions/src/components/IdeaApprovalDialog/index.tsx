import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { BaseDialog, IDialogConfiguration } from '@microsoft/sp-dialog'
import strings from 'PortfolioExtensionsStrings'
import { UserMessage, customLightTheme } from 'pp365-shared-library'
import {
  Button,
  Field,
  Textarea,
  Option,
  Combobox,
  FluentProvider,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogTitle,
  useId,
  IdPrefixProvider
} from '@fluentui/react-components'
import { IIdeaApprovalDialogProps } from './types'
import { FC, useContext } from 'react'
import { IDeaApprovalDialogContext } from './context'
import { useIdeaApprovalDialogState } from './useIdeaApprovalDialogState'
import { format } from '@fluentui/react'
import styles from './IdeaApprovalDialog.module.scss'

export const IdeaApprovalDialog: FC<IIdeaApprovalDialogProps> = (props) => {
  const fluentProviderId = useId('fp-approval-dialog')
  const context = useContext(IDeaApprovalDialogContext)
  const { state, setState } = useIdeaApprovalDialogState()

  return (
    <IDeaApprovalDialogContext.Provider value={context}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <DialogBody className={styles.ideaApprovalDialog}>
            <DialogTitle>{strings.SetRecommendationTitle}</DialogTitle>
            <DialogContent className={styles.content}>
              <UserMessage
                title={format(strings.SetRecommendationSubtitle, props.ideaTitle)}
                text={props.dialogMessage}
                intent='info'
              />
              <Field label={strings.ActionLabel}>
                <Combobox
                  onOptionSelect={(_, data) => setState({ choice: data.optionText })}
                  placeholder={strings.ActionLabelPlaceholder}
                >
                  <Option value={strings.ApproveChoice}>{strings.ApproveChoice}</Option>
                  <Option value={strings.ConsiderationChoice}>{strings.ConsiderationChoice}</Option>
                  <Option value={strings.RejectChoice}>{strings.RejectChoice}</Option>
                </Combobox>
              </Field>
              <Field label={strings.CommentLabel}>
                <Textarea
                  rows={3}
                  placeholder={strings.CommentLabelPlaceholder}
                  onChange={(_, { value }) => setState({ comment: value })}
                />
              </Field>
            </DialogContent>
            <DialogActions>
              <Button title={strings.CancelLabel} onClick={props.close}>
                {strings.CancelLabel}
              </Button>
              <Button
                appearance='primary'
                title={strings.SubmitLabel}
                onClick={() => {
                  props.submit(state.choice, state.comment)
                }}
                disabled={state.comment.length > 0 && state.choice.length > 0 ? false : true}
              >
                {strings.SubmitLabel}
              </Button>
            </DialogActions>
          </DialogBody>
        </FluentProvider>
      </IdPrefixProvider>
    </IDeaApprovalDialogContext.Provider>
  )
}

export default class RecommendationDialog extends BaseDialog {
  public message: string
  public selectedChoice: string
  public ideaTitle: string
  public dialogMessage: string
  public comment: string

  public render(): void {
    ReactDOM.render(
      <IdeaApprovalDialog
        close={this.close}
        submit={this._submit}
        ideaTitle={this.ideaTitle}
        dialogMessage={this.dialogMessage}
      />,
      this.domElement
    )
  }

  public getConfig(): IDialogConfiguration {
    return {
      isBlocking: false
    }
  }

  protected onAfterClose(): void {
    super.onAfterClose()
    ReactDOM.unmountComponentAtNode(this.domElement)
  }

  private _submit = (choice: string, comment: string) => {
    this.selectedChoice = choice
    this.comment = comment
    this.close()
  }
}
