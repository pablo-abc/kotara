import { controller, attr } from '@github/catalyst';
import textFit from 'textfit';

const template = document.createElement('template');

template.innerHTML = /* HTML */ `
  <style>
    :host {
      display: grid;
      place-items: center;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      opacity: 1;
      transition: opacity 0.1s;
    }

    :host(:not([data-visible])) {
      display: grid;
      opacity: 0;
    }

    #slide-container {
      width: min(90vh, 90vw);
      height: min(90vh, 90vw);
    }

    ::slotted(ul),
    ::slotted(ol) {
      text-align: left;
    }
  </style>
  <section id="slide-container">
    <slot></slot>
  </section>
`;

@controller
export class SmnSlideElement extends HTMLElement {
  @attr
  nofit = false;

  @attr
  visible = false;

  fragments: HTMLElement[] = [];

  get hasFragments() {
    return this.fragments.length > 0;
  }

  get container() {
    return this.shadowRoot!.querySelector('#slide-container') as HTMLDivElement;
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).appendChild(
      document.importNode(template.content, true)
    );
    this.handleResize = this.handleResize.bind(this);
    this.addEventListener('smn-fragment:connect', (event: Event) => {
      const target = event.target as HTMLElement;
      this.fragments.push(target);
    });
  }

  handleResize() {
    textFit(this.container, { alignHoriz: true, alignVert: true });
  }

  connectedCallback() {
    this.dispatchEvent(new CustomEvent('smn-slide:connect', { bubbles: true }));
    if (!this.nofit) {
      this.handleResize();
      window.addEventListener('resize', this.handleResize);
    }
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize);
  }
}
