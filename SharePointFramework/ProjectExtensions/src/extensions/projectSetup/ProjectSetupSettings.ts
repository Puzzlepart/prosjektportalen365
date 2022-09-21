import { IToggleProps } from 'office-ui-fabric-react/lib/Toggle'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IProjectSetupSettings {}

export class ProjectSetupSettings {
  private _labels: IProjectSetupSettings = {}
  private _descriptions: IProjectSetupSettings = {}
  private _values: IProjectSetupSettings = {}

  public useDefault() {
    this._values = {}
    return this
  }

  public get values(): IProjectSetupSettings {
    return this._values
  }

  public get keys(): string[] {
    return Object.keys(this._values)
  }

  public getToggleProps(key: string): IToggleProps {
    return {
      id: key,
      label: this._labels[key],
      title: this._descriptions[key],
      defaultChecked: this._values[key],
      disabled: false
    }
  }

  /**
   * Set setting
   *
   * @param key Key
   * @param bool Bool
   */
  public set(key: string, bool: boolean): ProjectSetupSettings {
    this._values[key] = bool
    return this
  }
}
