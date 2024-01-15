import { FluentIcon } from '@fluentui/react-icons/lib/utils/createFluentIcon'

/**
 * Action type
 *
 * @param {string} text - Action text
 * @param {string | (() => void)} onClick - Action click handler
 * @param {FluentIcon} icon - Action icon
 * @param {boolean} [isDisabled] - Is action disabled
 * @param {boolean} [hasPermission] - Has user permission to execute action?
 *
 * @returns {ActionType} Action type
 */
export type ActionType = [string, string | (() => void), FluentIcon, boolean?, boolean?]
