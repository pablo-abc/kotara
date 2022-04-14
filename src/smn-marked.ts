import { controller } from '@github/catalyst';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/a11y-dark.css';

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

marked.use({
  renderer: {
    code(code, infostring) {
      if (!infostring) return /* HTML */ `<pre><code>${code}</code></pre>`;
      const [lang] = infostring.split(' ');
      return /* HTML */ `
        <pre class="hljs"><code class="${lang}">${highlight(
          code,
          lang
        )}</code></pre>
      `;
    },
  },
});

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
    if (!this.#parsed) this.#parsed = marked.parse(this.markdown);
    return this.#parsed;
  }

  connectedCallback() {
    if (!loaded) {
      document.head.appendChild(styleTemplate.content.cloneNode(true));
      loaded = true;
    }
    this.style.display = 'none';
    template.innerHTML = this.parsed;
    this.parentElement?.insertBefore(template.content, this.nextElementSibling);
    this.dispatchEvent(new CustomEvent('smn-marked:render', { bubbles: true }));
    this.parentElement?.removeChild(this);
  }
}
