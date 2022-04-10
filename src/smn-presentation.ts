import { SmnSlideElement } from './smn-slide';
import { controller } from '@github/catalyst';
import { animate } from 'motion';

const NEXT_KEYS = ['ArrowRight', 'Space', 'KeyL'];

const PREV_KEYS = ['ArrowLeft', 'KeyH'];

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

    this.addEventListener('smn-slide:horizontal-forward', () => {
      if (this.currentIndex < this.slides.length - 1) {
        this.currentIndex += 1;
      }
    });
    this.addEventListener('smn-slide:horizontal-backward', () => {
      if (this.currentIndex !== 0) {
        this.currentIndex -= 1;
      }
    });
  }

  handleKeyup(event: KeyboardEvent) {
    console.log(event);
    if (NEXT_KEYS.includes(event.code)) {
      if (this.currentIndex < this.slides.length - 1) {
        this.currentSlide.next();
      }
    }
    if (PREV_KEYS.includes(event.code)) {
      if (this.currentIndex !== 0) {
        this.currentSlide.prev();
      }
    }
    this.updateProgress();
  }

  updateProgress() {
    const initialValue = this.progressBar.value;
    const targetValue = (this.currentIndex / (this.slides.length - 1)) * 100;
    animate(
      (progress) => {
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
    this.shownSlides.forEach((slide) => slide.removeAttribute('data-visible'));
    this.currentSlide.setAttribute('data-visible', '');
  }

  connectedCallback() {
    document.body.style.padding = '0';
    document.body.style.margin = '0';
    document.addEventListener('keyup', this.handleKeyup);
    setTimeout(() => {
      this.currentIndex = Number(
        new URLSearchParams(location.search).get('slide') || 0
      );
    });
  }

  disconnectedCallback() {
    document.removeEventListener('keyup', this.handleKeyup);
  }
}
