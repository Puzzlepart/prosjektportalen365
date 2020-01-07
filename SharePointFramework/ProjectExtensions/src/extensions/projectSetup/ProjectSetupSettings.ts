import * as strings from 'ProjectExtensionsStrings';
import { IToggleProps } from 'office-ui-fabric-react/lib/Toggle';

export interface IProjectSetupSettings<T> {
    includeStandardFolders?: T;
    copyPlannerTasks?: T;
    includePortfolioAdministrators?: T;
}

export class ProjectSetupSettings {
    private _labels: IProjectSetupSettings<string> = {
        includeStandardFolders: strings.IncludeStandardFoldersLabel,
        copyPlannerTasks: strings.CopyPlannerTasksLabel,
        includePortfolioAdministrators: strings.IncludePortfolioAdministratorsLabel,
    };
    private _descriptions: IProjectSetupSettings<string> = {
        includeStandardFolders: strings.IncludeStandardFoldersDescription,
        copyPlannerTasks: strings.CopyPlannerTasksDescription,
        includePortfolioAdministrators: strings.IncludePortfolioAdministratorsDescription,
    };
    private _values: IProjectSetupSettings<boolean> = {};

    public useDefault() {
        this._values = { includeStandardFolders: false, copyPlannerTasks: true, includePortfolioAdministrators: true };
        return this;
    }

    public get values(): IProjectSetupSettings<boolean> {
        return this._values;
    }

    public get keys(): string[] {
        return Object.keys(this._values);
    }

    public getToggleProps(key: string): IToggleProps {
        return {
            id: key,
            label: this._labels[key],
            title: this._descriptions[key],
            defaultChecked: this._values[key],
            disabled: key === 'includeStandardFolders',
        };
    }

    /**
     * Set setting
     * 
     * @param {string} key Key
     * @param {bool} bool Bool
     */
    public set(key: string, bool: boolean): ProjectSetupSettings {
        this._values[key] = bool;
        return this;
    }
}
