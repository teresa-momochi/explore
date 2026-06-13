/* ============================================================
   EXPLORE 小小探索家教師手冊 — 互動邏輯
   ============================================================ */

'use strict';

/* ── 頁面導覽系統 ────────────────────────────────────────── */
const Router = (() => {
  let currentPage = 'home';

  function navigate(pageId) {
    // 隱藏所有頁面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // 顯示目標頁面
    const target = document.getElementById('page-' + pageId);
    if (target) {
      target.classList.add('active');
      // 觸發進場動畫
      target.querySelectorAll('.animate-in').forEach((el, i) => {
        el.style.animationDelay = (i * 60) + 'ms';
      });
    }

    // 更新側邊欄 active 狀態
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === pageId);
    });

    // 更新 hash
    history.pushState({ page: pageId }, '', '#' + pageId);
    currentPage = pageId;

    // 捲到頂
    window.scrollTo({ top: 0, behavior: 'instant' });

    // 手機：關閉側邊欄
    closeSidebar();

    // 更新麵包屑
    updateBreadcrumb(pageId);
  }

  function updateBreadcrumb(pageId) {
    const PAGE_NAMES = {
      home:       '首頁',
      philosophy: '課程理念',
      missions:   '五大探索任務',
      lab:        'Explore Lab 學習單',
      safety:     '安全計畫',
      planb:      'Plan B',
      passport:   '探索護照',
      chimei:     '奇美博物館',
      nanke:      '南科考古館＋樹谷園區',
      zuojhen:    '左鎮化石園區',
      hydrogel:   '虹泰水凝膠世界',
      lego:       '創意積木夢工場',
    };

    document.querySelectorAll('.breadcrumb').forEach(bc => {
      const pageName = PAGE_NAMES[pageId] || pageId;
      const isSubPage = ['chimei','nanke','zuojhen','hydrogel','lego'].includes(pageId);
      bc.innerHTML = isSubPage
        ? `<span>教師手冊</span><span class="breadcrumb-sep">›</span><span>${pageName}</span>`
        : `<span>${pageName}</span>`;
    });
  }

  // 支援瀏覽器上下一頁
  window.addEventListener('popstate', e => {
    const page = (e.state && e.state.page) || 'home';
    navigate(page);
  });

  // 初始化：讀取 hash
  function init() {
    const hash = window.location.hash.replace('#', '');
    navigate(hash || 'home');
  }

  return { navigate, init };
})();

/* ── 側邊欄 ──────────────────────────────────────────────── */
function openSidebar() {
  document.querySelector('.sidebar').classList.add('open');
  document.querySelector('.sidebar-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  document.querySelector('.sidebar').classList.remove('open');
  document.querySelector('.sidebar-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

/* ── 深色/淺色模式 ───────────────────────────────────────── */
const Theme = (() => {
  const KEY = 'explore-theme';

  function getPreferred() {
    const saved = localStorage.getItem(KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(KEY, theme);

    // 更新按鈕圖示
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.innerHTML = theme === 'dark'
        ? '<span>☀️</span><span>淺色</span>'
        : '<span>🌙</span><span>深色</span>';
    }
  }

  function toggle() {
    const current = document.documentElement.dataset.theme || 'light';
    apply(current === 'dark' ? 'light' : 'dark');
  }

  function init() { apply(getPreferred()); }

  return { init, toggle };
})();

/* ── Accordion 折疊區塊 ──────────────────────────────────── */
function initAccordions() {
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const isOpen = body.classList.contains('open');

      // 選項：同組只開一個
      const accordion = header.closest('.accordion');
      if (accordion && accordion.dataset.single !== undefined) {
        accordion.querySelectorAll('.accordion-header').forEach(h => {
          h.classList.remove('open');
          if (h.nextElementSibling) h.nextElementSibling.classList.remove('open');
        });
      }

      header.classList.toggle('open', !isOpen);
      body.classList.toggle('open', !isOpen);
    });
  });
}

/* ── 護照印章 ────────────────────────────────────────────── */
function initPassportStamps() {
  const KEY = 'explore-passport';

  function loadStamps() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  }

  function saveStamps(stamps) {
    localStorage.setItem(KEY, JSON.stringify(stamps));
  }

  function render() {
    const earned = loadStamps();
    document.querySelectorAll('.passport-stamp').forEach(stamp => {
      const dest = stamp.dataset.dest;
      stamp.classList.toggle('earned', earned.includes(dest));
    });
  }

  document.querySelectorAll('.passport-stamp').forEach(stamp => {
    stamp.addEventListener('click', () => {
      const dest = stamp.dataset.dest;
      const stamps = loadStamps();
      const idx = stamps.indexOf(dest);
      if (idx >= 0) stamps.splice(idx, 1);
      else stamps.push(dest);
      saveStamps(stamps);
      render();
    });
  });

  render();
}

/* ── 列印功能 ────────────────────────────────────────────── */
function printCurrentPage() {
  // 1. 記錄列印前各 accordion 的展開狀態
  const bodies   = document.querySelectorAll('.accordion-body');
  const headers  = document.querySelectorAll('.accordion-header');
  const bodyWas  = Array.from(bodies).map(b => b.classList.contains('open'));
  const headWas  = Array.from(headers).map(h => h.classList.contains('open'));

  // 2. 全部展開（供列印用）
  bodies.forEach(b  => b.classList.add('open'));
  headers.forEach(h => h.classList.add('open'));

  // 3. 列印完成後精確還原（onafterprint 優先，setTimeout 作為 fallback）
  function restore() {
    bodies.forEach((b, i)  => b.classList.toggle('open', bodyWas[i]));
    headers.forEach((h, i) => h.classList.toggle('open', headWas[i]));
  }

  // onafterprint 在所有主流瀏覽器（Chrome/Safari/Edge/Firefox）均支援
  window.addEventListener('afterprint', restore, { once: true });
  // Fallback：部分舊版 WebView 不觸發 afterprint
  window.addEventListener('focus', restore, { once: true });

  window.print();
}

/* ── 目錄（InPage TOC）高亮 ──────────────────────────────── */
function initScrollSpy() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        document.querySelectorAll('.toc-link').forEach(link => {
          link.classList.toggle('active', link.dataset.target === id);
        });
      }
    });
  }, { threshold: 0.2, rootMargin: '-80px 0px -40% 0px' });

  document.querySelectorAll('[data-spy]').forEach(el => observer.observe(el));
}

/* ── 表格複製按鈕 ────────────────────────────────────────── */
function initCopyButtons() {
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.copy;
      navigator.clipboard.writeText(text).then(() => {
        const original = btn.textContent;
        btn.textContent = '✓ 已複製';
        setTimeout(() => { btn.textContent = original; }, 1500);
      });
    });
  });
}

/* ── 搜尋功能（簡易） ────────────────────────────────────── */
function initSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      document.querySelectorAll('.searchable').forEach(el => {
        el.style.display = '';
      });
      return;
    }
    document.querySelectorAll('.searchable').forEach(el => {
      el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

/* ── 頁面初始化 ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // 主題
  Theme.init();

  // 路由
  Router.init();

  // 側邊欄
  document.querySelector('.menu-toggle')?.addEventListener('click', openSidebar);
  document.querySelector('.sidebar-overlay')?.addEventListener('click', closeSidebar);

  // 主題切換
  document.querySelector('.theme-toggle')?.addEventListener('click', Theme.toggle);

  // 導覽連結
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      Router.navigate(item.dataset.page);
    });
  });

  // Accordion
  initAccordions();

  // 護照印章
  initPassportStamps();

  // 捲動監聽
  initScrollSpy();

  // 複製按鈕
  initCopyButtons();

  // 搜尋
  initSearch();

  // 列印按鈕
  document.querySelectorAll('[data-print]').forEach(btn => {
    btn.addEventListener('click', printCurrentPage);
  });

  // Logo 回首頁
  document.querySelector('.topbar-logo')?.addEventListener('click', e => {
    e.preventDefault();
    Router.navigate('home');
  });
});
