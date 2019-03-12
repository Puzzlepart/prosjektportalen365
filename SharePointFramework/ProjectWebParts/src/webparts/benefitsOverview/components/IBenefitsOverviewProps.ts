import { DisplayMode } from '@microsoft/sp-core-library';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { IBenefitsOverviewWebPartProps } from "../BenefitsOverviewWebPart";

export interface IBenefitsOverviewProps extends IBenefitsOverviewWebPartProps {
    context: WebPartContext;
}
