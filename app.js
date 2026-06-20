/**
 * ============================================================
 *  StudyVault — Dynamic Interactive Feature Layer
 *  Pure vanilla ES6+ · No dependencies
 *  Reads file manifest from window.STUDYVAULT_FILES
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  /* --------------------------------------------------------
   *  0.  CONSTANTS & CONFIG
   * ------------------------------------------------------ */
  const ICON_COLORS = ['blue', 'amber', 'cyan', 'purple', 'green', 'red'];
  const BADGE_COLORS = {
    lecture: 'blue',
    quiz: 'cyan',
    summary: 'green',
    guide: 'purple',
    notes: 'amber',
  };

  // SVG icons as reusable strings
  const ICONS = {
    document: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>`,
    quiz: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    fileSize: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13,2 13,9 20,9"/></svg>`,
    format: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    lines: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    open: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
    download: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  };

  /* --------------------------------------------------------
   *  1.  READ FILE MANIFEST & RENDER CARDS
   * ------------------------------------------------------ */
  const filesData = window.STUDYVAULT_FILES || [];
  const grid = document.getElementById('files-grid');
  const searchInput = document.getElementById('search-input');
  const emptyState = document.getElementById('empty-state');
  const header = document.querySelector('.header');
  const particlesBox = document.getElementById('particles');
  const statSize = document.getElementById('stat-size');
  const statFiles = document.getElementById('stat-files');
  const fileCountBadge = document.getElementById('file-count-badge');
  const filterPillsContainer = document.getElementById('filter-pills');

  // Update header stats
  if (statFiles) statFiles.textContent = filesData.length;
  if (fileCountBadge) fileCountBadge.textContent = `${filesData.length} File${filesData.length !== 1 ? 's' : ''}`;

  // Calculate and display total size
  if (statSize && filesData.length > 0) {
    const totalBytes = filesData.reduce((sum, f) => sum + (f.sizeBytes || 0), 0);
    const totalKB = totalBytes / 1024;
    statSize.textContent = totalKB >= 1024
      ? `${(totalKB / 1024).toFixed(1)} MB`
      : `${totalKB.toFixed(1)} KB`;
  }

  // Collect unique categories for dynamic filter pills
  const categories = [...new Set(filesData.map(f => f.category).filter(Boolean))];

  // Build dynamic filter pills
  if (filterPillsContainer && categories.length > 0) {
    // Clear existing pills
    filterPillsContainer.innerHTML = '';
    
    // "All" pill
    const allPill = document.createElement('button');
    allPill.className = 'pill pill--active';
    allPill.dataset.filter = 'all';
    allPill.id = 'filter-all';
    allPill.textContent = 'All';
    filterPillsContainer.appendChild(allPill);

    // Category pills
    categories.forEach(cat => {
      const pill = document.createElement('button');
      pill.className = 'pill';
      pill.dataset.filter = cat;
      pill.id = `filter-${cat}`;
      pill.textContent = cat.charAt(0).toUpperCase() + cat.slice(1) + (cat.endsWith('z') ? 'zes' : 's');
      filterPillsContainer.appendChild(pill);
    });
  }

  /**
   * Create a file card HTML string for a given file object
   */
  const createCardHTML = (file, index) => {
    const iconColor = ICON_COLORS[index % ICON_COLORS.length];
    const badgeColor = BADGE_COLORS[file.category] || 'blue';
    const icon = file.category === 'quiz' ? ICONS.quiz : ICONS.document;
    const categoryLabel = file.category ? file.category.charAt(0).toUpperCase() + file.category.slice(1) : 'File';
    const safeId = file.fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const escapedTitle = (file.title || file.fileName).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedDesc = (file.description || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return `
      <article class="file-card" data-category="${file.category || ''}" data-name="${escapedTitle}" data-filepath="${file.filePath}" id="file-card-${index + 1}">
        <div class="file-card__glow" aria-hidden="true"></div>
        <div class="file-card__checkbox">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div class="file-card__header">
          <div class="file-card__icon file-card__icon--${iconColor}">
            ${icon}
          </div>
          <div class="file-card__badges">
            <span class="badge badge--${badgeColor}">${categoryLabel}</span>
            <span class="badge badge--${file.sizeBytes > 100000 ? 'red' : 'green'}">${file.sizeFormatted}</span>
          </div>
        </div>
        <h2 class="file-card__title">${escapedTitle}</h2>
        <div class="file-card__meta">
          <div class="meta-item">
            ${ICONS.fileSize}
            <span>${file.sizeFormatted}</span>
          </div>
          <div class="meta-item">
            ${ICONS.format}
            <span>${(file.filePath.split('.').pop() || 'File').toUpperCase()}</span>
          </div>
        </div>
        <div class="file-card__actions">
          <a href="${file.filePath}" class="btn btn--primary" id="open-${safeId}">
            ${ICONS.open}
            Open File
          </a>
          <a href="${file.filePath}" download class="btn btn--ghost" id="download-${safeId}">
            ${ICONS.download}
            Download
          </a>
        </div>
      </article>
    `;
  };

  // Group files
  const examFiles = [];
  const summaryFiles = [];
  const otherFiles = [];

  filesData.forEach((file) => {
    const nameLower = file.fileName.toLowerCase();
    if (nameLower.includes("طبيعة_الامتحان") || nameLower.includes("طبيعة الامتحان")) {
      examFiles.push(file);
    } else if (nameLower.includes("summar")) {
      summaryFiles.push(file);
    } else {
      otherFiles.push(file);
    }
  });

  // Render all cards into the grid
  if (grid && filesData.length > 0) {
    let html = '';
    
    // 1. Exam files
    if (examFiles.length > 0) {
      html += examFiles.map((file, i) => createCardHTML(file, i)).join('');
    }

    // Divider 1: Important Questions
    if (otherFiles.length > 0) {
      html += `<div class="section-divider" style="width: 100%; grid-column: 1 / -1; margin: 0.2rem 0 0.2rem 0; display: flex; align-items: center; text-align: center; color: rgba(255,255,255,0.5); font-size: 0.9rem; font-weight: 500;">
        <hr style="flex: 1; border: none; border-top: 1px solid rgba(255,255,255,0.1); margin-right: 1rem;">
        <span>أسئلة ومعلومات مهمة</span>
        <hr style="flex: 1; border: none; border-top: 1px solid rgba(255,255,255,0.1); margin-left: 1rem;">
      </div>`;
      html += otherFiles.map((file, i) => createCardHTML(file, i + examFiles.length)).join('');
    }

    // Divider 2: Summaries
    if (summaryFiles.length > 0) {
      html += `<div class="section-divider" style="width: 100%; grid-column: 1 / -1; margin: 0.2rem 0 0.2rem 0; display: flex; align-items: center; text-align: center; color: rgba(255,255,255,0.5); font-size: 0.9rem; font-weight: 500;">
        <hr style="flex: 1; border: none; border-top: 1px solid rgba(255,255,255,0.1); margin-right: 1rem;">
        <span>Summaries</span>
        <hr style="flex: 1; border: none; border-top: 1px solid rgba(255,255,255,0.1); margin-left: 1rem;">
      </div>`;
      html += summaryFiles.map((file, i) => createCardHTML(file, i + examFiles.length + otherFiles.length)).join('');
    }

    grid.innerHTML = html;
  } else if (grid) {
    grid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
  }

  /* --------------------------------------------------------
   *  2.  CACHE RENDERED CARDS & SET UP INTERACTIONS
   * ------------------------------------------------------ */
  // Re-query after dynamic rendering
  const fileCards = document.querySelectorAll('.file-card');
  const pills = document.querySelectorAll('.pill');
  let activeFilter = 'all';

  /* --------------------------------------------------------
   *  2.5 DOWNLOAD ALL / MULTI-SELECTION LOGIC
   * ------------------------------------------------------ */
  const btnDownloadAll = document.getElementById('btn-download-all');
  let isSelectionMode = false;
  const selectedFiles = new Set();

  if (btnDownloadAll) {
    btnDownloadAll.addEventListener('click', () => {
      if (!isSelectionMode) {
        // ENTER SELECTION MODE
        isSelectionMode = true;
        document.body.classList.add('selection-mode');
        selectedFiles.clear();
        
        // Select all currently visible cards
        fileCards.forEach(card => {
          if (card.style.display !== 'none') {
            card.classList.add('selected');
            selectedFiles.add(card.dataset.filepath);
          }
        });
        
        btnDownloadAll.innerHTML = `${ICONS.download} Download (${selectedFiles.size})`;
      } else {
        // EXECUTE DOWNLOAD & EXIT SELECTION MODE
        if (selectedFiles.size > 0) {
          let delay = 0;
          selectedFiles.forEach(filepath => {
            setTimeout(() => {
              const a = document.createElement('a');
              a.href = filepath;
              a.download = ''; // Triggers actual download on server
              a.target = '_blank'; // Fallback
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }, delay);
            delay += 300; // Stagger to prevent browser blocking
          });
        }
        
        isSelectionMode = false;
        document.body.classList.remove('selection-mode');
        fileCards.forEach(c => c.classList.remove('selected'));
        btnDownloadAll.innerHTML = `${ICONS.download} Download All`;
        selectedFiles.clear();
      }
    });
  }

  // Handle card clicks during selection mode
  fileCards.forEach(card => {
    card.addEventListener('click', (e) => {
      if (isSelectionMode) {
        e.preventDefault(); // Prevent link clicking
        card.classList.toggle('selected');
        const filepath = card.dataset.filepath;
        
        if (card.classList.contains('selected')) {
          selectedFiles.add(filepath);
        } else {
          selectedFiles.delete(filepath);
        }
        
        if (btnDownloadAll) {
          btnDownloadAll.innerHTML = `${ICONS.download} Download (${selectedFiles.size})`;
        }
      }
    });
  });

  /* --------------------------------------------------------
   *  3.  SEARCH FUNCTIONALITY
   * ------------------------------------------------------ */
  const applyFilters = () => {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    let visibleCount = 0;

    fileCards.forEach(card => {
      const category = card.dataset.category || '';
      const passesFilter = activeFilter === 'all' || category === activeFilter;

      const name = (card.dataset.name || '').toLowerCase();
      const textContent = card.textContent.toLowerCase();
      const passesSearch = !query || name.includes(query) || textContent.includes(query);

      if (passesFilter && passesSearch) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    const dividers = document.querySelectorAll('.section-divider');
    dividers.forEach(div => {
      if (query || activeFilter !== 'all') {
        div.style.display = 'none';
      } else {
        div.style.display = 'flex';
      }
    });

    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? 'flex' : 'none';
    }
  };

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  // Ctrl + K → focus search
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchInput?.focus();
      searchInput?.select();
    }
  });

  /* --------------------------------------------------------
   *  4.  FILTER PILLS
   * ------------------------------------------------------ */
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('pill--active'));
      pill.classList.add('pill--active');
      activeFilter = pill.dataset.filter || 'all';
      applyFilters();
    });
  });

  /* --------------------------------------------------------
   *  5.  HEADER SCROLL EFFECT
   * ------------------------------------------------------ */
  if (header) {
    const SCROLL_THRESHOLD = 50;
    const onScroll = () => {
      header.classList.toggle('header--scrolled', window.scrollY > SCROLL_THRESHOLD);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* --------------------------------------------------------
   *  6.  CARD GLOW EFFECT (Mouse-Following Spotlight)
   * ------------------------------------------------------ */
  fileCards.forEach(card => {
    const glow = card.querySelector('.file-card__glow');
    if (!glow) return;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      glow.style.opacity = '1';
      glow.style.background = `radial-gradient(
        circle 180px at ${x}px ${y}px,
        rgba(99, 102, 241, 0.15),
        transparent 70%
      )`;
    });

    card.addEventListener('mouseleave', () => {
      glow.style.opacity = '0';
    });
  });

  /* --------------------------------------------------------
   *  7.  FLOATING PARTICLES
   * ------------------------------------------------------ */
  if (particlesBox) {
    const PARTICLE_COUNT = 250;
    const particles = [];

    const createParticle = () => {
      const el = document.createElement('div');
      const size = 2 + Math.random() * 2;
      Object.assign(el.style, {
        position: 'fixed',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.35)',
        opacity: (0.15 + Math.random() * 0.35).toFixed(2),
        pointerEvents: 'none',
        zIndex: '0',
        willChange: 'transform',
      });
      particlesBox.appendChild(el);
      return {
        el,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        speed: 0.15 + Math.random() * 0.45,
        drift: (Math.random() - 0.5) * 0.3,
        size,
      };
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(createParticle());

    const animateParticles = () => {
      particles.forEach(p => {
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -p.size) {
          p.y = window.innerHeight + p.size;
          p.x = Math.random() * window.innerWidth;
        }
        if (p.x < -p.size) p.x = window.innerWidth + p.size;
        if (p.x > window.innerWidth + p.size) p.x = -p.size;
        p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      });
      requestAnimationFrame(animateParticles);
    };
    requestAnimationFrame(animateParticles);
  }

  /* --------------------------------------------------------
   *  8.  ENTRANCE ANIMATIONS (Staggered Reveal)
   * ------------------------------------------------------ */
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const delay = i * 120;
            setTimeout(() => entry.target.classList.add('visible'), delay);
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    fileCards.forEach(card => revealObserver.observe(card));
  } else {
    fileCards.forEach((card, i) => {
      setTimeout(() => card.classList.add('visible'), i * 120);
    });
  }

  /* --------------------------------------------------------
   *  9.  SMOOTH SCROLL
   * ------------------------------------------------------ */
  document.documentElement.style.scrollBehavior = 'smooth';

  /* --------------------------------------------------------
   *  10. FILE READER VIEW (SPA MODE)
   * ------------------------------------------------------ */
  const fileReaderView = document.getElementById('file-reader-view');
  const fileReaderClose = document.getElementById('file-reader-close');
  const fileReaderContent = document.getElementById('file-reader-content');
  const homeView = document.getElementById('home-view');

  if (fileReaderClose) {
    fileReaderClose.addEventListener('click', (e) => {
      e.preventDefault();
      if (fileReaderView) fileReaderView.style.display = 'none';
      if (homeView) homeView.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (grid) {
    grid.addEventListener('click', async (e) => {
      // Find if we clicked on an Open File button
      const openBtn = e.target.closest('a[id^="open-"]');
      if (openBtn) {
        // Find the closest card
        const card = openBtn.closest('.file-card');
        if (!card) return;
        
        const filepath = card.dataset.filepath;
        
        // Check if it is the requested file or a general text file
        if (filepath && (filepath.endsWith('.txt') || filepath.endsWith('.md'))) {
          e.preventDefault(); // Stop normal navigation
          
          try {
            let text = "";
            
            // 1. Try to find content from filesData (solves local file:/// CORS issue)
            const fileObj = filesData.find(f => f.filePath === filepath);
            if (fileObj && fileObj.textContent) {
               text = fileObj.textContent;
            } else {
               // 2. Fallback to fetch if it's hosted
               const response = await fetch(filepath);
               if (!response.ok) throw new Error('Network response was not ok');
               text = await response.text();
            }
            
            // Render markdown
            if (fileReaderContent) {
              fileReaderContent.innerHTML = window.marked ? marked.parse(text) : `<pre>${text}</pre>`;
            }
            
            // Show SPA View, hide Home View
            if (homeView) homeView.style.display = 'none';
            if (fileReaderView) fileReaderView.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });

          } catch (error) {
            console.error('Error reading file:', error);
            // Fallback to normal navigation
            window.location.href = filepath;
          }
        }
      }
    });
  }
});
