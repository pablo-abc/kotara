import { controller, attr } from '@github/catalyst';
import textFit from 'textfit';
import { animate } from 'motion';

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
    }

    #slide-container {
      width: min(100vh, 100vw);
      height: min(90vh, 90vw);
      display: grid;
      place-items: center;
    }

    ::slotted(ul),
    ::slotted(ol) {
      text-align: left;
    }

    ::slotted(*) {
      font-size: 0.6em;
      text-align: center;
    }

    ::slotted(h1) {
      font-size: 1.2em;
    }

    ::slotted(h2) {
      font-size: 1em;
    }

    ::slotted(h3) {
      font-size: 0.8em;
    }

    ::slotted(h4) {
      font-size: 0.7em;
    }

    ::slotted(pre) {
      font-size: 0.23em;
      width: 100%;
      text-align: left;
      max-height: 50vh;
      overflow: auto;
    }

    .textFitted {
      width: 100%;
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

  @attr
  currentIndex = -1;

  get fragments() {
    return Array.from(
      this.querySelectorAll('[data-fragment]')
    ) as HTMLElement[];
  }

  get hasFragments() {
    return this.fragments.length > 0;
  }

  get container() {
    return this.shadowRoot!.querySelector('#slide-container') as HTMLDivElement;
  }

  next(direction: 'horizontal' | 'vertical' = 'horizontal') {
    if (this.hasFragments && this.currentIndex < this.fragments.length - 1) {
      this.currentIndex += 1;
      this.updateURLState();
      return;
    }
    this.dispatchEvent(
      new CustomEvent(`smn-slide:${direction}-forward`, { bubbles: true })
    );
  }

  prev(direction: 'horizontal' | 'vertical' = 'horizontal') {
    if (this.hasFragments && this.currentIndex !== -1) {
      this.currentIndex -= 1;
      this.updateURLState();
      return;
    }
    this.dispatchEvent(
      new CustomEvent(`smn-slide:${direction}-backward`, { bubbles: true })
    );
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).appendChild(
      document.importNode(template.content, true)
    );
    this.handleResize = this.handleResize.bind(this);
    this.handlePopstate = this.handlePopstate.bind(this);
  }

  handleResize() {
    if (this.nofit) return;
    textFit(this.container, { alignVertWithFlexbox: true });
  }

  handlePopstate() {
    this.currentIndex = Number(
      new URLSearchParams(location.search).get('fragment') || -1
    );
  }

  updateURLState() {
    const url = new URL(location.href);
    if (this.currentIndex === -1) {
      url.searchParams.delete('fragment');
    } else {
      url.searchParams.set('fragment', this.currentIndex.toString());
    }
    history.pushState({}, '', url);
  }

  connectedCallback() {
    this.style.visibility = 'hidden';
    this.addEventListener('smn-marked:render', this.handleResize);
    if (!this.nofit) {
      this.handleResize();
      window.addEventListener('resize', this.handleResize);
    }
    this.handlePopstate();
  }

  updateFragmentVisibility() {
    this.fragments.forEach(async (fragment, index) => {
      if (index <= this.currentIndex) {
        if (!fragment.hasAttribute('data-visible')) {
          animate(
            fragment,
            { opacity: [0, 1], x: [-100, 0] },
            { duration: 0.1, easing: 'ease-out', opacity: { easing: 'linear' } }
          );
          fragment.setAttribute('data-visible', '');
        }
      } else {
        if (fragment.hasAttribute('data-visible')) {
          await animate(
            fragment,
            { opacity: 0, x: [0, -100] },
            { duration: 0.1, easing: 'ease-in', opacity: { easing: 'linear' } }
          ).finished;
          fragment.removeAttribute('data-visible');
        }
        fragment.style.opacity = '0';
      }
    });
  }

  async attributeChangedCallback(
    name: string,
    newValue: string,
    oldValue: string
  ) {
    if (newValue === oldValue) return;
    if (name === 'data-visible') {
      if (this.visible) {
        this.style.visibility = 'visible';
        animate(this, { opacity: [0, 1] }, { duration: 0.1, delay: 0.1 });
      } else {
        await animate(this, { opacity: 0 }, { duration: 0.1 }).finished;
        this.style.visibility = 'hidden';
      }
    }
    if (name === 'data-current-index') {
      this.updateFragmentVisibility();
    }
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize);
  }
}
