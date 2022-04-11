import { controller } from '@github/catalyst';
import { marked } from 'marked';
import hljs from 'highlight.js';

marked.setOptions({
  highlight: function (code, lang) {
    try {
      return hljs.highlight(code, { language: lang }).value;
    } catch {
      return code;
    }
  },
});

@controller
export class SmnMarkedElement extends HTMLElement {
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
    if (!this.#parsed)
      this.#parsed = marked
        .parse(this.markdown)
        .replaceAll('<pre>', '<pre class="hljs">');
    return this.#parsed;
  }

  connectedCallback() {
    this.style.display = 'none';
    const template = document.createElement('template');
    template.innerHTML = this.parsed;
    this.parentElement?.insertBefore(template.content, this.nextElementSibling);
    this.dispatchEvent(new CustomEvent('smn-marked:render', { bubbles: true }));
    this.parentElement?.removeChild(this);
  }
}
