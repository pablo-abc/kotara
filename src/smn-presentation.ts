import { SmnSlideElement } from './smn-slide';
import { controller } from '@github/catalyst';

const NEXT_KEYS = ['ArrowRight', 'Space'];

const PREV_KEYS = ['ArrowLeft'];

const template = document.createElement('template');

template.innerHTML = /* HTML */ `
  <style>
    #progressbar {
      width: 100vw;
      position: fixed;
      bottom: 0;
    }
  </style>
  <slot></slot>
  <progress id="progressbar" max="100" value="0"></progress>
`;

@controller
export class SmnPresentationElement extends HTMLElement {
  slides: SmnSlideElement[] = [];

  #currentIndex = 0;
  set currentIndex(value: number) {
    this.#currentIndex = value;
    this.updateHidden();
  }

  get currentIndex() {
    return this.#currentIndex;
  }

  #currentFragment = -1;
  set currentFragment(value: number) {
    this.#currentFragment = value;
    this.updateFragments();
  }

  get currentFragment() {
    return this.#currentFragment;
  }

  get currentSlide() {
    return this.slides[this.#currentIndex];
  }

  get shownSlides() {
    return Array.from(
      this.querySelectorAll('smn-slide[data-visible]')
    ) as SmnSlideElement[];
  }

  get progressBar() {
    return this.shadowRoot!.querySelector(
      '#progressbar'
    ) as HTMLProgressElement;
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).appendChild(
      document.importNode(template.content, true)
    );
    this.handleKeyup = this.handleKeyup.bind(this);
    this.addEventListener('smn-slide:connect', (event: Event) => {
      const target = event.target as SmnSlideElement;
      if (this.slides.length !== 0) {
        target.removeAttribute('data-visible');
      }
      this.slides.push(target);
    });
    this.currentIndex = Number(
      new URLSearchParams(location.search).get('slide') || 0
    );
  }

  handleKeyup(event: KeyboardEvent) {
    if (NEXT_KEYS.includes(event.code)) {
      if (
        this.currentSlide.hasFragments &&
        this.currentFragment < this.currentSlide.fragments.length - 1
      ) {
        this.currentFragment += 1;
      } else if (this.currentIndex < this.slides.length - 1) {
        this.currentIndex += 1;
        this.currentFragment = -1;
      }
    }
    if (PREV_KEYS.includes(event.code)) {
      if (this.currentSlide.hasFragments && this.currentFragment !== -1) {
        this.currentFragment -= 1;
      } else if (this.currentIndex !== 0) {
        this.currentIndex -= 1;
        this.currentFragment = this.currentSlide.fragments.length - 1;
      }
    }
    this.updateProgress();
  }

  updateProgress() {
    this.progressBar.value =
      (this.currentIndex / (this.slides.length - 1)) * 100;
  }

  #updateHiddenTimeout?: number;
  updateHidden() {
    this.shownSlides.forEach((slide) => slide.removeAttribute('data-visible'));
    if (this.#updateHiddenTimeout) clearTimeout(this.#updateHiddenTimeout);
    this.#updateHiddenTimeout = setTimeout(() => {
      this.currentSlide.setAttribute('data-visible', '');
    }, 200);
  }

  updateFragments() {
    this.currentSlide.fragments.forEach((fragment, index) => {
      if (index <= this.currentFragment) {
        fragment.setAttribute('data-visible', '');
      } else {
        fragment.removeAttribute('data-visible');
      }
    });
  }

  connectedCallback() {
    document.body.style.padding = '0';
    document.body.style.margin = '0';
    document.addEventListener('keyup', this.handleKeyup);
  }

  disconnectedCallback() {
    document.removeEventListener('keyup', this.handleKeyup);
  }
}
