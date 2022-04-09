import { controller } from '@github/catalyst';

@controller
export class SmnFragmentElement extends HTMLElement {
  connectedCallback() {
    this.dispatchEvent(new CustomEvent('smn:connect'));
  }
}
