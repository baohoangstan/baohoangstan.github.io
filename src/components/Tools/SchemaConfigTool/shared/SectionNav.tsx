import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@site/src/lib/utils';

type SectionItem = {
  id: string;
  label: string;
  el: HTMLHeadingElement;
};

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[-\s]+/g, '-');
};

export function SectionNav({
  containerRef,
  tab,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  tab: string;
}) {
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Locate the portal target on the client side
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const mainContainer = container.closest('.docMainContainer') as HTMLElement || container.closest('main') as HTMLElement;
    if (mainContainer) {
      // Find the main col which usually holds the main content (e.g. .col--9 or .col--8 or first child col)
      // or we can find .row inside mainContainer and append a new column if we want.
      // Docusaurus uses: <div className="container"> <div className="row"> <main className="col col--9">...
      // Let's inspect Docusaurus standard layout:
      // Inside .docMainContainer -> we have a .container -> .row -> main (.col) and sometimes a right toc column (.col--3)
      // If we find the row, we can append a custom column to that row!
      const row = mainContainer.querySelector('.row') as HTMLElement;
      const targetElement = row || mainContainer;

      const wrapperId = 'section-nav-portal-wrapper';
      let wrapper = targetElement.querySelector(`#${wrapperId}`) as HTMLElement;
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = wrapperId;
        
        if (row) {
          // If we have a row, let's act as a proper Docusaurus TOC column!
          // We can use Docusaurus responsive column classes: col col--3
          wrapper.className = 'col col--3 hidden min-[997px]:block pointer-events-none';
        } else {
          // Fallback if no .row: absolute position on the right
          wrapper.className = 'absolute right-4 top-0 bottom-0 hidden min-[997px]:block w-48 shrink-0 pointer-events-none';
          targetElement.style.position = 'relative'; // Ensure ancestor positioning
        }
        
        targetElement.appendChild(wrapper);
      }
      setPortalTarget(wrapper);

      return () => {
        if (wrapper && wrapper.parentNode) {
          wrapper.parentNode.removeChild(wrapper);
        }
      };
    }
  }, [containerRef, tab]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSections = () => {
      // Find all h3 headings within the container
      const h3s = Array.from(container.querySelectorAll('h3'));
      const items = h3s.map((h3, index) => {
        const text = h3.textContent || '';
        const slug = slugify(text) || `section-${index}`;
        const id = `sec-${slug}`;
        
        // Ensure the heading has this ID in the DOM
        if (h3.getAttribute('id') !== id) {
          h3.setAttribute('id', id);
        }

        return {
          id,
          label: text,
          el: h3,
        };
      });

      // Simple array equality check to prevent infinite loops / unnecessary state updates
      setSections((prev) => {
        if (prev.length === items.length && prev.every((val, i) => val.id === items[i].id && val.label === items[i].label)) {
          return prev;
        }
        return items;
      });
    };

    // Run initial scan
    updateSections();

    // Set up MutationObserver to re-scan if content/subtrees change
    const observer = new MutationObserver(() => {
      updateSections();
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [containerRef, tab]);

  // Scroll spy implementation using a scroll listener on the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container || sections.length === 0) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const containerTop = containerRect.top;

      let currentActiveId = sections[0].id;
      const offset = 80; // threshold for header alignment

      for (const sec of sections) {
        if (sec.el) {
          const elRect = sec.el.getBoundingClientRect();
          const relativeTop = elRect.top - containerTop;
          if (relativeTop <= offset) {
            currentActiveId = sec.id;
          } else {
            break;
          }
        }
      }

      setActiveId(currentActiveId);
    };

    handleScroll();

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [sections, containerRef]);

  if (sections.length < 2 || !portalTarget) {
    return null;
  }

  const handleNavClick = (sec: SectionItem) => {
    const container = containerRef.current;
    if (!container || !sec.el) return;

    const containerRect = container.getBoundingClientRect();
    const elRect = sec.el.getBoundingClientRect();
    
    // Calculate the target scroll position relative to the container
    const relativeTop = elRect.top - containerRect.top + container.scrollTop;
    
    container.scrollTo({
      top: relativeTop - 16, // leave a 16px aesthetic gap at the top
      behavior: 'smooth',
    });
  };

  const navContent = (
    <nav 
      className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto w-44 pl-4 border-l border-border/60 text-xs pointer-events-auto select-none"
      style={{ top: 'calc(var(--ifm-navbar-height, 60px) + 2rem)' }}
    >
      <div className="font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        On this page
      </div>
      <ul className="flex flex-col gap-2 list-none p-0 m-0">
        {sections.map((sec) => (
          <li key={sec.id} className="relative">
            {/* Active bar overlay indicator */}
            {activeId === sec.id && (
              <span className="absolute -left-[17px] top-0 bottom-0 w-[2px] bg-primary rounded-full" />
            )}
            <button
              onClick={() => handleNavClick(sec)}
              className={cn(
                'text-left font-medium transition-colors hover:text-foreground block w-full cursor-pointer py-0.5 outline-none focus-visible:text-foreground',
                activeId === sec.id
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground'
              )}
            >
              {sec.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );

  return createPortal(navContent, portalTarget);
}
