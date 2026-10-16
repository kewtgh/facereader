(function () {
  var content = document.querySelector('.page__content');
  if (!content || typeof window.renderMathInElement !== 'function') return;
  window.renderMathInElement(content, {
    delimiters: [
      { left: '\\[', right: '\\]', display: true },
      { left: '\\(', right: '\\)', display: false }
    ],
    throwOnError: false,
    trust: false,
    strict: 'ignore'
  });
})();
