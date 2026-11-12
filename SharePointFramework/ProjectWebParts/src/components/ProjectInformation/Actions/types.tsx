import { FluentIcon } from '@fluentui/react-icons/lib/utils/createFluentIcon'

/** Action label, click handler or destination, and icon shown beneath project information. */

export type ActionType = [string, string | (() => void), FluentIcon, boolean?, boolean?]
