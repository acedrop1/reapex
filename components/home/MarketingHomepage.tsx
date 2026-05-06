'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import AgentApplicationModal from '@/components/modals/AgentApplicationModal';

const REAPEX_SVG_PATH = (
  <g>
    <path d="M337.21,88.88l-.14,54.95-17.57-.03-.05-141.42,17.37-.24.63,11.68c15.48-18.06,50.63-17.35,67.25-1.78,24.5,22.95,20.64,67.83-7.72,83.38-14.52,7.96-31.16,8.1-46.7,3.05l-13.06-9.6ZM394.31,75.47c11.21-13.1,10.94-31.85,2.62-45.51-5.83-9.57-15.58-13.82-26.24-13.83-13.26-.01-24.83,6.79-30.22,19.31-5.88,13.64-4.13,30.19,6.73,41.28,12.49,12.75,35.05,12.85,47.11-1.25Z"/>
    <path d="M276.97,100.11l-.59-11.75c-14.2,14.7-39.22,16.77-56.63,9.61-19.69-8.1-31.07-26.24-30.96-47.31.11-20.56,11.12-38.09,30.26-46.02,18.91-7.84,42.53-6.06,57.53,8.99l.39-11.51,17.53.12-.02,97.6-17.5.28ZM248.05,85.25c14.81-2.83,25.56-13.38,28.09-27.57,3.94-22.13-11.94-40.95-34.11-41.57-20.52-.57-36.11,14.97-35.29,35.62.41,10.38,4.54,20.08,11.87,26.18,8.19,6.82,18.6,9.4,29.44,7.33Z"/>
    <path d="M147.89,69.9l18.39.17c-9.54,29.19-43.97,38.24-69.28,27.54s-33.99-38.86-26.49-63.41c3.93-12.86,12.69-22.65,24.94-28.36,18.16-8.46,39.78-6.76,56.03,5.44,13.67,10.26,19.74,27.31,17.55,44.27l-83.07.06c.03,10.14,5.39,18.44,13.24,23.96,15.39,10.81,39.27,8.36,48.69-9.66ZM150.1,40.54c-.97-9-4.77-12.9-9.77-17.46-12.22-8.61-28.9-9.22-41.46-.77-6.39,4.3-11.24,10.62-11.36,18.35l62.59-.12Z"/>
    <path d="M519.48,69.79l18.06.32c-9.89,30.93-49,40.22-75.89,23.93-29.1-17.63-28.04-60.41-6.23-80.74,15.86-14.78,38.92-16.45,57.98-7.8,19.22,8.72,29.93,29.24,26.84,50.05l-82.73.07c-.16,21.69,23.69,34.76,43.41,29.03,8.04-2.34,14.53-7.22,18.55-14.86ZM521.82,40.55c-1.52-9.97-7.18-16.66-15.31-20.61-10.01-4.86-21.95-4.74-32.11-.1-8.5,3.88-14.92,11.55-15.87,20.82l63.29-.11Z"/>
    <path d="M17.35,99.76l-17.31.2L0,2.33l17.08-.26.71,11.19C28.42.05,42.19-1.91,56.84,1.43v15.51c-10.05-2.07-18.71-.94-26.85,5.01-6.66,4.88-12.45,13.7-12.48,23.29l-.16,54.52Z"/>
    <path d="M574.55,100.11c-6.01.52-11.24.5-18.47.18l32.31-50.38L554.69,1.26c6.97-.64,12.57-.61,19.41-.5l33.04,47.99-32.59,51.35Z"/>
    <polygon points="622.75 100.88 606.77 76.75 615.96 62.29 640.89 100.11 622.75 100.88"/>
    <polygon points="617.05 37.06 607.06 23.1 622.88 .61 641.63 1.08 617.05 37.06"/>
  </g>
);

function ReapexLogo({ height = 28, style }: { height?: number; style?: React.CSSProperties }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 641.63 143.83" style={{ height, width: 'auto', fill: '#fff', ...style }}>
      {REAPEX_SVG_PATH}
    </svg>
  );
}

// Testimonials data
const TESTIMONIALS = [
  {
    badge: '+22%',
    quote: "I increased my take-home pay by 22% in my first year at Reapex. The 90/10 split and low cap meant I kept more of what I earned. Plus, the tech stack actually helps me close deals faster.",
    stat: '+22%',
    statLabel: 'Increased Take-Home',
  },
  {
    badge: '$47K+',
    quote: "Switching from my old brokerage was the best decision I ever made. No more waiting for commission checks \u2014 I get paid instantly at close. The Accelerator program has brought me 3 qualified leads this quarter alone.",
    stat: '$47K+',
    statLabel: 'Additional Income (Year 1)',
  },
  {
    badge: '100%',
    quote: "Reapex doesn't just talk about supporting agents \u2014 they actually do it. 24/7 transaction support, instant commission disbursement, and a tech platform that doesn't make me want to throw my laptop. Finally, a brokerage that gets it.",
    stat: '100%',
    statLabel: 'Commission Split',
  },
  {
    badge: '3x',
    quote: "The marketing tools alone are worth the switch. Custom listing packages, social templates, and brand assets \u2014 I tripled my listing presentations in the first quarter. My clients notice the difference.",
    stat: '3x',
    statLabel: 'Listing Presentations',
  },
  {
    badge: '$0',
    quote: "Zero hidden fees. Zero desk charges. Zero surprises. After years of watching my commission get eaten by mystery line items, Reapex feels like a breath of fresh air. Transparent from day one.",
    stat: '$0',
    statLabel: 'Hidden Fees',
  },
];

export default function MarketingHomepage() {
  const [loaderHidden, setLoaderHidden] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [floatingCtaVisible, setFloatingCtaVisible] = useState(false);
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);

  // Calculator state
  const [gci, setGci] = useState(250000);
  const [split, setSplit] = useState(70);
  const [cap, setCap] = useState(35000);

  // Disclaimer toggle
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  // Refs
  const heroRef = useRef<HTMLElement>(null);
  const heroHeadlineRef = useRef<HTMLHeadingElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const scrollRevealTextRef = useRef<HTMLParagraphElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const fmt = useCallback((n: number) => n.toLocaleString('en-US'), []);

  // Calculator logic
  const brokerageTake = Math.min(gci * (1 - split / 100), cap > 0 ? cap : gci);
  const currentNet = gci - brokerageTake;
  const reapexNet = gci - 5400;
  const savings = reapexNet - currentNet;
  const maxBar = Math.max(currentNet, reapexNet, 1);

  // Hide shared layout nav/footer since marketing page has its own
  useEffect(() => {
    document.body.classList.add('marketing-page');
    return () => { document.body.classList.remove('marketing-page'); };
  }, []);

  // Page loader
  useEffect(() => {
    const timer = setTimeout(() => setLoaderHidden(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  // Scroll progress, navbar scroll, floating CTA
  useEffect(() => {
    function onScroll() {
      // Scroll progress
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
      document.documentElement.style.setProperty('--scroll-progress', String(scrolled));

      // Navbar
      setNavScrolled(window.scrollY > 60);

      // Floating CTA
      const heroBottom = heroRef.current?.offsetHeight ?? 0;
      const footerTop = footerRef.current?.offsetTop ?? Infinity;
      if (window.scrollY > heroBottom && window.scrollY < footerTop - 200) {
        setFloatingCtaVisible(true);
      } else {
        setFloatingCtaVisible(false);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cursor glow
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    }
    document.addEventListener('mousemove', onMouseMove);
    return () => document.removeEventListener('mousemove', onMouseMove);
  }, []);

  // Hero headline word-by-word reveal
  useEffect(() => {
    const headline = heroHeadlineRef.current;
    if (!headline) return;

    const rawHTML = "IT'S YOUR COMMISSION. <span class=\"gold\">KEEP MORE OF IT.</span>";
    const parts = rawHTML.split(/(<span[^>]*>.*?<\/span>)/);
    headline.innerHTML = '';
    let wordIndex = 0;

    parts.forEach(part => {
      if (part.startsWith('<span')) {
        const match = part.match(/<span([^>]*)>(.*?)<\/span>/);
        if (match) {
          const innerText = match[2];
          const words = innerText.trim().split(/\s+/);
          words.forEach((word, i) => {
            const span = document.createElement('span');
            span.className = 'hero-headline-word gold';
            span.textContent = word;
            span.style.animationDelay = `${wordIndex * 0.1}s`;
            headline.appendChild(span);
            wordIndex++;
            if (i < words.length - 1) headline.appendChild(document.createTextNode(' '));
          });
        }
      } else {
        const words = part.trim().split(/\s+/).filter((w: string) => w.length > 0);
        words.forEach(() => {
          const word = words.shift();
          if (!word) return;
          const span = document.createElement('span');
          span.className = 'hero-headline-word';
          span.textContent = word;
          span.style.animationDelay = `${wordIndex * 0.1}s`;
          headline.appendChild(span);
          wordIndex++;
          headline.appendChild(document.createTextNode(' '));
        });
        // Re-add remaining if any (fix: use original approach)
      }
    });

    // Simpler approach: re-do it cleanly
    headline.innerHTML = '';
    wordIndex = 0;
    const allWords = [
      { text: "IT'S", gold: false },
      { text: 'YOUR', gold: false },
      { text: 'COMMISSION.', gold: false },
      { text: 'KEEP', gold: true },
      { text: 'MORE', gold: true },
      { text: 'OF', gold: true },
      { text: 'IT.', gold: true },
    ];
    allWords.forEach((w, i) => {
      const span = document.createElement('span');
      span.className = `hero-headline-word${w.gold ? ' gold' : ''}`;
      span.textContent = w.text;
      span.style.animationDelay = `${i * 0.1}s`;
      headline.appendChild(span);
      headline.appendChild(document.createTextNode(' '));
    });
  }, []);

  // Particles
  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;
    for (let i = 0; i < 25; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = (50 + Math.random() * 50) + '%';
      particle.style.animationDelay = Math.random() * 8 + 's';
      particle.style.animationDuration = (6 + Math.random() * 6) + 's';
      const size = (1 + Math.random() * 3) + 'px';
      particle.style.width = size;
      particle.style.height = size;
      container.appendChild(particle);
    }
    return () => { container.innerHTML = ''; };
  }, []);

  // Scroll text reveal
  useEffect(() => {
    const revealText = scrollRevealTextRef.current;
    if (!revealText) return;
    const text = "We built Reapex to be the brokerage we always wished existed \u2014 modern tools, fair splits, real support, and a technology-first approach that puts agents first.";
    const words = text.split(' ');
    revealText.innerHTML = '';
    words.forEach(word => {
      const span = document.createElement('span');
      span.className = 'scroll-reveal-text-word';
      span.textContent = word + ' ';
      revealText.appendChild(span);
    });

    function onScroll() {
      const wordSpans = revealText!.querySelectorAll('.scroll-reveal-text-word');
      const elementTop = revealText!.getBoundingClientRect().top;
      const viewportHeight = window.innerHeight;
      const rawProgress = (viewportHeight - elementTop) / (viewportHeight * 0.5);
      const progress = Math.min(Math.max(rawProgress, 0), 1);

      wordSpans.forEach((span, index) => {
        const wordProgress = index / wordSpans.length;
        if (progress > wordProgress) {
          span.classList.add('visible');
        } else {
          span.classList.remove('visible');
        }
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Section reveals (IntersectionObserver)
  useEffect(() => {
    const sections = document.querySelectorAll('.section-reveal, .card-slide-in, .glow-divider, .stat-item');
    const pending = new Set(Array.from(sections));

    function revealVisible() {
      pending.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 100 && rect.bottom > -100) {
          el.classList.add('in-view');
          pending.delete(el);
        }
      });
      if (pending.size === 0) window.removeEventListener('scroll', onScroll);
    }

    let ticking = false;
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => { revealVisible(); ticking = false; });
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    requestAnimationFrame(revealVisible);
    const t = setTimeout(revealVisible, 500);
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(t);
    };
  }, []);

  // Stagger children reveal
  useEffect(() => {
    const containers = document.querySelectorAll('.stagger-children');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('in-view');
      });
    }, { threshold: 0.15 });
    containers.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Counters
  useEffect(() => {
    const statNumbers = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting && !el.dataset.counted) {
          el.dataset.counted = 'true';
          const target = parseFloat(el.dataset.target || '0');
          const suffix = el.dataset.suffix || '';
          const prefix = el.dataset.prefix || '';
          const display = el.dataset.display;

          if (display) { el.textContent = display; return; }

          const duration = 1500;
          const startTime = performance.now();

          function easeOutExpo(t: number) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

          function animate(currentTime: number) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutExpo(progress);
            const current = Math.floor(easedProgress * target);
            el.textContent = prefix + current + suffix;
            if (progress < 1) requestAnimationFrame(animate);
            else el.textContent = prefix + target + suffix;
          }
          requestAnimationFrame(animate);
        }
      });
    }, { threshold: 0.5 });
    statNumbers.forEach(n => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  // Stat item staggered reveal
  useEffect(() => {
    const stats = document.querySelectorAll('.stat-item');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const allStats = document.querySelectorAll('.stat-item');
          const idx = Array.from(allStats).indexOf(entry.target);
          setTimeout(() => { entry.target.classList.add('in-view'); }, idx * 150);
        }
      });
    }, { threshold: 0.3 });
    stats.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Plan card 3D tilt
  useEffect(() => {
    const cards = document.querySelectorAll('.plan-card');
    const handlers: Array<{ el: Element; move: (e: Event) => void; leave: () => void }> = [];
    cards.forEach(card => {
      const move = (e: Event) => {
        const me = e as MouseEvent;
        const rect = (card as HTMLElement).getBoundingClientRect();
        const x = me.clientX - rect.left;
        const y = me.clientY - rect.top;
        const rotateX = (y / rect.height - 0.5) * 8;
        const rotateY = (x / rect.width - 0.5) * -8;
        (card as HTMLElement).style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
      };
      const leave = () => {
        (card as HTMLElement).style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
      };
      card.addEventListener('mousemove', move);
      card.addEventListener('mouseleave', leave);
      handlers.push({ el: card, move, leave });
    });
    return () => {
      handlers.forEach(({ el, move, leave }) => {
        el.removeEventListener('mousemove', move);
        el.removeEventListener('mouseleave', leave);
      });
    };
  }, []);

  // Tilt cards
  useEffect(() => {
    const cards = document.querySelectorAll('.tilt-card');
    const handlers: Array<{ el: Element; move: (e: Event) => void; leave: () => void }> = [];
    cards.forEach(card => {
      const move = (e: Event) => {
        const me = e as MouseEvent;
        const rect = (card as HTMLElement).getBoundingClientRect();
        const x = (me.clientX - rect.left) / rect.width;
        const y = (me.clientY - rect.top) / rect.height;
        const rotateX = (y - 0.5) * 6;
        const rotateY = (x - 0.5) * -6;
        (card as HTMLElement).style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
      };
      const leave = () => {
        (card as HTMLElement).style.transform = 'perspective(600px) rotateX(0) rotateY(0) scale(1)';
      };
      card.addEventListener('mousemove', move);
      card.addEventListener('mouseleave', leave);
      handlers.push({ el: card, move, leave });
    });
    return () => {
      handlers.forEach(({ el, move, leave }) => {
        el.removeEventListener('mousemove', move);
        el.removeEventListener('mouseleave', leave);
      });
    };
  }, []);

  // Magnetic buttons
  useEffect(() => {
    const buttons = document.querySelectorAll('.magnetic-btn');
    const handlers: Array<{ el: Element; move: (e: Event) => void; leave: () => void }> = [];
    buttons.forEach(btn => {
      const move = (e: Event) => {
        const me = e as MouseEvent;
        const rect = (btn as HTMLElement).getBoundingClientRect();
        const x = me.clientX - rect.left - rect.width / 2;
        const y = me.clientY - rect.top - rect.height / 2;
        (btn as HTMLElement).style.transform = `translate(${x * 0.2}px, ${y * 0.2}px) scale(1.02)`;
      };
      const leave = () => {
        (btn as HTMLElement).style.transform = 'translate(0, 0) scale(1)';
      };
      btn.addEventListener('mousemove', move);
      btn.addEventListener('mouseleave', leave);
      handlers.push({ el: btn, move, leave });
    });
    return () => {
      handlers.forEach(({ el, move, leave }) => {
        el.removeEventListener('mousemove', move);
        el.removeEventListener('mouseleave', leave);
      });
    };
  }, []);

  // Text scramble removed — replaced with simple fade-in via section-reveal CSS

  // Mobile nav
  function closeMobileNav() {
    setMobileNavOpen(false);
    document.body.style.overflow = '';
  }

  function toggleMobileNav() {
    setMobileNavOpen(prev => {
      const next = !prev;
      document.body.style.overflow = next ? 'hidden' : '';
      return next;
    });
  }

  // Smooth scroll helper
  function scrollToId(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="marketing-wrapper">
      {/* PAGE LOADER */}
      <div className={`page-loader${loaderHidden ? ' hidden' : ''}`}>
        <div className="loader-logo">
          <ReapexLogo height={32} />
        </div>
        <div className="loader-bar"><div className="loader-bar-fill"></div></div>
      </div>

      {/* SCROLL PROGRESS BAR */}
      <div className="scroll-progress-bar"></div>

      {/* NAV */}
      <nav className={`mkt-nav${navScrolled ? ' scrolled' : ''}`} ref={navRef}>
        <a href="#hero" className="nav-logo" onClick={(e) => scrollToId(e, 'hero')}>
          <ReapexLogo height={28} />
        </a>
        <div className="nav-center">
          <Link href="/sell">Sell</Link>
          <Link href="/listings">Buy</Link>
          <Link href="/agents">Our Agents</Link>
          <Link href="/contact">Contact Us</Link>
        </div>
        <div className="nav-right">
          <Link href="/login" className="btn btn-outline-nav">Agent Portal</Link>
          <a href="#" className="btn btn-gold magnetic-btn" onClick={(e) => { e.preventDefault(); setApplicationModalOpen(true); }}>Partner With Us</a>
        </div>
        <button
          className={`nav-hamburger${mobileNavOpen ? ' open' : ''}`}
          aria-label="Menu"
          onClick={toggleMobileNav}
        >
          <span></span><span></span><span></span>
        </button>
      </nav>

      {/* MOBILE NAV OVERLAY */}
      <div className={`mobile-overlay${mobileNavOpen ? ' open' : ''}`}>
        <Link href="/" onClick={closeMobileNav}>Home</Link>
        <Link href="/sell" onClick={closeMobileNav}>Sell</Link>
        <Link href="/listings" onClick={closeMobileNav}>Buy</Link>
        <Link href="/agents" onClick={closeMobileNav}>Our Agents</Link>
        <Link href="/contact" onClick={closeMobileNav}>Contact Us</Link>
        <div className="mobile-cta">
          <Link href="/login" className="btn btn-outline-dark" onClick={closeMobileNav}>Agent Portal</Link>
          <a href="#cta" className="btn btn-gold" onClick={(e) => { scrollToId(e, 'cta'); closeMobileNav(); }}>Partner With Us</a>
        </div>
      </div>

      {/* HERO */}
      <section className="hero" id="hero" ref={heroRef}>
        <video className="hero-video" autoPlay muted loop playsInline>
          <source src="/header.mov" type="video/quicktime" />
          <source src="/header.mov" type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="hero-bg-glow"></div>
        <div className="particles-container" ref={particlesRef}></div>
        <div className="hero-content">
          <h1 className="hero-headline" ref={heroHeadlineRef}>
            {/* Content injected via useEffect */}
          </h1>
          <p className="hero-sub">The old brokerage model is broken. Switch to the platform that treats you like a partner, not a number.</p>
          <div className="hero-btns">
            <Link href="/join" className="btn btn-gold btn-xl magnetic-btn">Join Us</Link>
            <a href="#plans" className="btn btn-outline-dark btn-xl magnetic-btn" onClick={(e) => scrollToId(e, 'plans')}>Commission Menu</a>
          </div>
        </div>
        <div className="scroll-indicator">
          <div className="scroll-mouse"></div>
          <div>SCROLL</div>
        </div>
      </section>

      {/* CONTENT OVERLAY */}
      <div className="content-overlay">
        <div className="content-overlay-inner">

          {/* TRUST BAR */}
          <div className="trust-bar">
            <div className="trust-inner stagger-children">
              <div className="trust-item">
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Licensed NJ Real Estate Broker
              </div>
              <div className="trust-item">
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                100% Commission Plans Available
              </div>
              <div className="trust-item">
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Instant Clear-to-Close Payments
              </div>
              <div className="trust-item">
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                24/7 Agent Support
              </div>
            </div>
          </div>

          {/* SCROLL REVEAL TEXT SECTION */}
          <section className="scroll-reveal-section" id="scrollReveal">
            <div>
              <p className="scroll-reveal-text" ref={scrollRevealTextRef}></p>
            </div>
            <div className="scroll-reveal-right section-reveal">
              <div className="sec-label">Our Mission</div>
              <p style={{ marginBottom: 20 }}>At Reapex, we believe real estate agents deserve better. Better splits, better tools, and better support &mdash; without the bloated overhead of a traditional brokerage.</p>
              <p>Headquartered in Fort Lee, NJ, we&apos;re building the future of real estate &mdash; one agent at a time.</p>
            </div>
          </section>

          {/* STATS BAR */}
          <section className="stats-bar">
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number" data-target="100">0</div>
                <div className="stat-label">Commission Split %</div>
              </div>
              <div className="stat-item">
                <div className="stat-number" data-target="24" data-suffix="/7">0</div>
                <div className="stat-label">Agent Support</div>
              </div>
              <div className="stat-item">
                <div className="stat-number" data-target="0" data-prefix="$" data-display="$0">$0</div>
                <div className="stat-label">Hidden Fees</div>
              </div>
              <div className="stat-item">
                <div className="stat-number" data-target="50" data-suffix="/50">0</div>
                <div className="stat-label">Lead Split Program</div>
              </div>
            </div>
          </section>

          <div className="glow-divider"></div>

          {/* WHY REAPEX */}
          <section className="sec" id="features">
            <div className="tc section-reveal">
              <div className="sec-label">Why Reapex</div>
              <div className="sec-title">Everything you need to grow. Nothing you don&apos;t.</div>
              <div className="sec-sub">We built Reapex to be the brokerage we always wished existed &mdash; modern tools, fair splits, and real support.</div>
            </div>
            <div className="features-grid stagger-children">
              <div className="feature-card tilt-card">
                <div className="feature-icon"><svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
                <h3>Keep What You Earn</h3>
                <p>Flexible commission splits from 80/20 up to 100%. Low caps, no hidden fees, no surprises.</p>
              </div>
              <div className="feature-card tilt-card">
                <div className="feature-icon"><svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
                <h3>Instant Payments</h3>
                <p>Get paid at clear-to-close. No more waiting days or weeks for commission checks.</p>
              </div>
              <div className="feature-card tilt-card">
                <div className="feature-icon"><svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
                <h3>Modern Tech Stack</h3>
                <p>Integrated Agent OS with CRM, transaction management, marketing tools, and a full portal &mdash; not a clunky intranet.</p>
              </div>
              <div className="feature-card tilt-card">
                <div className="feature-icon"><svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                <h3>Accelerator Program</h3>
                <p>50/50 split lead generation program. Qualified leads delivered directly to you &mdash; no cold calling.</p>
              </div>
              <div className="feature-card tilt-card">
                <div className="feature-icon"><svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>
                <h3>Training &amp; Mentorship</h3>
                <p>24/7 broker support, ongoing training programs, and a knowledge base built for your success.</p>
              </div>
              <div className="feature-card tilt-card">
                <div className="feature-icon"><svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
                <h3>Marketing &amp; Branding</h3>
                <p>Custom design requests, listing launch packages, brand assets, and social media templates &mdash; all included.</p>
              </div>
            </div>
          </section>

          {/* CALCULATOR */}
          <section className="sec-off" id="calculator">
            <div className="si">
              <div className="tc section-reveal">
                <div className="sec-label">Commission Calculator</div>
                <div className="sec-title">See exactly how much more you could earn.</div>
                <div className="sec-sub">Plug in your numbers. The difference speaks for itself.</div>
              </div>
              <div className="calc-grid section-reveal">
                <div className="calc-left">
                  <h3>Your Current Situation</h3>
                  <div className="input-group">
                    <label>Annual GCI (Gross Commission Income)</label>
                    <div className="range-value"><span className="prefix">$</span><span>{fmt(gci)}</span></div>
                    <input type="range" min="0" max="500000" step="5000" value={gci} onChange={(e) => setGci(Number(e.target.value))} />
                    <div className="range-labels"><span>$0</span><span>$250k</span><span>$500k</span></div>
                  </div>
                  <div className="input-group">
                    <label>Your Current Commission Split</label>
                    <div className="range-value"><span>{split}</span><span className="suffix">%</span></div>
                    <input type="range" min="50" max="90" step="5" value={split} onChange={(e) => setSplit(Number(e.target.value))} />
                    <div className="range-labels"><span>50%</span><span>70%</span><span>90%</span></div>
                  </div>
                  <div className="input-group">
                    <label>Current Annual Cap</label>
                    <div className="range-value"><span className="prefix">$</span><span>{fmt(cap)}</span></div>
                    <input type="range" min="0" max="100000" step="1000" value={cap} onChange={(e) => setCap(Number(e.target.value))} />
                    <div className="range-labels"><span>$0</span><span>$50k</span><span>$100k</span></div>
                  </div>
                </div>
                <div className="calc-right">
                  <h3>Your Reapex Advantage</h3>
                  <div className="result-big">
                    <div className="lbl">Your Instant Annual Pay Raise</div>
                    <div className="amt" style={{ color: savings >= 0 ? '#22c55e' : '#ef4444' }}>
                      {savings >= 0 ? '+' : '-'}${fmt(Math.abs(Math.round(savings)))}
                    </div>
                    <div className="sub">added to your bottom line with Reapex</div>
                  </div>
                  <div className="bar-group">
                    <div className="bar-label">
                      <span className="bl">Current Brokerage</span>
                      <span className="bv" style={{ color: '#ef4444' }}>${fmt(Math.round(currentNet))}</span>
                    </div>
                    <div className="bar-track"><div className="bar-fill red" style={{ width: `${(currentNet / maxBar) * 100}%` }}></div></div>
                  </div>
                  <div className="bar-group" style={{ marginTop: 16 }}>
                    <div className="bar-label">
                      <span className="bl">Reapex Pro Plan</span>
                      <span className="bv" style={{ color: '#22c55e' }}>${fmt(Math.round(reapexNet))}</span>
                    </div>
                    <div className="bar-track"><div className="bar-fill grn" style={{ width: `${(reapexNet / maxBar) * 100}%` }}></div></div>
                  </div>
                  <div className="disclaimer-toggle" onClick={() => setDisclaimerOpen(!disclaimerOpen)}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    Disclaimer
                  </div>
                  {disclaimerOpen && (
                    <div style={{ fontSize: 11, color: 'var(--g600)', marginTop: 10, lineHeight: 1.5 }}>
                      *The commission calculator is for illustrative purposes only. Actual earnings may differ based on transaction volume, fees, and deal structures. This tool does not constitute a guarantee of income.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* FRICTIONLESS BANNER */}
          <section className="section-reveal" style={{
            background: 'linear-gradient(135deg, #0a0a0a 0%, #111 100%)',
            borderTop: '2px solid var(--gold)',
            borderBottom: '2px solid var(--gold)',
            padding: '48px 24px',
            textAlign: 'center',
          }}>
            <div className="si" style={{ maxWidth: 800 }}>
              <p style={{
                fontSize: 'clamp(20px, 3vw, 32px)',
                fontWeight: 800,
                color: 'var(--white)',
                letterSpacing: '-0.5px',
                lineHeight: 1.3,
                margin: 0,
              }}>
                The Frictionless Brokerage: <span style={{ color: 'var(--gold)' }}>No Transaction Fees. No Junk Fees.</span> Just Pure Production.
              </p>
            </div>
          </section>

          {/* PLANS */}
          <section className="sec-dark" id="plans">
            <div className="si tc">
              <div className="sec-label section-reveal">Commission Menu</div>
              <div className="sec-title section-reveal" style={{ color: 'var(--white)' }}>
                Simple, transparent pricing that<br />grows with your business.
              </div>
            </div>
            <div className="si">
              <div className="plans-grid stagger-children">
                <div className="plan-card gradient-border">
                  <div className="plan-name">Launch</div>
                  <div className="plan-desc">Perfect for new agents getting started</div>
                  <div className="plan-split">80/20</div>
                  <div className="plan-split-label">Commission Split</div>
                  <div className="plan-detail"><span className="dl">Monthly Fee</span><span className="dv">$0</span></div>
                  <div className="plan-detail"><span className="dl">Annual Cap</span><span className="dv">$22.5K Cap</span></div>
                  <div className="plan-cta"><a href="#cta" className="btn btn-outline-dark magnetic-btn" onClick={(e) => scrollToId(e, 'cta')}>Learn More</a></div>
                </div>
                <div className="plan-card gradient-border">
                  <div className="plan-name">Growth</div>
                  <div className="plan-desc">Ideal for growing your business</div>
                  <div className="plan-split">90/10</div>
                  <div className="plan-split-label">Commission Split</div>
                  <div className="plan-detail"><span className="dl">Monthly Fee</span><span className="dv">$225</span></div>
                  <div className="plan-detail"><span className="dl">Annual Cap</span><span className="dv">$19.5K Cap</span></div>
                  <div className="plan-cta"><a href="#cta" className="btn btn-outline-dark magnetic-btn" onClick={(e) => scrollToId(e, 'cta')}>Learn More</a></div>
                </div>
                <div className="plan-card featured gradient-border">
                  <div className="plan-name">Pro</div>
                  <div className="plan-desc">Maximum earnings for top producers</div>
                  <div className="plan-split">100%</div>
                  <div className="plan-split-label">Commission Split</div>
                  <div className="plan-detail"><span className="dl">Monthly Fee</span><span className="dv">$550</span></div>
                  <div className="plan-detail"><span className="dl">Annual Cap</span><span className="dv">N/A</span></div>
                  <div className="plan-cta"><a href="#cta" className="btn btn-gold magnetic-btn" onClick={(e) => scrollToId(e, 'cta')}>Learn More</a></div>
                </div>
              </div>
              <div className="section-reveal" style={{ textAlign: 'center', marginTop: 40 }}>
                <p style={{ fontSize: 15, color: 'var(--g400)', marginBottom: 20 }}>Take the first step toward a more profitable and empowered real estate career.</p>
                <Link href="/join" className="btn btn-gold btn-lg magnetic-btn">Join Us</Link>
              </div>
            </div>
          </section>

          <div className="glow-divider" style={{ background: 'linear-gradient(90deg,transparent,var(--gold),transparent)' }}></div>

          {/* COMPARISON */}
          <section className="sec-dark" id="compare" style={{ borderTop: '1px solid var(--g800)' }}>
            <div className="si tc">
              <div className="sec-label section-reveal">Old vs. New</div>
              <div className="sec-title section-reveal" style={{ color: 'var(--white)' }}>The difference is clear.</div>
            </div>
            <div className="si">
              <div className="comp-grid section-reveal">
                <div className="comp-col trad">
                  <div className="comp-head">Traditional Brokerage</div>
                  <div className="comp-sub">The way it&apos;s always been</div>
                  {[
                    { cat: 'Commission Split', val: 'Rigid 50/50, 60/40 or 70/30' },
                    { cat: 'Technology Stack', val: 'Clunky Intranet & Outdated Tools' },
                    { cat: 'Getting Paid', val: 'Wait Days or Weeks for Checks' },
                    { cat: 'Lead Generation', val: "You're on Your Own" },
                    { cat: 'Monthly Fees', val: '$500-$1,500+ Desk, Tech Fees & High Cap' },
                    { cat: 'Support & Training', val: 'Limited to Office Hours' },
                  ].map((row, i) => (
                    <div className="comp-row" key={i}>
                      <div className="comp-icon bad">
                        <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </div>
                      <div>
                        <div className="comp-cat">{row.cat}</div>
                        <div className="comp-val">{row.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="comp-col modern">
                  <div className="comp-head" style={{ color: 'var(--gold)' }}>Reapex Model</div>
                  <div className="comp-sub">Built for the modern agent</div>
                  {[
                    { cat: 'Commission Split', val: 'Flexible 80/20 to 100%' },
                    { cat: 'Technology Stack', val: 'Integrated Agent OS with Modern Tech' },
                    { cat: 'Getting Paid', val: 'Instant Clear-to-Close Payments' },
                    { cat: 'Lead Generation', val: 'Accelerator 50/50 Split Program' },
                    { cat: 'Monthly Fees', val: 'Low Annual Cap, No Hidden Fees' },
                    { cat: 'Support & Training', val: '24/7 Support & Ongoing Training' },
                  ].map((row, i) => (
                    <div className="comp-row" key={i}>
                      <div className="comp-icon good">
                        <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <div>
                        <div className="comp-cat">{row.cat}</div>
                        <div className="comp-val">{row.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* TESTIMONIALS */}
          <section className="testimonials-section" id="stories">
            <div className="testimonials-header section-reveal">
              <div className="sec-label" style={{ justifyContent: 'center' }}>Agent Success Stories</div>
              <div className="testimonials-heading">Real Agents. Real Results.</div>
              <div className="testimonials-subtitle">Hear from agents who&apos;ve made the switch.</div>
            </div>
            <div className="testimonials-marquee-wrapper">
              <div className="testimonials-track">
                {/* Render twice for infinite scroll */}
                {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                  <div className="testimonial-card" key={i}>
                    <div className="testimonial-badge">{t.badge}</div>
                    <div className="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                    <div className="testimonial-quote">{t.quote}</div>
                    <div className="testimonial-stat">{t.stat}</div>
                    <div className="testimonial-stat-label">{t.statLabel}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* TEAM */}
          <section className="sec-off" id="team">
            <div className="si tc section-reveal">
              <div className="sec-title">Meet the Reapex Team</div>
            </div>
            <div className="si">
              <div className="team-grid stagger-children">
                {[
                  { initials: 'AY', name: 'Andrew Yeranossian', role: 'Co-Founder' },
                  { initials: 'MH', name: 'Mutasim Huda', role: 'Co-Founder' },
                  { initials: 'RJ', name: 'Ramzi Jaloudi', role: 'Agent' },
                ].map((member, i) => (
                  <div className="team-card" key={i}>
                    <div className="team-photo"><div className="team-photo-inner">{member.initials}</div></div>
                    <div className="team-name">{member.name}</div>
                    <div className="team-role">{member.role}</div>
                  </div>
                ))}
              </div>
              <div className="section-reveal" style={{ textAlign: 'center', marginTop: 36 }}>
                <Link href="/agents" className="btn btn-outline-light btn-lg magnetic-btn">View All Agents</Link>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="cta" id="cta">
            <div className="cta-grid">
              <div className="cta-left section-reveal">
                <div className="sec-label">Ready to Upgrade?</div>
                <h2>Ready to Upgrade<br /><span className="gold">Your Career?</span></h2>
                <p>The traditional brokerage model was built for the broker, not the agent. See the difference with Reapex.</p>
                <div className="cta-tagline">Switch to the brokerage that puts you first.</div>
              </div>
              <div className="cta-form section-reveal">
                <h3>Take Back Control of Your Career</h3>
                <div className="form-submit"><button className="btn btn-gold btn-lg magnetic-btn" onClick={() => setApplicationModalOpen(true)}>Start Your Application</button></div>
                <div className="form-note" style={{ marginTop: 16 }}>100% Confidential · Takes 2 Minutes</div>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="mkt-footer" ref={footerRef}>
            <div className="footer-grid">
              <div className="footer-brand">
                <a href="#hero" className="nav-logo" style={{ display: 'inline-flex' }} onClick={(e) => scrollToId(e, 'hero')}>
                  <ReapexLogo height={24} />
                </a>
                <p>Reach Your Real Estate Apex.<br />A True Partnership Platform.</p>
                <div className="footer-badges">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.6 }}><path d="M12 3L2 12h3v9h14v-9h3L12 3z" fill="black"/><rect x="8" y="14" width="8" height="1.5" fill="white"/><rect x="8" y="17" width="8" height="1.5" fill="white"/></svg>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.6 }}><rect x="3" y="3" width="18" height="18" rx="3" fill="black"/><text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="900" fill="white">R</text></svg>
                </div>
                <div className="footer-broker">Licensed Real Estate Broker</div>
              </div>
              <div className="footer-col">
                <h4>Quick Links</h4>
                <Link href="/sell">Sell</Link>
                <Link href="/listings">Buy</Link>
                <Link href="/agents">Our Agents</Link>
                <Link href="/contact">Contact Us</Link>
              </div>
              <div className="footer-col">
                <h4>Company</h4>
                <Link href="/join">Join Us</Link>
                <a href="mailto:info@re-apex.com">Contact Us</a>
              </div>
              <div className="footer-col">
                <h4>Contact</h4>
                <span style={{ display: 'block', fontSize: 14, color: 'var(--g500)', marginBottom: 10 }}>260 Columbia Ave, Suite 20<br />Fort Lee, NJ 07024</span>
                <a href="mailto:info@re-apex.com">info@re-apex.com</a>
              </div>
            </div>
            <div className="footer-bottom">&copy; Reapex &middot; All rights reserved</div>
          </footer>

        </div>{/* end content-overlay-inner */}
      </div>{/* end content-overlay */}

      {/* FLOATING CTA */}
      <div className={`floating-cta${floatingCtaVisible ? ' visible' : ''}`}>
        <a href="#" onClick={(e) => { e.preventDefault(); setApplicationModalOpen(true); }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          Partner With Us
        </a>
      </div>

      {/* Agent Application Modal */}
      <AgentApplicationModal open={applicationModalOpen} onClose={() => setApplicationModalOpen(false)} />
    </div>
  );
}
