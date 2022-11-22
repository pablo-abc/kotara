import { controller, attr } from '@github/catalyst';
import hljs from 'highlight.js';

function highlight(code: string, lang: string) {
  try {
    const { value } = hljs.highlight(code, { language: lang });
    return value
      .split('\n')
      .map((v, index) => `<span data-line="${index + 1}">${v}</span>`)
      .join('\n');
  } catch {
    return code;
  }
}

let loaded = false;
const styleTemplate = document.createElement('template');

styleTemplate.innerHTML = /* HTML */ `
  <style>
    pre.hljs {
      counter-reset: line;
    }
    [data-line]::before {
      counter-increment: line;
      content: counter(line) ' ';
      opacity: 0.5;
    }
  </style>
`;

const template = document.createElement('template');

@controller
export class KotCodeElement extends HTMLElement {
  @attr lineNumbers = '';

  get #code() {
    const script = this.querySelector(
      'script[type^="text/"]'
    ) as HTMLScriptElement;
    const lang = script.type.split('/')[1];
    const lines = (script.textContent || '').split('\n').slice(1, -1);
    const indentation = lines[0].match(/^ +/)?.[0].length;
    const code = lines
      .map((line) => {
        if (!indentation) return line;
        return line.substring(indentation);
      })
      .join('\n');
    return /* HTML */ `
      <pre
        class="hljs"
        data-fragment="code"
        data-line-numbers="${this.lineNumbers}"
      ><code class="${lang}">${highlight(code, lang)}</code></pre>
    `;
  }

  connectedCallback() {
    if (!loaded) {
      document.head.appendChild(styleTemplate.content.cloneNode(true));
      loaded = true;
    }
    this.style.display = 'none';

    template.innerHTML = this.#code;
    this.parentElement?.insertBefore(template.content, this.nextElementSibling);
    this.dispatchEvent(new CustomEvent('kot-code:render', { bubbles: true }));
    this.parentElement?.removeChild(this);
  }
}
