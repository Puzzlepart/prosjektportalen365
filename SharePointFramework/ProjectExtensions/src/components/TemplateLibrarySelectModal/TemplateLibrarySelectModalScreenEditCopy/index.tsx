import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import * as React from 'react';
import * as TemplateSelectorCommandSetStrings from 'TemplateSelectorCommandSetStrings';
import { TemplateFile } from '../../../models';
import { ITemplateLibrarySelectModalScreenEditCopyProps } from './ITemplateLibrarySelectModalScreenEditCopyProps';
import { ITemplateLibrarySelectModalScreenEditCopyState } from './ITemplateLibrarySelectModalScreenEditCopyState';
import styles from './TemplateLibrarySelectModalScreenEditCopy.module.scss';

export default class TemplateLibrarySelectModalScreenEditCopy extends React.Component<ITemplateLibrarySelectModalScreenEditCopyProps, ITemplateLibrarySelectModalScreenEditCopyState> {
    /**
     * Constructor
     * 
     * @param {ITemplateLibrarySelectModalScreenEditCopyProps} props Props
     */
    constructor(props: ITemplateLibrarySelectModalScreenEditCopyProps) {
        super(props);
        this.state = { templates: [...props.selectedTemplates], expandState: {} };
    }

    public render(): React.ReactElement<ITemplateLibrarySelectModalScreenEditCopyProps> {
        const { expandState } = this.state;
        return (
            <div className={styles.templateLibrarySelectModalScreenEditCopy}>
                {this.props.selectedTemplates.map(tmpl => (
                    <div className={styles.item}>
                        <div className={styles.header} onClick={_ => this.onExpandCollapse(tmpl.id)}>
                            <div className={styles.title}>{tmpl.name}</div>
                            <div className={styles.icon}>
                                <Icon iconName={expandState[tmpl.id] ? 'ChevronDown' : 'ChevronUp'} />
                            </div>
                        </div>
                        <div hidden={!expandState[tmpl.id]}>
                            <div className={styles.nameInput}>
                                <TextField
                                    label={TemplateSelectorCommandSetStrings.NameLabel}
                                    placeholder={TemplateSelectorCommandSetStrings.NameLabel}
                                    defaultValue={tmpl.newName}
                                    onChange={(_event, newName) => this.onInputChanged(tmpl.id, { newName })} />
                            </div>
                            <div className={styles.titleInput}>
                                <TextField
                                    label={TemplateSelectorCommandSetStrings.TitleLabel}
                                    placeholder={TemplateSelectorCommandSetStrings.TitleLabel}
                                    defaultValue={tmpl.newTitle}
                                    onChange={(_event, newTitle) => this.onInputChanged(tmpl.id, { newTitle })} />
                            </div>
                        </div>
                    </div>
                ))}
                <div className={styles.actions}>
                    <PrimaryButton text={TemplateSelectorCommandSetStrings.OnStartCopyText} onClick={this.onStartCopy} />
                    <DefaultButton text={TemplateSelectorCommandSetStrings.OnGoBackText} onClick={this.props.onGoBack} />
                </div>
            </div >
        );
    }

    /**
     * On input changed
     * 
     * @param {string} id Id 
     * @param {Object} updatedProperties Updated properties
     */
    private onInputChanged(id: string, updatedProperties: { [key: string]: string }) {
        const { templates } = ({ ...this.state } as ITemplateLibrarySelectModalScreenEditCopyState);
        this.setState({
            templates: templates.map(t => {
                if (t.id === id) {
                    t.newName = updatedProperties.newName || t.newName;
                    t.newTitle = updatedProperties.newTitle || t.newTitle;
                }
                return t;
            })
        });
    }

    /**
     * On expand collapse
     * 
     * @param {string} key Key
     */
    private onExpandCollapse(key: string): void {
        this.setState(({ expandState }) => ({ expandState: { ...expandState, [key]: !expandState[key] } }));
    }

    /**
     * On start copy
     */
    private onStartCopy = () => {
        this.props.onStartCopy(this.state.templates);
        this.setState({ expandState: {}, templates: [] });
    }
}
