(() => {
  'use strict';
  // Approved Dreamina Seedance export; keep the GPT still as the normal poster/fallback.
  const HERO_SCROLL_VIDEO = { src: './assets/generated/lp-field-hero-scroll-cropped.mp4', poster: './assets/generated/lp-field-hero.webp' };
  const scrollTrack = document.querySelector('.hero-scroll-track');
  const scrollVideo = scrollTrack?.querySelector('.hero-scroll-video');
  const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const saveData = Boolean(navigator.connection?.saveData);
  let scrollFrame = 0;
  let videoReady = false;
  let seekInFlight = false;
  let pendingTime = null;
  let mediaListenersAttached = false;
  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function reduceMotion() { return Boolean(motionQuery?.matches); }
  function heroNearViewport() {
    if (!scrollTrack) return false;
    const rect = scrollTrack.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight * 1.1;
  }
  function hasUsableSeekRange() {
    if (!scrollVideo?.seekable?.length) return false;
    try {
      const last = scrollVideo.seekable.length - 1;
      return Number.isFinite(scrollVideo.seekable.start(last)) && Number.isFinite(scrollVideo.seekable.end(last)) && scrollVideo.seekable.end(last) > scrollVideo.seekable.start(last);
    } catch (_) { return false; }
  }
  function commitPendingSeek() {
    if (!videoReady || seekInFlight || pendingTime === null || !scrollVideo) return;
    const target = pendingTime;
    pendingTime = null;
    if (Math.abs(scrollVideo.currentTime - target) <= 0.012) return;
    seekInFlight = true;
    try { scrollVideo.currentTime = target; } catch (_) { seekInFlight = false; disableScrollVideo(); }
  }
  function updateScrollVideo() {
    scrollFrame = 0;
    if (!videoReady || !scrollTrack || !scrollVideo) return;
    const hero = scrollTrack.querySelector('.hero');
    const range = Math.max(1, scrollTrack.offsetHeight - (hero?.offsetHeight || window.innerHeight));
    const progress = clamp((window.scrollY - scrollTrack.offsetTop) / range, 0, 1);
    pendingTime = clamp(progress * scrollVideo.duration, 0, scrollVideo.duration);
    commitPendingSeek();
  }
  function queueScrollVideo() {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollVideo);
  }
  function disableScrollVideo() {
    videoReady = false;
    seekInFlight = false;
    pendingTime = null;
    if (scrollFrame) { window.cancelAnimationFrame(scrollFrame); scrollFrame = 0; }
    scrollTrack?.classList.remove('is-video');
    scrollVideo?.pause();
    window.removeEventListener('scroll', queueScrollVideo);
    window.removeEventListener('resize', queueScrollVideo);
    window.removeEventListener('scroll', maybeEnableScrollVideo);
    window.removeEventListener('resize', maybeEnableScrollVideo);
    if (scrollVideo?.src) { scrollVideo.removeAttribute('src'); scrollVideo.load(); }
  }
  function maybeEnableScrollVideo() {
    if (!scrollVideo || !scrollTrack || videoReady || !heroNearViewport() || scrollVideo.readyState < 2 || !Number.isFinite(scrollVideo.duration) || scrollVideo.duration <= 0 || !hasUsableSeekRange()) return;
    try { scrollVideo.currentTime = 0; } catch (_) { disableScrollVideo(); return; }
    videoReady = true;
    scrollTrack.classList.add('is-video');
    scrollVideo.pause();
    window.removeEventListener('scroll', maybeEnableScrollVideo);
    window.removeEventListener('resize', maybeEnableScrollVideo);
    window.addEventListener('scroll', queueScrollVideo, { passive: true });
    window.addEventListener('resize', queueScrollVideo, { passive: true });
    queueScrollVideo();
  }
  function startScrollVideo() {
    if (!scrollVideo || !HERO_SCROLL_VIDEO.src || reduceMotion() || saveData) return;
    if (!mediaListenersAttached) {
      scrollVideo.addEventListener('loadedmetadata', maybeEnableScrollVideo);
      scrollVideo.addEventListener('loadeddata', maybeEnableScrollVideo);
      scrollVideo.addEventListener('canplay', maybeEnableScrollVideo);
      scrollVideo.addEventListener('seeked', () => { seekInFlight = false; if (pendingTime !== null) queueScrollVideo(); });
      scrollVideo.addEventListener('error', disableScrollVideo);
      mediaListenersAttached = true;
    }
    scrollVideo.poster = HERO_SCROLL_VIDEO.poster;
    scrollVideo.preload = 'auto';
    scrollVideo.src = HERO_SCROLL_VIDEO.src;
    scrollVideo.load();
    window.addEventListener('scroll', maybeEnableScrollVideo, { passive: true });
    window.addEventListener('resize', maybeEnableScrollVideo, { passive: true });
  }
  if (scrollVideo && HERO_SCROLL_VIDEO.src && !reduceMotion() && !saveData) {
    startScrollVideo();
    motionQuery?.addEventListener?.('change', (event) => { if (event.matches) disableScrollVideo(); else startScrollVideo(); });
  }
  // Coast image loop is isolated from the scroll-linked hero controller.
  const coast = document.querySelector('[data-coast-loop]');
  const coastLayers = [...(coast?.querySelectorAll('.coast-layer') || [])];
  let coastEnvironmentPaused = false; let coastReady = false;
  function setCoastStatic() { coast?.classList.remove('is-looping', 'is-paused'); coast?.classList.add('is-static'); coastReady = false; }
  function coastInViewport() { const rect = coast?.getBoundingClientRect(); return Boolean(rect && rect.bottom > 0 && rect.top < window.innerHeight); }
  function updateCoastEnvironment() { coastEnvironmentPaused = document.visibilityState !== 'visible' || !coastInViewport(); syncCoastLoop(); }
  function syncCoastLoop() { if (!coast || !coastReady || coast.classList.contains('is-static')) return; coast.classList.add('is-looping'); coast.classList.toggle('is-paused', coastEnvironmentPaused); }
  if (coast && coastLayers.length === 3) {
    const loadPromises = coastLayers.map((layer) => layer.complete ? Promise.resolve() : new Promise((resolve) => { layer.addEventListener('load', resolve, { once: true }); layer.addEventListener('error', resolve, { once: true }); }));
    Promise.all(loadPromises).then(() => { if (coastLayers.some((layer) => !layer.naturalWidth)) { setCoastStatic(); return; } coastReady = true; if (reduceMotion() || saveData) setCoastStatic(); else { coast.classList.remove('is-static'); syncCoastLoop(); } });
    const coastObserver = new IntersectionObserver(() => updateCoastEnvironment(), { threshold: 0.08 }); coastObserver.observe(coast);
    document.addEventListener('visibilitychange', updateCoastEnvironment); window.addEventListener('resize', updateCoastEnvironment, { passive: true });
  }
  const services = [...document.querySelectorAll('.service')];
  services.forEach((service, index) => {
    const panel = service.querySelector('.service-panel');
    panel.hidden = index !== 0;
    service.classList.toggle('is-open', index === 0);
  });
  services.forEach((service) => {
    const button = service.querySelector('button');
    const panel = service.querySelector('.service-panel');
    button.addEventListener('click', () => {
      const open = service.classList.contains('is-open');
      services.forEach((item) => {
        item.classList.remove('is-open');
        item.querySelector('button').setAttribute('aria-expanded', 'false');
        item.querySelector('button b').textContent = '＋';
        item.querySelector('.service-panel').hidden = true;
      });
      if (!open) {
        service.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
        button.querySelector('b').textContent = '−';
        panel.hidden = false;
      }
    });
  });

  const priceWindow = document.querySelector('.price-window');
  const pricePrev = document.querySelector('.price-prev');
  const priceNext = document.querySelector('.price-next');
  const priceCards = [...document.querySelectorAll('.price-card')];
  let priceAutoPaused = reduceMotion();
  let priceAutoFrame = 0;
  let priceAutoLast = 0;
  let priceAutoPosition = 0;
  let priceAutoDirection = 1;
  let priceHover = false;
  let priceFocus = false;
  let priceInteractionTimer = 0;
  function movePrice(direction) {
    if (!priceWindow || !priceCards.length) return;
    const card = priceCards[0];
    const gap = Number.parseFloat(getComputedStyle(card.parentElement).gap) || 20;
    priceWindow.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: reduceMotion() ? 'auto' : 'smooth' });
  }
  function resumePriceAfterInteraction() { window.clearTimeout(priceInteractionTimer); priceInteractionTimer = window.setTimeout(() => startPriceAuto(true), 700); }
  pricePrev?.addEventListener('click', () => { stopPriceAuto(); movePrice(-1); resumePriceAfterInteraction(); });
  priceNext?.addEventListener('click', () => { stopPriceAuto(); movePrice(1); resumePriceAfterInteraction(); });
  priceWindow?.addEventListener('pointerdown', () => { stopPriceAuto(); window.clearTimeout(priceInteractionTimer); }, { passive: true });
  priceWindow?.addEventListener('pointerup', resumePriceAfterInteraction, { passive: true });
  priceWindow?.addEventListener('pointercancel', resumePriceAfterInteraction, { passive: true });
  priceWindow?.addEventListener('wheel', () => { stopPriceAuto(); resumePriceAfterInteraction(); }, { passive: true });
  priceWindow?.addEventListener('mouseenter', () => { priceHover = true; });
  priceWindow?.addEventListener('mouseleave', () => { priceHover = false; priceAutoLast = 0; startPriceAuto(); });
  priceWindow?.addEventListener('focusin', () => { priceFocus = true; });
  priceWindow?.addEventListener('focusout', () => { priceFocus = false; priceAutoLast = 0; startPriceAuto(); });
  function priceInViewport() { if (!priceWindow) return false; const rect = priceWindow.getBoundingClientRect(); return rect.bottom > 0 && rect.top < window.innerHeight; }
  function stopPriceAuto() { if (priceAutoFrame) { window.cancelAnimationFrame(priceAutoFrame); priceAutoFrame = 0; } priceAutoLast = 0; }
  function startPriceAuto(syncPosition = false) { if (!priceWindow || reduceMotion() || priceAutoPaused || priceHover || priceFocus || document.visibilityState !== 'visible' || !priceInViewport() || priceAutoFrame) return; if (syncPosition) { priceAutoPosition = priceWindow.scrollLeft; priceAutoDirection = 1; priceAutoLast = 0; } priceAutoFrame = window.requestAnimationFrame(autoPrice); }
  function autoPrice(timestamp) {
    priceAutoFrame = 0;
    if (!priceWindow || !priceCards.length || priceAutoPaused || priceHover || priceFocus || document.visibilityState !== 'visible' || !priceInViewport()) return;
    if (!priceAutoLast) priceAutoLast = timestamp;
    const elapsed = Math.min(48, timestamp - priceAutoLast);
    priceAutoLast = timestamp;
    const max = Math.max(0, priceWindow.scrollWidth - priceWindow.clientWidth);
    priceAutoPosition = Math.max(0, Math.min(max, priceAutoPosition + priceAutoDirection * elapsed * 0.018));
    if (priceAutoPosition >= max) { priceAutoPosition = max; priceAutoDirection = -1; }
    if (priceAutoPosition <= 0) { priceAutoPosition = 0; priceAutoDirection = 1; }
    priceWindow.scrollLeft = priceAutoPosition;
    priceAutoFrame = window.requestAnimationFrame(autoPrice);
  }
  priceWindow?.addEventListener('scroll', () => { if (priceAutoFrame === 0 && !priceAutoPaused) priceAutoPosition = priceWindow.scrollLeft; }, { passive: true });
  window.addEventListener('scroll', startPriceAuto, { passive: true });
  window.addEventListener('resize', startPriceAuto, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') stopPriceAuto(); else startPriceAuto(true); });
  if (priceWindow && !reduceMotion()) startPriceAuto(true);
  motionQuery?.addEventListener?.('change', (event) => { if (event.matches) { stopPriceAuto(); priceAutoPaused = true; } else { priceAutoPaused = false; startPriceAuto(); } });

  const flow = document.querySelector('.flow-section');
  const flowSteps = [...document.querySelectorAll('.flow-list li[data-step]')];
  const flowRail = document.querySelector('.flow-rail');
  const stepLinks = [...document.querySelectorAll('.step-nav a')];
  let flowFrame = 0;
  function updateFlow() {
    flowFrame = 0;
    if (!flow || !flowSteps.length) return;
    const rect = flow.getBoundingClientRect();
    const viewport = window.innerHeight;
    const progress = clamp((viewport * .55 - rect.top) / Math.max(1, rect.height - viewport * .35), 0, 1);
    flow.style.setProperty('--flow-progress', progress.toFixed(3));
    const marker = Math.min(viewport * .32, 200);
    let current = 0;
    flowSteps.forEach((step, index) => { if (step.getBoundingClientRect().top <= marker) current = index; });
    flowSteps.forEach((step, index) => step.classList.toggle('is-current', index === current));
    stepLinks.forEach((link, index) => { if (index === current) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current'); });
  }
  function queueFlow() { if (!flowFrame) flowFrame = window.requestAnimationFrame(updateFlow); }
  if (flow) { window.addEventListener('scroll', queueFlow, { passive: true }); window.addEventListener('resize', queueFlow, { passive: true }); stepLinks.forEach((link) => link.addEventListener('click', () => window.setTimeout(queueFlow, 350))); queueFlow(); }

  const dialog = document.querySelector('.photo-dialog');
  const image = dialog?.querySelector('.gallery-image');
  const caption = dialog?.querySelector('.gallery-caption');
  const openerSelector = '.photo-open';
  const collection = [
    { src: './assets/real/work-carrying.webp', alt: '室内から家具を運び出す作業', text: '家具の運び出し' },
    { src: './assets/real/work-box.webp', alt: '整理した家財を積み込む作業', text: '家財の積み込み' },
    { src: './assets/real/work-loading.webp', alt: '回収品を積み込む作業', text: '回収品の積み込み' },
  ];
  let current = 0; let lastFocus = null; let startX = null;
  function showPhoto(index) { current = (index + collection.length) % collection.length; const item = collection[current]; image.src = item.src; image.alt = item.alt; caption.textContent = `${current + 1} / ${collection.length}　${item.text}`; }
  if (dialog && image && caption && typeof dialog.showModal === 'function') {
    document.querySelectorAll(openerSelector).forEach((link) => link.addEventListener('click', (event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); lastFocus = link; showPhoto(Number(link.dataset.photo || 0)); dialog.showModal(); }));
    dialog.querySelector('.gallery-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('.gallery-prev').addEventListener('click', () => showPhoto(current - 1));
    dialog.querySelector('.gallery-next').addEventListener('click', () => showPhoto(current + 1));
    dialog.addEventListener('close', () => lastFocus?.focus());
    dialog.addEventListener('keydown', (event) => { if (event.key === 'ArrowLeft') showPhoto(current - 1); if (event.key === 'ArrowRight') showPhoto(current + 1); });
    image.addEventListener('pointerdown', (event) => { if (event.isPrimary && event.button === 0) startX = { x: event.clientX, y: event.clientY, id: event.pointerId }; });
    image.addEventListener('pointerup', (event) => { if (!startX || event.pointerId !== startX.id) return; const x = event.clientX - startX.x; const y = event.clientY - startX.y; startX = null; if (Math.abs(x) > 48 && Math.abs(x) > Math.abs(y)) { event.preventDefault(); showPhoto(current + (x < 0 ? 1 : -1)); } });
    image.addEventListener('pointercancel', () => { startX = null; });
  }
})();
