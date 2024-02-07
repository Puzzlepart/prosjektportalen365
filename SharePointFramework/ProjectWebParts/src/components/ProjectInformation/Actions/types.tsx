import { FluentIcon } from '@fluentui/react-icons/lib/utils/createFluentIcon'

/**
 * Action type
 *
 * @param {string} text - Action text
 * @param {string | (() => void)} onClickOrHref - Action click handler or href
 * @param {FluentIcon} icon - Action icon
 * @param {boolean} [disabled] - Disabled action
 * @param {boolean} [hidden] - Hidden action
 *
 * @returns {ActionType} Action type
 */

export type ActionType = [string, string | (() => void), FluentIcon, boolean?, boolean?]
