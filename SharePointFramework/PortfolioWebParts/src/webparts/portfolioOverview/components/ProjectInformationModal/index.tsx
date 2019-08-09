import { Modal } from 'office-ui-fabric-react/lib/Modal';
import * as React from 'react';
import ProjectInformation from '../../../../../../ProjectWebParts/lib/webparts/projectInformation/components/ProjectInformation';
import { IProjectInformationModalProps } from './IProjectInformationModalProps';

export class ProjectInformationModal extends React.Component<IProjectInformationModalProps, {}> {
    public render() {
        return (
            <Modal isOpen={true}>
                <ProjectInformation
                    title={this.props.title}
                    entity={{ webUrl: this.props.siteAbsoluteUrl, ...this.props.entity }}
                    webUrl={this.props.siteAbsoluteUrl}
                    hubSiteUrl={this.props.siteAbsoluteUrl}
                    siteId={this.props.siteId}
                    hideActions={true}
                    filterField={this.props.filterField} />
            </Modal>
        );
    }
}