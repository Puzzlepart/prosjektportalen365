import { DefaultButton, DialogFooter, Pivot, PivotItem, PrimaryButton } from '@fluentui/react'
import { ProjectTemplate } from 'models'
import * as strings from 'ProjectExtensionsStrings'
import React, { Component, ReactElement } from 'react'
import { first, isEmpty } from 'underscore'
import { ProjectSetupSettings } from '../../projectSetup/ProjectSetupSettings'
import { BaseDialog } from '../@BaseDialog'
import { ExtensionsSection } from './ExtensionsSection'
import { ListContentSection } from './ListContentSection'
import { TemplateListContentConfigMessage } from './TemplateListContentConfigMessage'
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
      flexibleHeight: (props.data.templates.filter((t) => !t.isHidden).length / 4) * 150,
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
    return (
      <BaseDialog
        version={this.props.version}
        dialogContentProps={{
          title: strings.TemplateSelectDialogTitle,
          subText: strings.TemplateSelectDialogInfoText,
          className: styles.content
        }}
        modalProps={{ containerClassName: styles.root, isBlocking: true, isDarkOverlay: true }}
        onDismiss={this.props.onDismiss}
        containerClassName={styles.root}>
        <Pivot style={{ minHeight: 350, height: this.state.flexibleHeight }}>
          <PivotItem headerText={strings.TemplateSelectorTitle} itemIcon='ViewListGroup'>
            <TemplateSelector
              templates={this.props.data.templates.filter((t) => !t.isHidden)}
              selectedTemplate={this.state.selectedTemplate}
              onChange={this._onTemplateChange.bind(this)}
            />
            {(this.state.selectedTemplate?.listContentConfigIds ||
              this.state.selectedTemplate?.listExtensionIds) && (
              <TemplateListContentConfigMessage selectedTemplate={this.state.selectedTemplate} />
            )}
          </PivotItem>
          {!isEmpty(this.props.data.extensions) && (
            <PivotItem headerText={strings.ExtensionsTitle} itemIcon='ArrangeBringForward'>
              {this.state.selectedTemplate?.listExtensionIds && (
                <TemplateListContentConfigMessage selectedTemplate={this.state.selectedTemplate} />
              )}
              <ExtensionsSection
                extensions={this.props.data.extensions}
                selectedExtensions={this.state.selectedExtensions}
                lockDefault={this.state.selectedTemplate?.isDefaultExtensionsLocked}
                onChange={(s) => this.setState({ selectedExtensions: s })}
              />
            </PivotItem>
          )}
          {!isEmpty(this.props.data.listContentConfig) && (
            <PivotItem headerText={strings.ListContentTitle} itemIcon='ViewList'>
              {this.state.selectedTemplate?.listContentConfigIds && (
                <TemplateListContentConfigMessage selectedTemplate={this.state.selectedTemplate} />
              )}
              <ListContentSection
                listContentConfig={this.props.data.listContentConfig}
                selectedListContentConfig={this.state.selectedListContentConfig}
                lockDefault={this.state.selectedTemplate?.isDefaultListContentLocked}
                onChange={(s) => this.setState({ selectedListContentConfig: s })}
              />
            </PivotItem>
          )}
        </Pivot>
        <DialogFooter>
          <PrimaryButton
            disabled={!this.state.selectedTemplate}
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
    // eslint-disable-next-line no-console
    console.log({ _onTemplateChange: template })
    this.setState({
      selectedTemplate: template,
      selectedExtensions: this.props.data.extensions.filter(
        (ext) => ext.isDefault || template?.listExtensionIds?.some((id) => id === ext.id)
      ),
      selectedListContentConfig: this.props.data.listContentConfig.filter(
        (lcc) => lcc.isDefault || template?.listContentConfigIds?.some((id) => id === lcc.id)
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
    if (!defaultTemplate) defaultTemplate = first(this.props.data.templates)
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
