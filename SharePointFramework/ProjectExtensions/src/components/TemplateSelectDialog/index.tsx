/* eslint-disable no-console */
import {
  DefaultButton,
  DialogFooter,
  MessageBar,
  MessageBarType,
  Pivot,
  PivotItem,
  PrimaryButton
} from '@fluentui/react'
import { ProjectTemplate } from 'models'
import * as strings from 'ProjectExtensionsStrings'
import React, { Component, ReactElement } from 'react'
import { isEmpty } from 'underscore'
import { ProjectSetupSettings } from '../../projectSetup/ProjectSetupSettings'
import { BaseDialog } from '../@BaseDialog'
import { ExtensionsSection } from './ExtensionsSection'
import { ListContentSection } from './ListContentSection'
import styles from './TemplateSelectDialog.module.scss'
import { TemplateSelector } from './TemplateSelector'
import { ITemplateSelectDialogProps, ITemplateSelectDialogState } from './types'

export class TemplateSelectDialog extends Component<
  ITemplateSelectDialogProps,
  ITemplateSelectDialogState
> {
  constructor(props: ITemplateSelectDialogProps) {
    super(props)
    this.state = {
      flexibleHeight: (props.data.templates.filter(t => !t.isHidden).length / 4) * 150,
      selectedTemplate: this._getDefaultTemplate(),
      selectedExtensions: props.data.extensions.filter(
        (ext) =>
          ext.isDefault || this._getDefaultTemplate().listExtensionIds?.some((id) => id === ext.id)
      ),
      selectedListContentConfig: props.data.listContentConfig.filter(
        (lcc) =>
          lcc.isDefault ||
          this._getDefaultTemplate().listContentConfigIds?.some((id) => id === lcc.id)
      ),
      settings: new ProjectSetupSettings().useDefault()
    }
  }

  public render(): ReactElement<ITemplateSelectDialogProps> {
    const { version, onDismiss, data } = this.props
    const { selectedTemplate, selectedListContentConfig, selectedExtensions } = this.state

    return (
      <BaseDialog
        version={version}
        dialogContentProps={{
          title: strings.TemplateSelectDialogTitle,
          subText: strings.TemplateSelectDialogInfoText,
          className: styles.content
        }}
        modalProps={{ containerClassName: styles.root, isBlocking: true, isDarkOverlay: true }}
        onDismiss={onDismiss}
        containerClassName={styles.root}>
        <Pivot style={{ minHeight: 350, height: this.state.flexibleHeight }}>
          <PivotItem headerText={strings.TemplateSelectorTitle} itemIcon='ViewListGroup'>
            <TemplateSelector
              templates={data.templates.filter((t) => !t.isHidden)}
              selectedTemplate={selectedTemplate}
              onChange={this._onTemplateChange.bind(this)}
            />
            {(selectedTemplate.listContentConfigIds || selectedTemplate.listExtensionIds) && (
              <MessageBar messageBarType={MessageBarType.info}>
                {strings.TemplateListContentConfigText}
              </MessageBar>
            )}
          </PivotItem>
          {!isEmpty(data.extensions) && (
            <PivotItem headerText={strings.ExtensionsTitle} itemIcon='ArrangeBringForward'>
              {selectedTemplate.listExtensionIds && (
                <div style={{ marginTop: 20 }}>
                  <MessageBar messageBarType={MessageBarType.info}>
                    {strings.TemplateListContentConfigText}
                  </MessageBar>
                </div>
              )}
              <ExtensionsSection
                extensions={data.extensions}
                selectedExtensions={selectedExtensions}
                lockDefault={selectedTemplate.isDefaultExtensionsLocked}
                onChange={(s) => this.setState({ selectedExtensions: s })}
              />
            </PivotItem>
          )}
          {!isEmpty(data.listContentConfig) && (
            <PivotItem headerText={strings.ListContentTitle} itemIcon='ViewList'>
              {selectedTemplate.listContentConfigIds && (
                <div style={{ marginTop: 20 }}>
                  <MessageBar messageBarType={MessageBarType.info}>
                    {strings.TemplateListContentConfigText}
                  </MessageBar>
                </div>
              )}
              <ListContentSection
                listContentConfig={data.listContentConfig}
                selectedListContentConfig={selectedListContentConfig}
                lockDefault={selectedTemplate.isDefaultListContentLocked}
                onChange={(s) => this.setState({ selectedListContentConfig: s })}
              />
            </PivotItem>
          )}
        </Pivot>
        <DialogFooter>
          <PrimaryButton
            text={strings.TemplateSelectDialogSubmitButtonText}
            onClick={this._onSubmit.bind(this)}
          />
          <DefaultButton text={strings.CloseModalText} onClick={this.props.onDismiss} />
        </DialogFooter>
      </BaseDialog>
    )
  }

  /**
   * Sets the selected template to the state, and updates the pre-defined selected extensions
   *
   * @param template - Project template
   */
  private _onTemplateChange(template: ProjectTemplate): void {
    this.setState({
      selectedTemplate: template,
      selectedExtensions: this.props.data.extensions.filter(
        (ext) => ext.isDefault || template.listExtensionIds?.some((id) => id === ext.id)
      ),
      selectedListContentConfig: this.props.data.listContentConfig.filter(
        (lcc) => lcc.isDefault || template.listContentConfigIds?.some((id) => id === lcc.id)
      )
    })
  }

  /**
   * Get default template.
   *
   * The first template that is set to default or the first template retrieved
   */
  private _getDefaultTemplate(): ProjectTemplate {
    let [defaultTemplate] = this.props.data.templates.filter((tmpl) => tmpl.isDefault)
    if (!defaultTemplate) defaultTemplate = this.props.data.templates[0]
    return defaultTemplate
  }

  /**
   * On submit the selected user configuration
   */
  private _onSubmit() {
    const data = { ...this.state }
    data.selectedTemplate.listContentConfigIds = this.state.selectedListContentConfig.map(
      (lcc) => lcc.id
    )
    this.props.onSubmit(data)
  }
}

export * from './types'
