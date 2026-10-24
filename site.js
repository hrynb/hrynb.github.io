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
let activePreview = null;
let positionFrame = 0;

function positionPreview(controller) {
  if (controller.panel.hidden) return;
  const anchor = controller.trigger.getBoundingClientRect();
  if (anchor.bottom < 0 || anchor.top > window.innerHeight) {
    controller.close();
    return;
  }
  const bounds = controller.panel.getBoundingClientRect();
  const margin = 14;
  const left = Math.max(margin, Math.min(anchor.left, window.innerWidth - bounds.width - margin));
  const above = anchor.top - bounds.height - 12;
  const preferredTop = controller.isGallery && !canHover.matches
    ? window.innerHeight - bounds.height - margin
    : (above >= margin ? above : anchor.bottom + 12);
  const top = Math.max(margin, Math.min(preferredTop, window.innerHeight - bounds.height - margin));
  controller.panel.style.left = `${Math.round(left)}px`;
  controller.panel.style.top = `${Math.round(top)}px`;
}

function createPreview(card, trigger, panel, isGallery = false) {
  let closeTimer = 0;
  let pointerInside = false;
  let dismissed = false;
  let lastPointerType = '';
  const controller = {
    card, trigger, panel, isGallery,
    open() {
      if (dismissed) return;
      window.clearTimeout(closeTimer);
      if (activePreview && activePreview !== controller) activePreview.close();
      panel.hidden = false;
      card.classList.add('is-preview-open');
      if (isGallery) trigger.setAttribute('aria-expanded', 'true');
      activePreview = controller;
      positionPreview(controller);
    },
    close({ restoreFocus = false, dismiss = false } = {}) {
      window.clearTimeout(closeTimer);
      dismissed = dismiss;
      const focusWasInside = panel.contains(document.activeElement);
      panel.hidden = true;
      card.classList.remove('is-preview-open');
      if (isGallery) trigger.setAttribute('aria-expanded', 'false');
      if (activePreview === controller) activePreview = null;
      if (restoreFocus && focusWasInside) trigger.focus({ preventScroll: true });
    },
  };
  function scheduleClose() {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      if (!pointerInside && !card.contains(document.activeElement)) controller.close();
    }, 220);
  }
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
    scheduleClose();
  });
  trigger.addEventListener('pointerdown', event => { lastPointerType = event.pointerType; });
  card.addEventListener('focusin', event => {
    if (panel.contains(event.target) || (lastPointerType !== 'touch' && event.target.matches(':focus-visible'))) {
      controller.open();
    }
  });
  card.addEventListener('focusout', event => {
    if (!card.contains(event.relatedTarget)) {
      dismissed = false;
      lastPointerType = '';
      scheduleClose();
    }
  });
  if (isGallery) {
    trigger.addEventListener('click', event => {
      if (!canHover.matches && event.detail > 0 && panel.hidden) {
        event.preventDefault();
        dismissed = false;
        controller.open();
      }
    });
    panel.querySelector('[data-preview-close]').addEventListener('click', () => {
      controller.close({ restoreFocus: true, dismiss: true });
    });
  }
  return controller;
}

document.querySelectorAll('[data-project-card]').forEach(card => {
  createPreview(card, card.querySelector('.project-entry'), card.querySelector('.project-preview'));
});

document.querySelectorAll('[data-gallery]').forEach(card => {
  const photos = photoSets[card.dataset.gallery];
  if (!photos || !photos.length) return;
  const trigger = card.querySelector('.gallery-trigger');
  const panel = card.querySelector('.gallery-popover');
  const image = panel.querySelector('[data-gallery-image]');
  const caption = panel.querySelector('[data-gallery-caption]');
  const counter = panel.querySelector('[data-gallery-counter]');
  const error = panel.querySelector('[data-gallery-error]');
  let index = 0;
  image.addEventListener('load', () => {
    error.hidden = true;
    image.classList.remove('is-changing');
    void image.offsetWidth;
    image.classList.add('is-changing');
  });
  image.addEventListener('error', () => { error.hidden = false; });
  function showPhoto(nextIndex) {
    index = (nextIndex + photos.length) % photos.length;
    const photo = photos[index];
    error.hidden = true;
    image.alt = photo.alt;
    image.src = photo.src;
    caption.textContent = photo.caption;
    counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
    panel.dataset.photoIndex = String(index);
  }
  showPhoto(0);
  const cover = card.querySelector('.photo-cover');
  cover.src = photos[0].src;
  cover.alt = photos[0].alt;
  createPreview(card, trigger, panel, true);
  panel.querySelector('[data-gallery-prev]').addEventListener('click', () => showPhoto(index - 1));
  panel.querySelector('[data-gallery-next]').addEventListener('click', () => showPhoto(index + 1));
  card.addEventListener('keydown', event => {
    if (panel.hidden || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    showPhoto(index + (event.key === 'ArrowRight' ? 1 : -1));
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

document.addEventListener('pointerdown', event => {
  if (activePreview && !activePreview.card.contains(event.target)) activePreview.close();
});
document.addEventListener('focusin', event => {
  if (activePreview && !activePreview.card.contains(event.target)) activePreview.close();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && activePreview) {
    event.preventDefault();
    activePreview.close({ restoreFocus: true, dismiss: true });
  }
});
function repositionActive() {
  if (!activePreview || positionFrame) return;
  positionFrame = window.requestAnimationFrame(() => {
    positionFrame = 0;
    if (activePreview) positionPreview(activePreview);
  });
}
window.addEventListener('resize', repositionActive, { passive: true });
window.addEventListener('scroll', repositionActive, { passive: true });
document.documentElement.dataset.interactiveReady = 'true';
