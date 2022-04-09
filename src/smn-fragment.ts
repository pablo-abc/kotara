import { controller, attr } from '@github/catalyst';

const template = document.createElement('template');

template.innerHTML = /* HTML */ `
  <style>
    :host {
      display: inline-block;
      opacity: 1;
      transition: opacity 0.1s;
    }

    :host(:not([data-visible])) {
      display: inline-block;
      opacity: 0;
    }
  </style>
  <slot></slot>
`;

@controller
export class SmnFragmentElement extends HTMLElement {
  @attr
  visible = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).appendChild(
      document.importNode(template.content, true)
    );
  }

  connectedCallback() {
    this.setAttribute('data-fragment', '');
  }
}
