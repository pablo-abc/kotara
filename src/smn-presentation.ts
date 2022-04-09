import type { SmnSlideElement } from './smn-slide';
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

  get shownSlides() {
    return Array.from(
      this.querySelectorAll('smn-slide:not([hidden])')
    ) as SmnSlideElement[];
  }

  get progressBar() {
    return this.shadowRoot!.querySelector(
      '#progressbar'
    ) as HTMLProgressElement;
  }

  observer!: MutationObserver;

  handleMutation() {
    this.slides = Array.from(this.querySelectorAll('smn-slide'));
    this.updateHidden();
  }
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).appendChild(
      document.importNode(template.content, true)
    );
    this.handleKeyup = this.handleKeyup.bind(this);
    this.handleMutation = this.handleMutation.bind(this);
    this.observer = new MutationObserver(this.handleMutation);
    this.currentIndex = Number(
      new URLSearchParams(location.search).get('slide') || 0
    );
  }

  handleKeyup(event: KeyboardEvent) {
    if (NEXT_KEYS.includes(event.code)) {
      if (this.currentIndex < this.slides.length - 1) {
        this.currentIndex += 1;
      }
    }
    if (PREV_KEYS.includes(event.code)) {
      if (this.currentIndex !== 0) {
        this.currentIndex -= 1;
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
    this.shownSlides.forEach((slide) => (slide.hidden = true));
    if (this.#updateHiddenTimeout) clearTimeout(this.#updateHiddenTimeout);
    this.#updateHiddenTimeout = setTimeout(() => {
      this.slides[this.currentIndex].hidden = false;
    }, 200);
  }

  connectedCallback() {
    this.handleMutation();
    this.observer.observe(this, { childList: true });
    document.body.style.padding = '0';
    document.body.style.margin = '0';
    document.addEventListener('keyup', this.handleKeyup);
  }

  disconnectedCallback() {
    this.observer.disconnect();
    document.removeEventListener('keyup', this.handleKeyup);
  }
}
