import { KotSlideElement } from './kot-slide';
import { controller } from '@github/catalyst';
import { animate } from 'motion';

import './kot-progress';

const NEXT_KEYS = ['ArrowRight', 'Space', 'KeyL'];

const PREV_KEYS = ['ArrowLeft', 'KeyH'];

const template = document.createElement('template');

template.innerHTML = /* HTML */ `
  <style>
    #progressbar,
    kot-progress {
      width: 100vw;
      position: fixed;
      bottom: 0;
    }
  </style>
  <slot id="default"></slot>
  <kot-progress data-value="0"></kot-progress>
`;

@controller
export class KotPresentationElement extends HTMLElement {
  get #defaultSlot() {
    return this.shadowRoot!.querySelector('#default') as HTMLSlotElement;
  }

  get slides() {
    const slides = this.#defaultSlot
      .assignedElements()
      .filter((node) => node instanceof KotSlideElement) as KotSlideElement[];
    return slides;
  }

  #currentIndex = 0;
  set currentIndex(value: number) {
    this.#currentIndex = value;
    this.updateHidden();
  }

  get currentIndex() {
    return this.#currentIndex;
  }

  get currentSlide() {
    return this.slides[this.#currentIndex];
  }

  get shownSlides() {
    return Array.from(
      this.querySelectorAll('kot-slide[data-visible]')
    ) as KotSlideElement[];
  }

  get progressBar() {
    return this.shadowRoot!.querySelector(
      'kot-progress'
    ) as HTMLKotProgressBarElement;
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).appendChild(
      document.importNode(template.content, true)
    );
    this.handleKeyup = this.handleKeyup.bind(this);
    this.handlePopstate = this.handlePopstate.bind(this);

    this.addEventListener('kot-slide:horizontal-forward', () => {
      if (this.currentIndex < this.slides.length - 1) {
        this.currentIndex += 1;
        this.updateURLState();
        this.currentSlide.updateURLState();
      }
    });

    this.addEventListener('kot-slide:horizontal-backward', () => {
      if (this.currentIndex !== 0) {
        this.currentIndex -= 1;
        this.updateURLState();
        this.currentSlide.updateURLState();
      }
    });
  }

  updateURLState() {
    const url = new URL(location.href);
    if (this.currentIndex === 0) {
      url.searchParams.delete('slide');
    } else {
      url.searchParams.set('slide', this.currentIndex.toString());
    }
    url.searchParams.delete('fragment');
    history.pushState({}, '', url);
  }

  handleKeyup(event: KeyboardEvent) {
    if (NEXT_KEYS.includes(event.code)) {
      this.currentSlide.next();
    }
    if (PREV_KEYS.includes(event.code)) {
      this.currentSlide.prev();
    }
    this.updateProgress();
  }

  handlePopstate() {
    this.currentIndex = Number(
      new URLSearchParams(location.search).get('slide') || 0
    );
    this.updateProgress();
  }

  updateProgress() {
    const initialValue = this.progressBar.value;
    const targetValue = (this.currentIndex / (this.slides.length - 1)) * 100;
    animate(
      (progress: number) => {
        this.progressBar.value =
          (targetValue - initialValue) * progress + initialValue;
      },
      {
        duration: 0.1,
        easing: 'ease-in-out',
      }
    );
  }

  updateHidden() {
    this.shownSlides.forEach((slide) => {
      if (slide === this.currentSlide) return;
      slide.removeAttribute('data-visible');
    });
    this.currentSlide.setAttribute('data-visible', '');
  }

  connectedCallback() {
    document.body.style.padding = '0';
    document.body.style.margin = '0';
    document.addEventListener('keyup', this.handleKeyup);
    window.addEventListener('popstate', this.handlePopstate);
    setTimeout(() => this.handlePopstate());
  }

  disconnectedCallback() {
    document.removeEventListener('keyup', this.handleKeyup);
    window.removeEventListener('popstate', this.handlePopstate);
  }
}
