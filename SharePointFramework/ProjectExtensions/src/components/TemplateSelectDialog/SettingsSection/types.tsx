import { ProjectSetupSettings } from '../../../extensions/projectSetup/ProjectSetupSettings'

export interface ISettingsSectionProps {
  /**
   * Settings
   */
  settings: ProjectSetupSettings

  /**
   * On setting change
   *
   * @param key Key
   * @param bool Bool
   */
  onChange: (key: string, bool: boolean) => void
}
