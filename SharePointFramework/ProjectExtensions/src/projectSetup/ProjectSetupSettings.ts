import { IToggleProps } from 'office-ui-fabric-react/lib/Toggle'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IProjectSetupSettings<T> { }

export class ProjectSetupSettings {
  private _labels: IProjectSetupSettings<string> = {}
  private _descriptions: IProjectSetupSettings<string> = {}
  private _values: IProjectSetupSettings<boolean> = {}

  public useDefault() {
    this._values = {}
    return this
  }

  public get values(): IProjectSetupSettings<boolean> {
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
      disabled: false,
    }
  }

  /**
   * Set setting
   *
   * @param {string} key Key
   * @param {bool} bool Bool
   */
  public set(key: string, bool: boolean): ProjectSetupSettings {
    this._values[key] = bool
    return this
  }
}
