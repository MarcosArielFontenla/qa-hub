// Design helpers ported from the Claude Design source (soft-utils.jsx).
// Pure functions used across the soft-style UI.

export function projColor(key?: string | null): string {
  const map: Record<string, string> = {
    CHK: '#E4A53A', AUTH: '#4F8DEF', API: '#7C5CFF', MOB: '#34C77B', ADM: '#E55747'
  };
  return (key && map[key]) || '#9B83FF';
}

export function projEmoji(key?: string | null): string {
  const map: Record<string, string> = {
    CHK: '🛒', AUTH: '🔐', API: '⚡️', MOB: '📱', ADM: '⚙️'
  };
  return (key && map[key]) || '📦';
}

const AVATAR_PALETTES = [
  'linear-gradient(135deg,#FFB6E2,#B6A8FF)',
  'linear-gradient(135deg,#FFD89B,#FF8FB1)',
  'linear-gradient(135deg,#B6E5FF,#7C5CFF)',
  'linear-gradient(135deg,#C8F3D6,#4DC990)',
  'linear-gradient(135deg,#FFE2BE,#F4906A)',
  'linear-gradient(135deg,#E6D9FF,#9277FF)'
];

export function avatarColor(name?: string | null): string {
  if (!name) return 'linear-gradient(135deg,#CFC8DC,#A09BB0)';
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[idx];
}

export function initialsOf(name?: string | null): string {
  if (!name) return '·';
  return name.split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export function tagClass(tag: string): string {
  const t = tag.toLowerCase();
  if (t.includes('smoke')) return 'tag-smoke';
  if (t.includes('reg')) return 'tag-reg';
  if (t.includes('api') || t.includes('login') || t.includes('payments')) return 'tag-api';
  if (t.includes('mobile')) return 'tag-mobile';
  if (t.includes('critical')) return 'tag-critical';
  if (t.includes('flaky')) return 'tag-flaky';
  return '';
}

export function fmtRel(iso?: string | null): string {
  if (!iso) return '—';
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (seconds < 60) return 'hace segundos';
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)}h`;
  return `hace ${Math.floor(seconds / 86400)}d`;
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Returns HTML with kw-* spans matching soft.css (.gherkin .kw-*). The input is
// HTML-escaped first because gherkinText comes from real Jira data (no raw HTML).
// Supports English and Spanish keywords.
export function highlightGherkin(text: string): string {
  return (text || '')
    .split('\n')
    .map((rawLine) =>
      escapeHtml(rawLine)
        .replace(/^(\s*)(@[\w@\s-]+)$/, (_m, sp: string, tags: string) => `${sp}<span class="kw-tag">${tags}</span>`)
        .replace(/^(\s*)((?:Feature|Característica|Funcionalidad):)(.*)$/, '$1<span class="kw-feat">$2</span>$3')
        .replace(/^(\s*)((?:Scenario(?: Outline)?|Esquema del escenario|Escenario):)(.*)$/, '$1<span class="kw-scen">$2</span>$3')
        .replace(/^(\s*)(Given|Dado)(\s)/, '$1<span class="kw-given">$2</span>$3')
        .replace(/^(\s*)(When|Cuando)(\s)/, '$1<span class="kw-when">$2</span>$3')
        .replace(/^(\s*)(Then|Entonces)(\s)/, '$1<span class="kw-then">$2</span>$3')
        .replace(/^(\s*)(And|But|Y|Pero)(\s)/, '$1<span class="kw-and">$2</span>$3')
        .replace(/"([^"]+)"/g, '<span class="str">"$1"</span>')
    )
    .join('\n');
}
