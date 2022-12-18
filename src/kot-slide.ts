import { controller, attr } from '@github/catalyst';
import { animate } from 'motion';

type VisibilityFragment = { element: HTMLElement; action: 'fade' };

type HighlightFragment = {
  element: HTMLElement;
  action: 'highlight';
  lines: string;
};

type Fragment = VisibilityFragment | HighlightFragment;

const template = document.createElement('template');

function getHighlightedSelector(lines: string) {
  const range = lines.split('-').map((v) => Number(v));
  let selector = '[data-line]';
  if (range.length > 1) {
    for (let i = range[0]; i <= range[1]; i++) {
      selector += `:not([data-line="${i}"])`;
    }
  } else {
    selector += `:not([data-line="${range[0]}])`;
  }
  return selector;
}

function updateHighlightedLines(element: HTMLElement, line: string) {
  const selector = getHighlightedSelector(line);
  const allLines = element.querySelectorAll(
    '[data-line]'
  ) as NodeListOf<HTMLElement>;
  const fadedLines = element.querySelectorAll(
    selector
  ) as NodeListOf<HTMLElement>;
  allLines.forEach((line) => {
    line.style.transition = 'opacity 0.1s';
    line.style.opacity = '';
    line.dataset.highlighted = '';
  });
  fadedLines.forEach((line) => {
    line.style.opacity = '0.4';
    delete line.dataset.highlighted;
  });

  document
    .querySelector('[data-highlighted]')
    ?.scrollIntoView({ behavior: 'smooth' });
}

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
      min-width: min(100vh, 100vw);
      min-height: min(90vh, 90vw);
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    ::slotted(ul),
    ::slotted(ol) {
      text-align: left;
    }

    ::slotted(*) {
      font-size: 2.6rem;
      text-align: center;
      margin: 0;
    }

    ::slotted(h1) {
      font-size: 5.5em;
    }

    ::slotted(h2) {
      font-size: 5em;
    }

    ::slotted(h3) {
      font-size: 4.5em;
    }

    ::slotted(h4) {
      font-size: 4em;
    }

    ::slotted(pre),
    ::slotted(kot-code) {
      padding: 0;
      margin: 0;
      font-size: 1.2em;
      text-align: left;
      max-height: 20em;
      overflow: auto;
      padding: 1em;
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
export class KotSlideElement extends HTMLElement {
  @attr
  visible = false;

  @attr
  currentIndex = -1;

  @attr
  lineIndex = -1;

  get container() {
    return this.shadowRoot!.querySelector('#slide-container') as HTMLDivElement;
  }

  get fragments(): Fragment[] {
    return (
      Array.from(this.querySelectorAll('[data-fragment]')) as HTMLElement[]
    ).flatMap((fragment) => {
      switch (fragment.dataset.fragment) {
        case 'code':
          const lines = fragment.dataset.lineNumbers
            ?.split(',')
            .map((line) =>
              line ? line : `1-${this.querySelectorAll('[data-line]').length}`
            );
          if (!lines) return [];
          const initialLine = lines.shift();
          if (initialLine) updateHighlightedLines(fragment, initialLine);
          return lines.map((line) => {
            return {
              element: fragment,
              action: 'highlight',
              lines: line,
            } as Fragment;
          });
        default:
          return { element: fragment, action: 'fade' } as Fragment;
      }
    });
  }

  get hasFragments() {
    return this.fragments.length > 0;
  }

  get progress() {
    if (this.fragments.length === 0) return 0;
    return (this.currentIndex + 1) / this.fragments.length;
  }

  next(direction: 'horizontal' | 'vertical' = 'horizontal') {
    if (this.hasFragments && this.currentIndex < this.fragments.length - 1) {
      this.currentIndex += 1;
      this.updateURLState();
      return;
    }
    this.dispatchEvent(
      new CustomEvent(`kot-slide:${direction}-forward`, { bubbles: true })
    );
  }

  prev(direction: 'horizontal' | 'vertical' = 'horizontal') {
    if (this.hasFragments && this.currentIndex !== -1) {
      this.currentIndex -= 1;
      this.updateURLState();
      return;
    }
    this.dispatchEvent(
      new CustomEvent(`kot-slide:${direction}-backward`, { bubbles: true })
    );
  }

  observer!: ResizeObserver;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).appendChild(
      document.importNode(template.content, true)
    );
    this.updateFragmentVisibility = this.updateFragmentVisibility.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handlePopstate = this.handlePopstate.bind(this);
    this.observer = new ResizeObserver(this.handleResize);
  }

  originalSize?: { width: number; height: number };

  handleResize() {
    const rect = this.container.getBoundingClientRect();
    const slideRect = this.getBoundingClientRect();
    if (!this.originalSize) this.originalSize = rect;
    const ratioH = slideRect.height / this.originalSize.height;
    const ratioW = slideRect.width / this.originalSize.width;
    const min = Math.min(ratioH, ratioW);
    this.container.style.transform = `scale(${min})`;
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
    this.handlePopstate();
    this.observer.observe(this);
    this.addEventListener('kot-code:render', this.updateFragmentVisibility);
    requestAnimationFrame(() => {
      this.handleResize();
      window.addEventListener('resize', this.handleResize);
    });
  }

  async #handleVisibilityFragment(fragment: VisibilityFragment, index: number) {
    const element = fragment.element;
    if (index <= this.currentIndex) {
      if (!element.hasAttribute('data-visible')) {
        animate(
          element,
          { opacity: [0, 1], x: [-100, 0] },
          {
            duration: 0.1,
            easing: 'ease-out',
            opacity: { easing: 'linear' },
          }
        );
        element.setAttribute('data-visible', '');
      }
    } else {
      if (element.hasAttribute('data-visible')) {
        await animate(
          element,
          { opacity: 0, x: [0, -100] },
          {
            duration: 0.1,
            easing: 'ease-in',
            opacity: { easing: 'linear' },
          }
        ).finished;
        element.removeAttribute('data-visible');
      }
      element.style.opacity = '0';
    }
  }

  updateFragmentVisibility() {
    // TODO: call somehow updateHighlightedLightedLines when
    // fragment is removed
    this.fragments.forEach(async (fragment, index) => {
      if (fragment.action === 'fade') {
        this.#handleVisibilityFragment(fragment, index);
      }
      if (fragment.action === 'highlight' && index === this.currentIndex) {
        updateHighlightedLines(fragment.element, fragment.lines);
      }
    });
  }

  async attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string
  ) {
    if (newValue === oldValue) return;
    if (name === 'data-visible') {
      if (this.visible) {
        this.style.visibility = 'visible';
        animate(this, { opacity: [0, 1] }, { duration: 0.1, delay: 0.1 });
        this.updateFragmentVisibility();
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
    this.removeEventListener('kot-code:render', this.updateFragmentVisibility);
    this.observer.disconnect();
  }
}
