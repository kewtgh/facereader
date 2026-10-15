(function () {
  function ready() {
    const directory = document.getElementById('tag-directory');
    if (!directory) return;
    const query = document.getElementById('tag-directory-query');
    const groups = [...directory.querySelectorAll('.tag-group')];
    const links = [...directory.querySelectorAll('.tag-filter-btn')];
    const posts = [...document.querySelectorAll('.tag-post-item')];
    const tags = new Map(posts.map(post => [post, JSON.parse(post.dataset.tags)]));
    const pageSize = 12;
    let selected = new URLSearchParams(location.search).get('tag') || '';
    let limit = pageSize;
    let groupState = null;
    const language = () => document.documentElement.getAttribute('data-fr-ui-lang') === 'en' ? 'en' : 'zh';
    const english = () => language() === 'en';
    const mobile = window.matchMedia('(max-width: 63.99em)');
    const more = document.getElementById('tag-posts-more');
    directory.open = !mobile.matches;
    directory.classList.add('is-enhanced');
    mobile.addEventListener('change', () => { directory.open = !mobile.matches; });

    function matches() { return posts.filter(post => !selected || tags.get(post).includes(selected)); }

    function render() {
      const filtered = matches();
      const visible = new Set(filtered.slice(0, limit));
      posts.forEach(post => { post.hidden = !visible.has(post); });
      links.forEach(link => {
        link.classList.toggle('is-active', link.dataset.tag === selected);
        if (link.dataset.tag === selected) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
      document.getElementById('current-tag').textContent = selected || (english() ? 'All essays' : '全部文章');
      document.getElementById('current-tag-count').textContent = english() ? `${filtered.length} essays` : `${filtered.length} 篇文章`;
      const active = links.find(link => link.dataset.tag === selected);
      const description = document.getElementById('current-tag-description');
      description.textContent = active?.dataset.description || '';
      description.hidden = !description.textContent;
      document.getElementById('tag-filter-reset').hidden = !selected;
      document.getElementById('tag-posts-empty').hidden = filtered.length > 0;
      more.hidden = filtered.length <= limit;
      const shown = Math.min(limit, filtered.length);
      document.getElementById('tag-posts-progress').textContent = english() ? `Showing ${shown} of ${filtered.length} essays` : `已显示 ${shown} / ${filtered.length} 篇`;
    }

    function filter(tag, push) {
      selected = tag;
      limit = pageSize;
      if (push) {
        const url = new URL(location.href);
        if (tag) url.searchParams.set('tag', tag);
        else url.searchParams.delete('tag');
        url.hash = '';
        history.pushState(null, '', url);
      }
      render();
      const active = links.find(link => link.dataset.tag === selected);
      if (active) active.closest('.tag-group').open = true;
      if (push) {
        if (mobile.matches) directory.open = false;
        const heading = document.getElementById('current-tag');
        heading.focus({ preventScroll: true });
        const anchor = document.getElementById('current-tag-anchor');
        const bounds = anchor.getBoundingClientRect();
        if (mobile.matches || bounds.top < 100 || bounds.top > innerHeight - 100) {
          anchor.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        }
      }
    }

    function search() {
      const value = query.value.trim().toLocaleLowerCase();
      if (value && !groupState) groupState = new Map(groups.map(group => [group, group.open]));
      let count = 0;
      groups.forEach(group => {
        let groupCount = 0;
        group.querySelectorAll('.tag-filter-btn').forEach(link => {
          const found = !value || `${link.dataset.tag} ${link.dataset.description}`.toLocaleLowerCase().includes(value);
          link.hidden = !found;
          if (found) groupCount += 1;
        });
        group.hidden = groupCount === 0;
        group.querySelector('.tag-group-count').textContent = groupCount;
        if (value && groupCount) group.open = true;
        if (!value && groupState) group.open = groupState.get(group);
        count += groupCount;
      });
      if (!value) groupState = null;
      document.getElementById('tag-directory-empty').hidden = count > 0;
      const uniqueCount = new Set(links.filter(link => !link.hidden).map(link => link.dataset.tag)).size;
      document.getElementById('tag-directory-status').textContent = english() ? `${uniqueCount} tags${value ? ' found' : ' available'}` : `${value ? '找到' : '共'} ${uniqueCount} 个标签`;
    }

    directory.addEventListener('click', event => {
      const link = event.target.closest('.tag-filter-btn');
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      filter(link.dataset.tag, true);
    });
    document.getElementById('tag-filter-reset').addEventListener('click', () => filter('', true));
    more.addEventListener('click', () => {
      const filtered = matches();
      const next = filtered[limit];
      limit += pageSize;
      render();
      next?.querySelector('h3 a')?.focus({ preventScroll: true });
    });
    query.addEventListener('input', search);
    window.addEventListener('popstate', () => filter(new URLSearchParams(location.search).get('tag') || '', false));
    document.addEventListener('facereader:ui-language', () => { render(); search(); });
    filter(selected, false);
    search();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
