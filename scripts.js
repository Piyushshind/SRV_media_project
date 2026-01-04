// scripts.js

(function () {
  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------
   * Utility: add basic swipe support
   * -------------------------------------------------- */
  function addSwipeNavigation({ container, onSwipeLeft, onSwipeRight, threshold = 40 }) {
    let startX = 0;
    let endX = 0;

    if (!container) return;

    container.addEventListener('touchstart', (e) => {
      if (!e.changedTouches || !e.changedTouches.length) return;
      startX = e.changedTouches[0].screenX;
    });

    container.addEventListener('touchend', (e) => {
      if (!e.changedTouches || !e.changedTouches.length) return;
      endX = e.changedTouches[0].screenX;
      const delta = endX - startX;
      if (delta < -threshold && typeof onSwipeLeft === 'function') {
        onSwipeLeft();
      } else if (delta > threshold && typeof onSwipeRight === 'function') {
        onSwipeRight();
      }
    });
  }

  /* ----------------------------------------------------
   * HERO: Dual-axis slider
   * -------------------------------------------------- */
  function initHeroSlider() {
    const hero = document.querySelector('.hero__slider');
    if (!hero) return;

    const track = hero.querySelector('.hero__slider-track');
    const groups = Array.from(hero.querySelectorAll('.hero__slider-group'));
    const slides = Array.from(hero.querySelectorAll('.hero__slide'));
    const prevXBtn = hero.querySelector('.hero__control--prev-x');
    const nextXBtn = hero.querySelector('.hero__control--next-x');
    const prevYBtn = hero.querySelector('.hero__control--prev-y');
    const nextYBtn = hero.querySelector('.hero__control--next-y');
    const toggleBtn = hero.querySelector('.hero__control--toggle');

    if (!track || groups.length === 0) return;

    let horizontalIndex = 0;
    let verticalIndex = 0;
    let autoplayInterval = null;
    const autoplayDelay = 5000;
    let isPlaying = !prefersReducedMotion;

    function getCurrentGroup() {
      return groups[horizontalIndex];
    }

    function getVerticalSlidesCount(groupIndex) {
      const group = groups[groupIndex];
      if (!group) return 0;
      return group.querySelectorAll('.hero__slide').length;
    }

    function updateTransforms() {
      const xPercent = -horizontalIndex * 100;
      track.style.transform = `translateX(${xPercent}%)`;

      groups.forEach((group, index) => {
        const track = group.querySelector('.hero__slider-vertical-track');
        if (!track) return;

        const yIndex = index === horizontalIndex ? verticalIndex : 0;
        track.style.transform = `translateY(${-yIndex * 100}%)`;
      });
    }

    function updateAria() {
      const totalSlides = slides.length;
      const currentGroup = getCurrentGroup();
      const slidesInCurrentGroup = Array.from(currentGroup.querySelectorAll('.hero__slide'));
      const currentSlide = slidesInCurrentGroup[verticalIndex];

      slides.forEach((slide) => {
        slide.setAttribute('tabindex', '-1');
      });

      if (currentSlide) {
        currentSlide.setAttribute('tabindex', '0');
      }

    }

    function goTo(horizontal, vertical) {
      const maxH = groups.length - 1;
      horizontalIndex = Math.max(0, Math.min(maxH, horizontal));

      const maxV = getVerticalSlidesCount(horizontalIndex) - 1;
      verticalIndex = Math.max(0, Math.min(maxV, vertical));

      updateTransforms();
      updateAria();
    }

    function nextVertical() {
      const maxV = getVerticalSlidesCount(horizontalIndex) - 1;
      verticalIndex = (verticalIndex + 1) % (maxV + 1);
      goTo(horizontalIndex, verticalIndex);
    }

    function prevVertical() {
      const maxV = getVerticalSlidesCount(horizontalIndex) - 1;
      verticalIndex = (verticalIndex - 1 + (maxV + 1)) % (maxV + 1);
      goTo(horizontalIndex, verticalIndex);
    }


    function nextHorizontal() {
      const maxH = groups.length - 1;
      if (horizontalIndex < maxH) {
        goTo(horizontalIndex + 1, 0);
      } else {
        goTo(0, 0);
      }
    }

    function prevHorizontal() {
      if (horizontalIndex > 0) {
        goTo(horizontalIndex - 1, 0);
      } else {
        const lastGroupIndex = groups.length - 1;
        goTo(lastGroupIndex, 0);
      }
    }

    function startAutoplay() {
      if (prefersReducedMotion) return;
      stopAutoplay();
      isPlaying = true;
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', 'true');
        toggleBtn.querySelector('.hero__control-label').textContent = 'Pause autoplay';
      }
      autoplayInterval = window.setInterval(nextVertical, autoplayDelay);
      hero.setAttribute('aria-live', 'off');
    }

    function stopAutoplay() {
      isPlaying = false;
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', 'false');
        toggleBtn.querySelector('.hero__control-label').textContent = 'Start autoplay';
      }
      if (autoplayInterval) {
        window.clearInterval(autoplayInterval);
        autoplayInterval = null;
      }
      hero.setAttribute('aria-live', 'polite');
    }

    // Button events
    if (nextXBtn) nextXBtn.addEventListener('click', () => {
      stopAutoplay();
      nextHorizontal();
    });
    if (prevXBtn) prevXBtn.addEventListener('click', () => {
      stopAutoplay();
      prevHorizontal();
    });
    if (nextYBtn) nextYBtn.addEventListener('click', () => {
      stopAutoplay();
      nextVertical();
    });
    if (prevYBtn) prevYBtn.addEventListener('click', () => {
      stopAutoplay();
      prevVertical();
    });

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (isPlaying) {
          stopAutoplay();
        } else {
          startAutoplay();
        }
      });
    }

    // Keyboard navigation: arrow keys
    hero.addEventListener('keydown', (event) => {
      const key = event.key;
      if (key === 'ArrowRight') {
        event.preventDefault();
        stopAutoplay();
        nextHorizontal();
      } else if (key === 'ArrowLeft') {
        event.preventDefault();
        stopAutoplay();
        prevHorizontal();
      } else if (key === 'ArrowUp') {
        event.preventDefault();
        stopAutoplay();
        prevVertical();
      } else if (key === 'ArrowDown') {
        event.preventDefault();
        stopAutoplay();
        nextVertical();
      }
    });

    // Pause on hover / focus
    ['mouseenter', 'focusin', 'touchstart'].forEach((eventName) => {
      hero.addEventListener(eventName, stopAutoplay);
    });
    ['mouseleave', 'focusout'].forEach((eventName) => {
      hero.addEventListener(eventName, () => {
        // only resume if not prefersReducedMotion
        if (!prefersReducedMotion) {
          startAutoplay();
        }
      });
    });

    // Swipe left/right changes horizontal groups
    addSwipeNavigation({
      container: hero,
      onSwipeLeft: () => {
        stopAutoplay();
        nextHorizontal();
      },
      onSwipeRight: () => {
        stopAutoplay();
        prevHorizontal();
      }
    });

    // Init
    goTo(0, 0);
    if (!prefersReducedMotion) {
      startAutoplay();
    } else {
      stopAutoplay();
    }
  }

  /* ----------------------------------------------------
   * Logos: pause marquee animation on hover/focus
   * -------------------------------------------------- */
  function initLogosMarquee() {
    const marquee = document.querySelector('.logos__marquee');
    if (!marquee) return;

    function pause() {
      marquee.classList.add('logos__marquee--paused');
    }

    function resume() {
      marquee.classList.remove('logos__marquee--paused');
    }

    marquee.addEventListener('mouseenter', pause);
    marquee.addEventListener('mouseleave', resume);
    marquee.addEventListener('focusin', pause);
    marquee.addEventListener('focusout', resume);
  }

  /* ----------------------------------------------------
   * Choose the School: mobile slider with dots + swipe
   * -------------------------------------------------- */
  function initChooseSlider() {
    const carousel = document.querySelector('.choose__carousel');
    if (!carousel) return;

    const grid = carousel.querySelector('.choose__grid');
    const cards = Array.from(carousel.querySelectorAll('.choose__card'));
    const dots = Array.from(carousel.querySelectorAll('.choose__dot'));

    if (!grid || cards.length === 0 || dots.length === 0) return;

    let activeIndex = 0;

    function updateSlides() {
      cards.forEach((card, index) => {
        if (index === activeIndex) {
          card.removeAttribute('hidden');
          card.setAttribute('aria-hidden', 'false');
        } else {
          card.setAttribute('hidden', 'hidden');
          card.setAttribute('aria-hidden', 'true');
        }
      });

      dots.forEach((dot, index) => {
        const isActive = index === activeIndex;
        dot.classList.toggle('choose__dot--active', isActive);
        dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
        dot.setAttribute('tabindex', isActive ? '0' : '-1');
      });
    }

    function goTo(index) {
      const maxIndex = cards.length - 1;
      activeIndex = Math.max(0, Math.min(maxIndex, index));
      updateSlides();
    }

    // Dot click
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        goTo(index);
      });

      dot.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          goTo(index);
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          goTo(Math.min(cards.length - 1, index + 1));
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          goTo(Math.max(0, index - 1));
        }
      });
    });

    // Swipe: left/right moves between card indexes
    addSwipeNavigation({
      container: carousel,
      onSwipeLeft: () => goTo(activeIndex + 1),
      onSwipeRight: () => goTo(activeIndex - 1)
    });

    // Desktop: show all four cards (handled by CSS).
    // JS only enforces single-card on narrow view.
    function handleResize() {
      const isMobile = window.matchMedia('(max-width: 767px)').matches;
      if (isMobile) {
        // single visible card
        goTo(activeIndex);
      } else {
        // show all, reset attributes
        cards.forEach((card) => {
          card.removeAttribute('hidden');
          card.setAttribute('aria-hidden', 'false');
        });
        dots.forEach((dot, index) => {
          const isActive = index === 0;
          dot.classList.toggle('choose__dot--active', isActive);
          dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
          dot.setAttribute('tabindex', isActive ? '0' : '-1');
        });
      }
    }

    window.addEventListener('resize', handleResize);
    handleResize();
  }

  /* ----------------------------------------------------
   * Exhibition slider: prev/next + optional autoplay
   * -------------------------------------------------- */
  function initExhibitionSlider() {
    const slider = document.querySelector('.exhibition__slider');
    if (!slider) return;

    const track = slider.querySelector('.exhibition__track');
    const cards = Array.from(slider.querySelectorAll('.exhibition__card'));
    const prevBtn = slider.querySelector('.exhibition__control--prev');
    const nextBtn = slider.querySelector('.exhibition__control--next');
    const toggleBtn = slider.querySelector('.exhibition__control--toggle');

    if (!track || cards.length === 0) return;

    let currentIndex = 0;
    let autoplayInterval = null;
    const autoplayDelay = 6000;
    let isPlaying = false && !prefersReducedMotion; // default off, user can start

    function updateTrack() {
      const xPercent = -currentIndex * 100;
      track.style.transform = `translateX(${xPercent}%)`;
      cards.forEach((card, index) => {
        card.setAttribute('aria-hidden', index === currentIndex ? 'false' : 'true');
      });
    }

    function goTo(index) {
      const maxIndex = cards.length - 1;
      currentIndex = Math.max(0, Math.min(maxIndex, index));
      updateTrack();
    }

    function next() {
      if (currentIndex < cards.length - 1) {
        goTo(currentIndex + 1);
      } else {
        goTo(0);
      }
    }

    function prev() {
      if (currentIndex > 0) {
        goTo(currentIndex - 1);
      } else {
        goTo(cards.length - 1);
      }
    }

    function startAutoplay() {
      if (prefersReducedMotion) return;
      stopAutoplay();
      isPlaying = true;
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', 'true');
        toggleBtn.querySelector('.visually-hidden').textContent = 'Pause autoplay';
      }
      autoplayInterval = window.setInterval(next, autoplayDelay);
      slider.setAttribute('aria-live', 'off');
    }

    function stopAutoplay() {
      isPlaying = false;
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', 'false');
        toggleBtn.querySelector('.visually-hidden').textContent = 'Start autoplay';
      }
      if (autoplayInterval) {
        window.clearInterval(autoplayInterval);
        autoplayInterval = null;
      }
      slider.setAttribute('aria-live', 'polite');
    }

    if (nextBtn) nextBtn.addEventListener('click', () => {
      stopAutoplay();
      next();
    });

    if (prevBtn) prevBtn.addEventListener('click', () => {
      stopAutoplay();
      prev();
    });

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (isPlaying) {
          stopAutoplay();
        } else {
          startAutoplay();
        }
      });
    }

    // Keyboard navigation
    slider.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        stopAutoplay();
        next();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        stopAutoplay();
        prev();
      }
    });

    // Pause on hover / focus / touch
    ['mouseenter', 'focusin', 'touchstart'].forEach((eventName) => {
      slider.addEventListener(eventName, stopAutoplay);
    });
    ['mouseleave', 'focusout'].forEach((eventName) => {
      slider.addEventListener(eventName, () => {
        if (!prefersReducedMotion && isPlaying) {
          startAutoplay();
        }
      });
    });

    // Swipe
    addSwipeNavigation({
      container: slider,
      onSwipeLeft: () => {
        stopAutoplay();
        next();
      },
      onSwipeRight: () => {
        stopAutoplay();
        prev();
      }
    });

    goTo(0);
    // autoplay is optional and off by default
  }

  // Mobile hamburger menu toggle
  function initMobileNav() {
    const hamburger = document.querySelector('.site-header__hamburger');
    const navList = document.querySelector('.site-header__nav-list');

    if (!hamburger || !navList) return;

    hamburger.addEventListener('click', () => {
      const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', !isExpanded);
      navList.classList.toggle('site-header__nav-list--open');
    });

    // Close menu when clicking a link
    const navLinks = navList.querySelectorAll('.site-header__nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.setAttribute('aria-expanded', 'false');
        navList.classList.remove('site-header__nav-list--open');
      });
    });
  }


  document.addEventListener('DOMContentLoaded', () => {
    initHeroSlider();
    initLogosMarquee();
    initChooseSlider();
    initExhibitionSlider();
    initMobileNav();
  });
})();
