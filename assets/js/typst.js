// Typst highlighting, because GitHub Pages cannot do it.
//
// Pages builds with github-pages 232, which pins Rouge 3.30; Rouge only learned Typst in its 4.x
// line, so a ```typ block arrives here as plain text.  The alternative to this file is moving the
// site to an Actions build with a Gemfile of our own, which is a lot of machinery for one lexer.
//
// The spans below carry Rouge's own class names, so the colours come from the same code.css that
// styles every other language, and light and dark follow the rest of the page with nothing further
// to maintain.

(function () {
  "use strict";

  var KEYWORDS = new Set([
    "let", "set", "show", "import", "include", "as", "if", "else", "for", "while",
    "in", "return", "break", "continue", "context", "none", "auto", "true", "false",
    "and", "or", "not",
  ]);

  // One pass, longest-first: a `//` inside a string must not start a comment, and a quote inside a
  // comment must not start a string, which is exactly what a single alternation buys.
  var TOKEN = new RegExp([
    "(/\\*[\\s\\S]*?\\*/|//[^\\n]*)",              // 1 comment
    '("(?:[^"\\\\\\n]|\\\\.)*")',                  // 2 string
    "(<[A-Za-z_][A-Za-z0-9_-]*>)",                 // 3 label
    "(#?[A-Za-z_][A-Za-z0-9_-]*)(?=\\s*\\()",      // 4 call
    "(#[A-Za-z_][A-Za-z0-9_-]*)",                  // 5 hash word
    "([A-Za-z_][A-Za-z0-9_-]*)(?=\\s*:)",          // 6 named argument
    "([A-Za-z_][A-Za-z0-9_-]*)",                   // 7 bare word
    "([+-]?\\d+(?:\\.\\d+)?(?:pt|mm|cm|in|em|deg|fr|%)?)", // 8 number, with or without a unit
    "([\\[\\]{}(),;:.]|=>|=|\\.\\.)",              // 9 punctuation
  ].join("|"), "g");

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function span(cls, text) {
    return '<span class="' + cls + '">' + escapeHtml(text) + "</span>";
  }

  function highlight(source) {
    var out = "";
    var last = 0;
    var m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(source)) !== null) {
      out += escapeHtml(source.slice(last, m.index));
      last = TOKEN.lastIndex;
      if (m[1]) {
        out += span("c", m[1]);
      } else if (m[2]) {
        out += span("s", m[2]);
      } else if (m[3]) {
        out += span("nl", m[3]);
      } else if (m[4]) {
        // `#let` and friends read as keywords even where a call follows.
        out += span(KEYWORDS.has(m[4].replace(/^#/, "")) ? "k" : "nf", m[4]);
      } else if (m[5]) {
        out += span(KEYWORDS.has(m[5].slice(1)) ? "k" : "nf", m[5]);
      } else if (m[6]) {
        out += span("na", m[6]);
      } else if (m[7]) {
        out += span(KEYWORDS.has(m[7]) ? "k" : "n", m[7]);
      } else if (m[8]) {
        out += span("m", m[8]);
      } else if (m[9]) {
        out += span("p", m[9]);
      }
    }
    out += escapeHtml(source.slice(last));
    return out;
  }

  function run() {
    var blocks = document.querySelectorAll(
      'pre > code.language-typ, pre > code.language-typst'
    );
    Array.prototype.forEach.call(blocks, function (code) {
      if (code.dataset.highlighted) { return; }
      code.dataset.highlighted = "1";
      code.innerHTML = highlight(code.textContent);
      // Rouge wraps its output in `.highlight`, and the stylesheet keys off that; a block Rouge
      // passed through has no such wrapper, so it gets one here.
      var pre = code.parentNode;
      if (!pre.parentNode.classList.contains("highlight")) {
        var wrapper = document.createElement("div");
        wrapper.className = "highlight";
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
