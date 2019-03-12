import * as React from 'react';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import { IStatusSectionBaseProps } from './IStatusSectionBaseProps';
import { IStatusSectionBaseState } from './IStatusSectionBaseState';
import StatusSectionField from '../StatusSectionField';

export default class StatusSectionBase<P extends IStatusSectionBaseProps, S extends IStatusSectionBaseState> extends React.Component<P, S> {
    constructor(props: P) {
        super(props);
    }

    public render(): React.ReactElement<P> {
        return null;
    }

    @autobind
    public renderFields() {
        if (this.props.fieldNames) {
            const { entityFields, entityItem } = this.props;
            return this.props.fieldNames.map(fieldName => {
                const [fld] = entityFields.filter(ef => ef.InternalName === fieldName);
                if (fld) {
                    return <StatusSectionField label={fld.Title} value={entityItem[fieldName]} />;
                }
                return null;
            });
        }
        return null;
    }
}
