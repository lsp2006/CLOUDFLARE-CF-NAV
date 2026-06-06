/**
 * @file Skin definitions for mao_nav theme system.
 * Each skin overrides CSS custom properties on <html>.
 *
 * @typedef {{ label: string, desc: string, vars: Record<string,string> }} Skin
 * @type {Record<string, Skin>}
 */
export const skins = {
  default: {
    label: '科技蓝',
    desc: '清爽蓝色调，适合技术导航',
    vars: {
      '--mao-primary': '#3b82f6', '--mao-primary-hover': '#2563eb',
      '--mao-bg': '#f0f4f8', '--mao-surface': '#ffffff',
      '--mao-text': '#1e293b', '--mao-text-secondary': '#64748b',
      '--font-family': "'Inter','Noto Sans SC',sans-serif",
    },
  },
  finance: {
    label: '商务金',
    desc: '金色沉稳，适合金融商务',
    vars: {
      '--mao-primary': '#d97706', '--mao-primary-hover': '#b45309',
      '--mao-bg': '#fffbeb', '--mao-surface': '#ffffff',
      '--mao-text': '#1c1917', '--mao-text-secondary': '#78716c',
      '--font-family': "'Inter','Noto Serif SC',sans-serif",
    },
  },
  medical: {
    label: '医疗绿',
    desc: '宁静绿色，适合医疗健康',
    vars: {
      '--mao-primary': '#059669', '--mao-primary-hover': '#047857',
      '--mao-bg': '#ecfdf5', '--mao-surface': '#ffffff',
      '--mao-text': '#064e3b', '--mao-text-secondary': '#6b7280',
      '--font-family': "'Inter','Noto Sans SC',sans-serif",
    },
  },
  education: {
    label: '教育紫',
    desc: '优雅紫色，适合教育学术',
    vars: {
      '--mao-primary': '#7c3aed', '--mao-primary-hover': '#6d28d9',
      '--mao-bg': '#faf5ff', '--mao-surface': '#ffffff',
      '--mao-text': '#3b0764', '--mao-text-secondary': '#6b7280',
      '--font-family': "'Inter','Noto Serif SC',sans-serif",
    },
  },
  creative: {
    label: '创意粉',
    desc: '活泼粉色，适合作品设计',
    vars: {
      '--mao-primary': '#db2777', '--mao-primary-hover': '#be185d',
      '--mao-bg': '#fdf2f8', '--mao-surface': '#ffffff',
      '--mao-text': '#500724', '--mao-text-secondary': '#6b7280',
      '--font-family': "'Poppins','Noto Sans SC',sans-serif",
    },
  },
  minimal: {
    label: '极简灰',
    desc: '黑白灰，极简克制',
    vars: {
      '--mao-primary': '#374151', '--mao-primary-hover': '#1f2937',
      '--mao-bg': '#f9fafb', '--mao-surface': '#ffffff',
      '--mao-text': '#111827', '--mao-text-secondary': '#9ca3af',
      '--font-family': "'Inter','Noto Sans SC',sans-serif",
    },
  },
  nature: {
    label: '自然绿',
    desc: '大地色系，自然亲和',
    vars: {
      '--mao-primary': '#65a30d', '--mao-primary-hover': '#4d7c0f',
      '--mao-bg': '#f7fee7', '--mao-surface': '#ffffff',
      '--mao-text': '#365314', '--mao-text-secondary': '#6b7280',
      '--font-family': "'Inter','Noto Sans SC',sans-serif",
    },
  },
  'dark-pro': {
    label: '深色专业',
    desc: '暗色主题，专业护眼',
    vars: {
      '--mao-primary': '#60a5fa', '--mao-primary-hover': '#3b82f6',
      '--mao-bg': '#0f172a', '--mao-surface': '#1e293b',
      '--mao-text': '#f1f5f9', '--mao-text-secondary': '#94a3b8',
      '--mao-border': '#334155', '--mao-border-light': '#1e293b',
      '--mao-glass-bg': 'rgba(15,23,42,0.82)',
      '--mao-glass-border': 'rgba(51,65,85,0.5)',
      '--mao-shadow-sm': '0 1px 2px rgba(0,0,0,0.3)',
      '--mao-shadow-md': '0 4px 12px rgba(0,0,0,0.35)',
      '--mao-shadow-lg': '0 12px 32px rgba(0,0,0,0.45)',
      '--mao-shadow-xl': '0 20px 48px rgba(0,0,0,0.55)',
      '--font-family': "'Inter','Noto Sans SC',sans-serif",
      '--mao-primary-soft': 'rgba(96,165,250,0.12)',
      '--mao-surface-hover': '#273549',
      '--mao-text-muted': '#64748b',
    },
  },
}

/** @param {string} id */
export function applySkin(id) {
  const skin = skins[id] || skins.default
  const el = document.documentElement
  Object.entries(skin.vars).forEach(([k, v]) => el.style.setProperty(k, v))
  el.setAttribute('data-skin', id)
}

export const SKIN_LIST = Object.entries(skins).map(([id, s]) => ({ id, label: s.label, desc: s.desc }))
