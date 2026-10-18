const svg = d => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const I = {
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  user: svg('<circle cx="12" cy="8.5" r="3.5"/><path d="M5 19.5c1.2-3.2 3.9-5 7-5s5.8 1.8 7 5"/>'),
  share: svg('<path d="M12 3.5v11M8 7.5l4-4 4 4"/><path d="M6.5 11H5v9h14v-9h-1.5"/>'),
  trash: svg('<path d="M4 7h16M10 7V4.5h4V7M6.5 7l.8 12.5h9.4L17.5 7"/>'),
  pack: svg('<path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z"/><path d="M4 8.5 12 13l8-4.5M12 13v7"/>'),
  folder: svg('<path d="M3.5 6h6l2 2.5h9v10h-17z"/>'),
  file: svg('<path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4"/>'),
  offline: svg('<path d="M7 18.5h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 9.3 4.6 4.6 0 0 0 7 18.5z"/><path d="M4 4l16 16"/>'),
  sync: svg('<path d="M19.5 12a7.5 7.5 0 0 1-13 5.1M4.5 12a7.5 7.5 0 0 1 13-5.1"/><path d="M17.5 3.5v3.5H14M6.5 20.5V17H10"/>'),
};
