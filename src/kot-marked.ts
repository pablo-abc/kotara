import { controller } from '@github/catalyst';
import { marked } from 'marked';

import './kot-code';

marked.use({
  renderer: {
    code(code, infostring) {
      if (!infostring) return /* HTML */ `<pre><code>${code}</code></pre>`;
      const [lang, linesMatch] = infostring.split(' ');
      const lines = linesMatch
        .match(/\[(.*)\]/)?.[1]
        .split('|')
        .join(',');
      return `
        <kot-code data-line-numbers="${lines}">
          <script type="text/${lang}">${code}</script>
        </kot-code>
      `;
    },
  },
});

const template = document.createElement('template');

@controller
export class KotMarkedElement extends HTMLElement {
  get markdown() {
    const script = document.querySelector(
      'script[type="text/markdown"]'
    ) as HTMLScriptElement;
    const lines = (script.textContent || '').split('\n').slice(1, -1);
    const indentation = lines[0].match(/^ +/)?.[0].length;
    return lines
      .map((line) => {
        if (!indentation) return line;
        return line.substring(indentation);
      })
      .join('\n');
  }

  #parsed?: string;
  get parsed() {
    if (!this.#parsed) this.#parsed = marked.parse(this.markdown);
    return this.#parsed;
  }

  connectedCallback() {
    this.style.display = 'none';
    template.innerHTML = this.parsed;
    this.parentElement?.insertBefore(template.content, this.nextElementSibling);
    this.dispatchEvent(new CustomEvent('kot-marked:render', { bubbles: true }));
    this.parentElement?.removeChild(this);
  }
}
