import { Web } from '@pnp/sp';
import { TypedHash } from '@pnp/common';

export class HelpContentModel {
  public title: string;
  public urlPattern: string;
  public text: string;
  public resource: { Url: string, Description: string };

  constructor(spItem: TypedHash<any>, public web: Web) {
    this.title = spItem.Title;
    this.urlPattern = spItem['URLpattern'];
    this.text = spItem['Content'];
    this.resource = spItem['ResourceUrl'];
  }

  public matchPattern(url: string): boolean {
    return decodeURIComponent(url).indexOf(this.urlPattern) !== -1;
  }
}
