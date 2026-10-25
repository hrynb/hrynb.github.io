'use strict';

// Replace photos or edit these lists to change the preview carousels and album page together.
const photoSets = {
  photography: [
    { src: 'assets/photos/photography-01.webp', caption: '街头一刻', alt: '街道交叉口的红色出租车与行人' },
    { src: 'assets/photos/photography-02.webp', caption: '秋色', alt: '建筑屋檐前的红橙色树叶' },
    { src: 'assets/photos/photography-03.webp', caption: '水面与落叶', alt: '漂浮着落叶和涟漪的水面' },
    { src: 'assets/photos/photography-04.webp', caption: '湖畔', alt: '湖水、草地与树木构成的景色' },
    { src: 'assets/photos/photography-05.webp', caption: '城市纵深', alt: '高楼之间的街道与有轨电车' },
    { src: 'assets/photos/photography-06.webp', caption: '花田与电塔', alt: '蓝天下的黄色花田与输电塔' },
    { src: 'assets/photos/photography-07.webp', caption: '山坡上的马', alt: '草坡上的行人与马匹' },
    { src: 'assets/photos/photography-08.webp', caption: '街角光影', alt: '旧建筑外墙的明暗与路过的行人' },
    { src: 'assets/photos/photography-09.webp', caption: '水中倒影', alt: '水面倒映的树影与天空' },
    { src: 'assets/photos/photography-10.webp', caption: '楼阁', alt: '蓝天白云下的传统楼阁' },
  ],
  sports: [
    { src: 'assets/photos/sports-01.webp', caption: '金牌与跑道', alt: '手持奖牌与背景中的田径场' },
    { src: 'assets/photos/sports-02.webp', caption: '运动会合影', alt: '蓝色帐篷前的运动会合影' },
    { src: 'assets/photos/sports-03.webp', caption: '田径赛事', alt: '田径赛事横幅前的集体合影' },
    { src: 'assets/photos/sports-04.webp', caption: '篮球瞬间', alt: '球馆内的篮球进攻瞬间' },
    { src: 'assets/photos/sports-05.webp', caption: '篮赛纪念', alt: '篮球场边展示的一枚奖牌' },
    { src: 'assets/photos/sports-06.webp', caption: '领奖留影', alt: '运动会背景板前佩戴奖牌的留影' },
    { src: 'assets/photos/sports-07.webp', caption: '赛后合影', alt: '运动会背景板前佩戴奖牌的合影' },
  ],
  daily: [
    { src: 'assets/photos/daily-04.webp', caption: '志愿活动', alt: '田径赛事志愿活动合影' },
    { src: 'assets/photos/daily-01.webp', caption: '支教活动', alt: '支教期间在教室内与小朋友的合影' },
    { src: 'assets/photos/daily-03.webp', caption: '支教活动', alt: '支教期间与小朋友的集体留影' },
    { src: 'assets/photos/daily-02.webp', caption: '体育部工作', alt: '体育部工作中的篮球场合影' },
  ],
};

const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let activeProject = null;

document.querySelectorAll('[data-project-card]').forEach(card => {
  const entry = card.querySelector('.project-entry');
  let pointerInside = false;
  let dismissed = false;
  let lastPointerType = '';
  const controller = {
    close() {
      card.classList.remove('is-cover-open');
      if (activeProject === controller) activeProject = null;
    },
    open() {
      if (dismissed) return;
      if (activeProject && activeProject !== controller) activeProject.close();
      card.classList.add('is-cover-open');
      activeProject = controller;
    },
  };
  card.addEventListener('pointerenter', event => {
    if (!canHover.matches || event.pointerType === 'touch') return;
    pointerInside = true;
    dismissed = false;
    controller.open();
  });
  card.addEventListener('pointerleave', event => {
    if (event.pointerType === 'touch') return;
    pointerInside = false;
    dismissed = false;
    if (!entry.matches(':focus-visible')) controller.close();
  });
  entry.addEventListener('pointerdown', event => { lastPointerType = event.pointerType; });
  entry.addEventListener('focus', () => {
    if (lastPointerType !== 'touch' && entry.matches(':focus-visible')) controller.open();
  });
  entry.addEventListener('blur', () => {
    dismissed = false;
    lastPointerType = '';
    if (!pointerInside) controller.close();
  });
  entry.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    dismissed = true;
    controller.close();
  });
});

document.querySelectorAll('[data-gallery]').forEach(card => {
  const photos = photoSets[card.dataset.gallery];
  if (!photos || !photos.length) return;
  const image = card.querySelector('[data-current-gray]');
  const colorImage = card.querySelector('[data-current-color]');
  const stage = card.querySelector('[data-photo-stage]');
  const caption = card.querySelector('[data-gallery-caption]');
  const counter = card.querySelector('[data-gallery-counter]');
  const error = card.querySelector('[data-gallery-error]');
  let index = 0;
  let requestVersion = 0;
  let transition = null;
  let captionAnimation = null;
  image.addEventListener('error', () => { error.hidden = false; });
  function settleTransition() {
    if (!transition) return;
    const previous = transition;
    transition = null;
    image.src = previous.photo.src;
    image.alt = previous.photo.alt;
    colorImage.src = previous.photo.src;
    previous.animations.forEach(animation => animation.cancel());
    previous.element.remove();
    card.dataset.photoTransition = 'idle';
  }
  function updateMetadata(photo, photoIndex, animate) {
    caption.textContent = photo.caption;
    counter.textContent = `${String(photoIndex + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
    card.dataset.photoIndex = String(photoIndex);
    if (captionAnimation) captionAnimation.cancel();
    if (animate && typeof caption.animate === 'function') {
      captionAnimation = caption.animate(
        [{ opacity: .35, transform: 'translateX(12px)' }, { opacity: 1, transform: 'translateX(0)' }],
        { duration: 320, easing: 'cubic-bezier(.65,0,.35,1)' },
      );
    }
  }
  async function showPhoto(nextIndex) {
    const direction = nextIndex < index ? -1 : 1;
    index = (nextIndex + photos.length) % photos.length;
    const requestedIndex = index;
    const version = ++requestVersion;
    settleTransition();
    const photo = photos[index];
    error.hidden = true;
    const incoming = new Image();
    incoming.decoding = 'async';
    incoming.src = photo.src;
    incoming.alt = photo.alt;
    try {
      await incoming.decode();
    } catch {
      if (version !== requestVersion) return;
      error.hidden = false;
      updateMetadata(photo, requestedIndex, false);
      card.dataset.photoTransition = 'idle';
      return;
    }
    if (version !== requestVersion) return;
    const animate = !reduceMotion.matches && image.complete && image.naturalWidth > 0
      && image.src !== incoming.src && typeof incoming.animate === 'function';
    updateMetadata(photo, requestedIndex, animate);
    if (!animate) {
      image.src = photo.src;
      image.alt = photo.alt;
      colorImage.src = photo.src;
      card.dataset.photoTransition = 'idle';
      return;
    }
    const layer = document.createElement('span');
    layer.className = 'portrait-switch-layer';
    layer.setAttribute('aria-hidden', 'true');
    incoming.className = 'portrait-image portrait-gray';
    incoming.setAttribute('aria-hidden', 'true');
    const incomingColor = incoming.cloneNode();
    incomingColor.className = 'portrait-image portrait-color';
    layer.append(incoming, incomingColor);
    stage.append(layer);
    const startClip = direction > 0
      ? 'inset(0 0 0 100% round 24% 0 0 24%)'
      : 'inset(0 100% 0 0 round 0 24% 24% 0)';
    const timing = { duration: 580, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'both' };
    const enter = layer.animate([
      { clipPath: startClip, transform: `translateX(${direction * 7}%)` },
      { clipPath: 'inset(0)', transform: 'translateX(0)' },
    ], timing);
    transition = { photo, element: layer, animations: [enter] };
    card.dataset.photoTransition = 'running';
    await enter.finished.catch(() => {});
    if (version === requestVersion && transition?.element === layer) settleTransition();
  }
  showPhoto(0);
  card.querySelector('[data-gallery-prev]').addEventListener('click', () => showPhoto(index - 1));
  card.querySelector('[data-gallery-next]').addEventListener('click', () => showPhoto(index + 1));
  card.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    showPhoto(index + (event.key === 'ArrowRight' ? 1 : -1));
  });
  card.addEventListener('focusin', event => card.classList.toggle('has-keyboard-focus', event.target.matches(':focus-visible')));
  card.addEventListener('focusout', event => {
    if (!card.contains(event.relatedTarget)) card.classList.remove('has-keyboard-focus');
  });
  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) {
      settleTransition();
      if (captionAnimation) captionAnimation.cancel();
    }
  });
});

document.querySelectorAll('[data-photo-grid]').forEach(grid => {
  const photos = photoSets[grid.dataset.photoGrid];
  if (!photos) return;
  const figures = photos.map((photo, index) => {
    const figure = document.createElement('figure');
    const link = document.createElement('a');
    link.href = photo.src;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const image = document.createElement('img');
    image.src = photo.src;
    image.alt = photo.alt;
    image.loading = 'lazy';
    image.decoding = 'async';
    const caption = document.createElement('figcaption');
    const number = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0');
    const title = document.createElement('span');
    title.textContent = photo.caption;
    caption.append(number, title);
    link.append(image);
    figure.append(link, caption);
    return figure;
  });
  grid.replaceChildren(...figures);
});

canHover.addEventListener('change', () => {
  if (activeProject) activeProject.close();
});

function buildScenePanels() {
  if (!document.body.classList.contains('home-page')) return;
  document.querySelectorAll('[data-chapter-group]').forEach(chapter => {
    const heading = chapter.querySelector(':scope > .section-heading');
    const items = [...chapter.querySelectorAll(':scope > .project-grid > [data-project-card], :scope > .personal-grid > [data-gallery]')];
    const slots = items.map((item, index) => {
      const slot = document.createElement('article');
      const key = item.dataset.gallery || item.querySelector('.project-entry').getAttribute('href').replace('.html', '');
      slot.className = 'scene-slot';
      slot.id = `scene-${key}`;
      slot.dataset.scene = '';
      slot.dataset.chapter = chapter.id;
      const label = item.querySelector('.project-name, h3').textContent.trim();
      slot.setAttribute('aria-label', label);
      const panel = document.createElement('div');
      panel.className = `screen-panel ${item.hasAttribute('data-gallery') ? 'personal-panel' : 'project-panel'}`;
      const title = index === 0 ? heading : heading.cloneNode(true);
      if (index > 0) title.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      panel.append(title, item);
      slot.append(panel);
      return slot;
    });
    chapter.replaceChildren(...slots);
  });
}

function initializeSections() {
  const sections = [...document.querySelectorAll('[data-scene]')];
  const header = document.querySelector('.home-page .site-header');
  const progress = document.querySelector('[data-section-progress]');
  if (!sections.length || !header || !progress) return;
  const root = document.documentElement;
  const links = sections.map((section, index) => {
    const link = document.createElement('a');
    const title = section.querySelector('.project-name, h3') || section.querySelector('h1, h2');
    link.href = `#${section.id}`;
    link.textContent = String(index + 1).padStart(2, '0');
    link.setAttribute('aria-label', title.textContent.trim());
    link.title = title.textContent.trim();
    progress.append(link);
    return link;
  });
  let targets = [];
  let sceneHeight = 1;
  let lastY = window.scrollY;
  let lastDirection = 1;
  let lastSettledIndex = 0;
  let touchActive = false;
  let tweenFrame = 0;
  let paintFrame = 0;
  let settleTimer = 0;
  let resizeTimer = 0;
  let programmatic = false;

  function nearestIndex(y = window.scrollY) {
    return targets.reduce((best, target, index) => Math.abs(target - y) < Math.abs(targets[best] - y) ? index : best, 0);
  }
  function paint() {
    if (!targets.length) return;
    const index = nearestIndex();
    sections.forEach((section, number) => section.classList.toggle('is-active', number === index));
    links.forEach((link, number) => {
      link.classList.toggle('is-current', number === index);
      if (number === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    header.querySelectorAll('a[href^="#"]').forEach(link => {
      const hash = link.getAttribute('href').slice(1);
      link.classList.toggle('is-current', hash === sections[index].dataset.chapter || hash === sections[index].id);
    });
    root.dataset.sceneIndex = String(index);
    root.dataset.sceneAligned = String(Math.abs(targets[index] - window.scrollY) < 2);
    header.classList.toggle('has-scrolled', window.scrollY > 8);
  }
  function schedulePaint() {
    if (paintFrame) return;
    paintFrame = window.requestAnimationFrame(() => { paintFrame = 0; paint(); });
  }
  function cancelTween() {
    if (tweenFrame) window.cancelAnimationFrame(tweenFrame);
    tweenFrame = 0;
    programmatic = false;
    window.clearTimeout(settleTimer);
    root.dataset.sceneScrollState = 'free';
  }
  function goTo(index, instant = false) {
    cancelTween();
    const start = window.scrollY;
    const target = targets[index];
    if (instant || reduceMotion.matches || Math.abs(target - start) < 1) {
      window.scrollTo({ top: target, behavior: 'instant' });
      lastY = target;
      lastSettledIndex = index;
      root.dataset.sceneScrollState = 'idle';
      paint();
      return;
    }
    const began = performance.now();
    const duration = Math.min(1050, Math.max(650, 600 + Math.abs(target - start) * .24));
    programmatic = true;
    root.dataset.sceneScrollState = 'settling';
    function tick(now) {
      const t = Math.min(1, (now - began) / duration);
      const eased = t * t * t * (t * (t * 6 - 15) + 10);
      window.scrollTo({ top: start + (target - start) * eased, behavior: 'instant' });
      paint();
      if (t < 1) tweenFrame = window.requestAnimationFrame(tick);
      else {
        tweenFrame = 0;
        programmatic = false;
        window.scrollTo({ top: target, behavior: 'instant' });
        lastY = target;
        lastSettledIndex = index;
        root.dataset.sceneScrollState = 'idle';
        paint();
      }
    }
    tweenFrame = window.requestAnimationFrame(tick);
  }
  function maybeSettle() {
    if (programmatic || touchActive || reduceMotion.matches || !targets.length) return;
    const index = nearestIndex();
    const delta = targets[index] - window.scrollY;
    if (Math.abs(delta) < 2) {
      lastSettledIndex = index;
      root.dataset.sceneScrollState = 'idle';
      paint();
      return;
    }
    const approaching = delta * lastDirection >= 0;
    if (Math.abs(delta) <= Math.min(180, sceneHeight * .26)
      && (approaching || index !== lastSettledIndex || Math.abs(delta) < 24)) goTo(index);
  }
  function scheduleSettle() {
    window.clearTimeout(settleTimer);
    if (!programmatic && !touchActive) settleTimer = window.setTimeout(maybeSettle, 210);
  }
  function sceneForHash(hash) {
    const target = document.getElementById(hash.replace(/^#/, ''));
    if (!target) return -1;
    const scene = target.matches('[data-scene]') ? target : target.querySelector('[data-scene]') || target.closest('[data-scene]');
    return sections.indexOf(scene);
  }
  function measure() {
    const oldHeight = sceneHeight;
    const oldY = window.scrollY;
    const oldIndex = targets.length ? nearestIndex() : 0;
    const aligned = targets.length && Math.abs(targets[oldIndex] - oldY) < 3;
    cancelTween();
    const headerHeight = Math.ceil(header.getBoundingClientRect().height);
    sceneHeight = Math.max(1, window.innerHeight - headerHeight);
    root.style.setProperty('--header-height', `${headerHeight}px`);
    root.style.setProperty('--scene-height', `${sceneHeight}px`);
    root.style.setProperty('--scene-gap', `${Math.max(10, Math.min(30, Math.round(sceneHeight * .035)))}px`);
    targets = sections.map(section => Math.max(0, section.getBoundingClientRect().top + window.scrollY - headerHeight));
    sections.forEach(section => {
      const panel = section.querySelector(':scope > .screen-panel');
      panel.classList.remove('has-inner-overflow');
      if (panel.scrollHeight > panel.clientHeight + 2) panel.classList.add('has-inner-overflow');
    });
    if (root.dataset.sceneReady === 'true') {
      const restored = aligned ? targets[oldIndex] : Math.min(targets.at(-1), oldY / oldHeight * sceneHeight);
      window.scrollTo({ top: restored, behavior: 'instant' });
    }
    lastY = window.scrollY;
    paint();
  }
  function scheduleMeasure() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(measure, 140);
  }
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (!programmatic && Math.abs(y - lastY) > .5) lastDirection = Math.sign(y - lastY);
    lastY = y;
    schedulePaint();
    if (!programmatic) scheduleSettle();
  }, { passive: true });
  window.addEventListener('wheel', event => {
    if (event.deltaY) lastDirection = Math.sign(event.deltaY);
    cancelTween();
    scheduleSettle();
  }, { passive: true });
  window.addEventListener('touchstart', () => { touchActive = true; cancelTween(); }, { passive: true });
  window.addEventListener('touchend', () => { touchActive = false; scheduleSettle(); }, { passive: true });
  window.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.target.closest('button,input,textarea,select')) return;
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) cancelTween();
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.classList.contains('skip-link') || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const hash = link.getAttribute('href');
    const index = sceneForHash(hash);
    if (index < 0) return;
    event.preventDefault();
    try { history.pushState(null, '', hash); } catch { /* Local-file history can be restricted by the browser. */ }
    goTo(index);
  });
  window.addEventListener('hashchange', () => {
    const index = sceneForHash(location.hash);
    if (index >= 0) goTo(index);
  });
  window.addEventListener('resize', scheduleMeasure, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(scheduleMeasure).observe(header);
  reduceMotion.addEventListener('change', () => { cancelTween(); paint(); });
  measure();
  const initial = location.hash ? sceneForHash(location.hash) : 0;
  goTo(initial >= 0 ? initial : 0, true);
  root.classList.add('scene-layout-ready');
  root.dataset.sceneReady = 'true';
}

function watchDecoration(entry, onChange = () => {}) {
  let pointerInside = false;
  let keyboardFocus = false;
  let visible = !('IntersectionObserver' in window);
  function update() {
    const pointerActive = pointerInside && canHover.matches;
    const active = visible && !document.hidden && (pointerActive || keyboardFocus);
    entry.classList.toggle('has-decoration', active);
    onChange(active, pointerActive);
  }
  entry.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch') return;
    pointerInside = true;
    update();
  });
  entry.addEventListener('pointerleave', () => { pointerInside = false; update(); });
  entry.addEventListener('focus', () => { keyboardFocus = entry.matches(':focus-visible'); update(); });
  entry.addEventListener('blur', () => { keyboardFocus = false; update(); });
  canHover.addEventListener('change', () => { pointerInside = false; update(); });
  reduceMotion.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    update();
  }).observe(entry);
  update();
}

function initializeDecorations() {
  document.querySelectorAll('[data-music-notes]').forEach(container => {
    const entry = container.closest('.project-entry');
    const pointer = { x: 0, y: 0 };
    const positions = [];
    const notes = Array.from({ length: 6 }, (_, index) => {
      const note = document.createElement('span');
      note.className = 'music-note';
      note.textContent = index % 2 ? '♫' : '♪';
      note.style.setProperty('--note-size', `${22 + index % 3 * 4}px`);
      note.style.opacity = String(.48 - index * .045);
      container.append(note);
      positions.push({ x: 0, y: 0, vx: 0, vy: 0 });
      return note;
    });
    let frame = 0;
    let lastTime = 0;
    function locate(event) {
      if (event.pointerType === 'touch' || !canHover.matches || reduceMotion.matches) return;
      const box = entry.getBoundingClientRect();
      pointer.x = event.clientX - box.left;
      pointer.y = event.clientY - box.top;
    }
    function place(index, x, y, rotation = 0) {
      const clampedX = Math.max(5, Math.min(entry.clientWidth - 35, x));
      const clampedY = Math.max(4, Math.min(entry.clientHeight - 38, y));
      notes[index].style.transform = `translate3d(${clampedX.toFixed(2)}px, ${clampedY.toFixed(2)}px, 0) rotate(${rotation.toFixed(2)}deg)`;
    }
    function destination(index, now) {
      const spread = Math.min(1, entry.clientWidth / 700, entry.clientHeight / 300);
      const insetX = 150 * spread + 24, insetY = 72 * spread + 22;
      const centerX = Math.max(insetX, Math.min(entry.clientWidth - insetX, pointer.x));
      const centerY = Math.max(insetY, Math.min(entry.clientHeight - insetY - 20, pointer.y - 22));
      const angle = now * .00046 + index * 2.399963 + Math.sin(now * .00031 + index * 1.8) * .7;
      return {
        x: centerX + (Math.cos(angle) * (50 + index * 15) + Math.sin(now * .0008 + index * 1.3) * 18) * spread,
        y: centerY + (Math.sin(angle) * (30 + index % 3 * 14) + Math.cos(now * .00055 + index * 1.7) * 12) * spread,
      };
    }
    function tick(now) {
      const delta = (lastTime ? Math.min(40, now - lastTime) : 16) / 1000;
      lastTime = now;
      positions.forEach((position, index) => {
        const target = destination(index, now);
        const attraction = 6 + index * .55;
        const damping = Math.exp(-(2.8 + index * .14) * delta);
        // Each note has its own drifting target and inertia, rather than following the previous note.
        position.vx = (position.vx + (target.x - position.x) * attraction * delta) * damping;
        position.vy = (position.vy + (target.y - position.y) * attraction * delta) * damping;
        position.x += position.vx * delta;
        position.y += position.vy * delta;
        place(index, position.x, position.y, Math.sin(now * .0007 + index * 1.6) * 22);
      });
      frame = requestAnimationFrame(tick);
    }
    entry.addEventListener('pointerenter', locate);
    entry.addEventListener('pointermove', locate, { passive: true });
    watchDecoration(entry, (active, pointerActive) => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      container.dataset.following = 'false';
      if (!active) return;
      if (reduceMotion.matches || !pointerActive) {
        notes.forEach((_, index) => place(index, entry.clientWidth - 48 - index * 24, 32 + index % 2 * 18));
        return;
      }
      const now = performance.now();
      positions.forEach((position, index) => { Object.assign(position, destination(index, now), { vx: 0, vy: 0 }); });
      container.dataset.following = 'true';
      frame = requestAnimationFrame(tick);
    });
  });
  document.querySelectorAll('[data-candles]').forEach(canvas => {
    const entry = canvas.closest('.project-entry');
    const context = canvas.getContext('2d');
    if (!context) return;
    const pitch = 20;
    const interval = 1250;
    let width = 0, height = 0, pixelRatio = 0, timer = 0, active = false, step = 0;
    let seed = 741;
    const candles = [];
    const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
    function append() {
      const open = candles.at(-1)?.close ?? 100;
      const close = 100 + (open - 100) * .84 + (random() - .5) * 8;
      candles.push({ open, close, high: Math.max(open, close) + random() * 4, low: Math.min(open, close) - random() * 4 });
    }
    function draw() {
      if (!width || !height || !candles.length) return;
      const low = Math.min(...candles.map(candle => candle.low)) - 4;
      const high = Math.max(...candles.map(candle => candle.high)) + 4;
      const palette = getComputedStyle(document.documentElement);
      const upColor = palette.getPropertyValue('--chart-up').trim();
      const downColor = palette.getPropertyValue('--chart-down').trim();
      context.globalAlpha = 1;
      context.clearRect(0, 0, width, height);
      context.strokeStyle = palette.getPropertyValue('--chart-grid').trim(); context.lineWidth = .6;
      for (const fraction of [.25, .5, .75]) {
        context.beginPath(); context.moveTo(0, height * fraction); context.lineTo(width, height * fraction); context.stroke();
      }
      const margin = (width - candles.length * pitch) / 2;
      for (let x = margin + pitch / 2; x < width; x += pitch) {
        context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
      }
      const y = price => 12 + (high - price) / (high - low) * (height - 24);
      candles.forEach((candle, index) => {
        const x = margin + index * pitch + 6;
        context.globalAlpha = index === candles.length - 1 ? 1 : .84;
        context.strokeStyle = context.fillStyle = candle.close >= candle.open ? upColor : downColor;
        context.lineWidth = 1;
        context.beginPath(); context.moveTo(x + 4, y(candle.high)); context.lineTo(x + 4, y(candle.low)); context.stroke();
        context.fillRect(x, Math.min(y(candle.open), y(candle.close)), 8, Math.max(2, Math.abs(y(candle.open) - y(candle.close))));
      });
      canvas.dataset.frames = String(Number(canvas.dataset.frames || 0) + 1);
      canvas.dataset.step = String(step);
      canvas.dataset.offset = String(step * pitch);
    }
    function stop() {
      window.clearTimeout(timer);
      timer = 0;
      canvas.dataset.playing = 'false';
    }
    function updatePlayback() {
      stop();
      if (!active || reduceMotion.matches || !width || !height) return;
      canvas.dataset.playing = 'true';
      // Hold a complete bar in place; each new bar shifts the series by exactly one grid cell.
      timer = window.setTimeout(() => {
        candles.shift();
        append();
        step++;
        draw();
        updatePlayback();
      }, interval);
    }
    function resize() {
      const nextWidth = canvas.clientWidth, nextHeight = canvas.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (width === nextWidth && height === nextHeight && pixelRatio === dpr) return;
      width = nextWidth; height = nextHeight; pixelRatio = dpr;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(1, Math.floor(width / pitch));
      while (candles.length < count) append();
      while (candles.length > count) candles.shift();
      draw();
      updatePlayback();
    }
    resize();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    window.addEventListener('themechange', draw);
    watchDecoration(entry, enabled => { active = enabled; updatePlayback(); });
  });
  document.querySelectorAll('[data-energy-bars]').forEach(chart => watchDecoration(chart.closest('.project-entry')));
}

function initializeCopy() {
  const button = document.querySelector('[data-copy-email]');
  if (!button) return;
  const status = document.querySelector('[data-copy-status]');
  const email = '24307100006@m.fudan.edu.cn';
  function fallbackCopy() {
    const field = document.createElement('textarea');
    field.value = email;
    field.readOnly = true;
    field.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none';
    document.body.append(field);
    try {
      field.focus({ preventScroll: true });
      field.select();
      return document.execCommand('copy');
    } finally {
      field.remove();
      button.focus({ preventScroll: true });
    }
  }
  button.addEventListener('click', async () => {
    button.setAttribute('aria-busy', 'true');
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(email); copied = true; }
      else copied = fallbackCopy();
    } catch { try { copied = fallbackCopy(); } catch { copied = false; } }
    button.setAttribute('aria-busy', 'false');
    status.textContent = copied ? '邮箱已复制。' : '复制未成功，请允许浏览器访问剪贴板后重试。';
    button.dataset.copied = String(copied);
  });
}

buildScenePanels();
initializeSections();
initializeDecorations();
initializeCopy();
document.documentElement.dataset.interactiveReady = 'true';
