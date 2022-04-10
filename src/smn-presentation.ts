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
  get slides() {
    return Array.from(this.querySelectorAll('smn-slide')) as SmnSlideElement[];
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
    this.handlePopstate = this.handlePopstate.bind(this);

    this.addEventListener('smn-slide:horizontal-forward', () => {
      if (this.currentIndex < this.slides.length - 1) {
        this.currentIndex += 1;
        this.updateURLState();
        this.currentSlide.updateURLState();
      }
    });

    this.addEventListener('smn-slide:horizontal-backward', () => {
      if (this.currentIndex !== 0) {
        this.currentIndex -= 1;
        this.updateURLState();
        this.currentSlide.updateURLState();
      }
    });
  }

  updateURLState() {
    const url = new URL(location.href);
    url.searchParams.set('slide', this.currentIndex.toString());
    url.searchParams.delete('fragment');
    history.pushState({}, '', url);
  }

  handleKeyup(event: KeyboardEvent) {
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
    setTimeout(() => {
      this.handlePopstate();
    });
  }

  disconnectedCallback() {
    document.removeEventListener('keyup', this.handleKeyup);
    window.removeEventListener('popstate', this.handlePopstate);
  }
}
