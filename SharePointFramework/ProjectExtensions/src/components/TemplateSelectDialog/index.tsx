import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button'
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot'
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import * as strings from 'ProjectExtensionsStrings'
import * as React from 'react'
import { ProjectSetupSettings } from '../../extensions/projectSetup/ProjectSetupSettings'
import { BaseDialog } from '../@BaseDialog'
import { ExtensionsSection } from './ExtensionsSection'
import { ITemplateSelectDialogProps } from './ITemplateSelectDialogProps'
import { ITemplateSelectDialogState } from './ITemplateSelectDialogState'
import { ListContentSection } from './ListContentSection'
import { SettingsSection } from './SettingsSection'
import styles from './TemplateSelectDialog.module.scss'
import { TemplateSelector } from './TemplateSelector'
import { ProjectTemplate } from 'models'

/**
 * @class TemplateSelectDialog
 */
export class TemplateSelectDialog extends React.Component<ITemplateSelectDialogProps, ITemplateSelectDialogState> {
    /**
     * Constructor
     * 
     * @param {ITemplateSelectDialogProps} props Props
     */
    constructor(props: ITemplateSelectDialogProps) {
        super(props)
        this.state = {
            selectedTemplate: this._getDefaultTemplate(),
            selectedExtensions: [],
            selectedListContentConfig: props.data.listContentConfig.filter(lcc => lcc.isDefault),
            settings: new ProjectSetupSettings().useDefault(),
        }
    }

    public render(): React.ReactElement<ITemplateSelectDialogProps> {
        const { version, onDismiss, data } = this.props
        const { selectedTemplate, selectedListContentConfig, selectedExtensions, settings } = this.state

        return (
            <BaseDialog
                version={version}
                dialogContentProps={{
                    title: strings.TemplateSelectDialogTitle,
                    subText: strings.TemplateSelectDialogInfoText,
                    className: styles.content,
                }}
                modalProps={{ isBlocking: true, isDarkOverlay: true }}
                onDismiss={onDismiss}
                onRenderFooter={this._onRenderFooter.bind(this)}
                containerClassName={styles.templateSelectDialog}>
                <Pivot>
                    <PivotItem headerText={strings.TemplateSelectorTitle} itemIcon='ViewListGroup'>
                        <TemplateSelector
                            templates={data.templates}
                            selectedTemplate={selectedTemplate}
                            onChange={s => this.setState({ selectedTemplate: s })} />
                        {selectedTemplate.listContentConfigIds && <MessageBar messageBarType={MessageBarType.info}>{strings.TemplateListContentConfigText}</MessageBar>}
                    </PivotItem>
                    {data.extensions.length > 0 && (
                        <PivotItem headerText={strings.ExtensionsTitle} itemIcon='ArrangeBringForward'>
                            <ExtensionsSection
                                extensions={data.extensions}
                                selectedExtensions={selectedExtensions}
                                onChange={s => this.setState({ selectedExtensions: s })} />
                        </PivotItem>
                    )}
                    {!selectedTemplate.listContentConfigIds && (
                        <PivotItem headerText={strings.ListContentTitle} itemIcon='ViewList'>
                            <ListContentSection
                                listContentConfig={data.listContentConfig}
                                selectedListContentConfig={selectedListContentConfig}
                                onChange={s => this.setState({ selectedListContentConfig: s })} />
                        </PivotItem>
                    )}
                    <PivotItem headerText={strings.SettingsSectionTitle} itemIcon='ConfigurationSolid'>
                        <SettingsSection settings={settings} onChange={this._onSettingsChanged.bind(this)} />
                    </PivotItem>
                </Pivot>
            </BaseDialog>
        )
    }

    /**
     * Get default template.
     * 
     * The first template that is set to default or the first template retrieved
     */
    private _getDefaultTemplate(): ProjectTemplate {
        let [defaultTemplate] = this.props.data.templates.filter(tmpl => tmpl.isDefault)
        if (!defaultTemplate) defaultTemplate = this.props.data.templates[0]
        return defaultTemplate
    }

    /**
     * On setting change
     * 
     * @param {string} key Key
     * @param {string} bool Bool
     */
    private _onSettingsChanged(key: string, bool: boolean) {
        this.setState({ settings: this.state.settings.set(key, bool) })
    }

    /**
     * On render footrer
     */
    private _onRenderFooter() {
        return (
            <>
                <DefaultButton
                    text={strings.CloseModalText}
                    onClick={this.props.onDismiss}
                    disabled={true} />
                <PrimaryButton
                    text={strings.TemplateSelectDialogSubmitButtonText}
                    iconProps={{ iconName: 'Settings' }}
                    onClick={this._onSubmit.bind(this)} />
            </>
        )
    }

    /**
     * On submit
     */
    private _onSubmit() {
        const data = { ...this.state }
        if (data.selectedTemplate.listContentConfigIds) {
            data.selectedListContentConfig = this.props.data.listContentConfig.filter(lcc => data.selectedTemplate.listContentConfigIds.indexOf(lcc.id) !== -1)
        }
        this.props.onSubmit(data)
    }
}

export { ITemplateSelectDialogProps, ITemplateSelectDialogState }

