import { controller, attr } from '@github/catalyst';

const template = document.createElement('template');

template.innerHTML = /* HTML */ `
  <style>
    :host {
      display: block;
      width: 100%;
    }

    #base {
      width: 100%;
    }

    #bar {
      background-color: var(--progress-color, deepskyblue);
      height: var(--progress-height, 4px);
      width: 100%;
      transform-origin: left;
    }
  </style>
  <div id="base" role="progressbar" part="base">
    <div id="bar" part="bar"></div>
  </div>
`;

@controller
export class KotProgressElement extends HTMLElement {
  @attr value = 0;

  get barElement() {
    return this.shadowRoot!.querySelector('#bar') as HTMLDivElement;
  }

  get baseElement() {
    return this.shadowRoot!.querySelector('#base') as HTMLDivElement;
  }

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.appendChild(template.content.cloneNode(true));
  }

  attributeChangedCallback(name: string, _: any, value: string) {
    if (name === 'data-value') {
      this.barElement.style.transform = `scaleX(${value}%)`;
      this.baseElement.setAttribute('aria-valuenow', value);
    }
  }
}

declare global {
  type HTMLKotProgressBarElement = KotProgressElement;
}
