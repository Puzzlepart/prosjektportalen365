import { IPanelProps } from "@fluentui/react";

export interface IBasePanelProps<T extends string = string> extends IPanelProps {
    /**
     * The type of the panel. Used for deciding if the
     * panel should be open or not.
     */
    $type?: T
}
