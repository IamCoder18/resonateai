"use client";

import { useEffect } from "react";

export function RevealClient() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    function enhance(el: Element) {
      if (!el.classList || !el.classList.contains("reveal")) return;
      if (el.classList.contains("is-visible")) return;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight + 80 && r.bottom > -80) {
        el.classList.add("is-visible");
      } else if ("IntersectionObserver" in window) {
        io.observe(el);
      } else {
        el.classList.add("is-visible");
      }
    }

    function scan(root: Element | Document) {
      root.querySelectorAll(".reveal").forEach(enhance);
    }

    let io: IntersectionObserver;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add("is-visible");
              io.unobserve(e.target);
            }
          }
        },
        { rootMargin: "0px 0px 15% 0px", threshold: 0.01 },
      );
    }

    scan(document);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          const el = node as Element;
          if (el.classList && el.classList.contains("reveal")) enhance(el);
          if ((el as Element).querySelectorAll) {
            el.querySelectorAll(".reveal").forEach(enhance);
          }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      if (io) io.disconnect();
    };
  }, []);

  return null;
}