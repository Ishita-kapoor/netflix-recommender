"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import "../app/globals.css";

const API = "http://127.0.0.1:8000";
const posterCache = {};
// ── Poster image with TMDB fetch ─────────────────────────────────────────────
function Poster({ title, className }) {
  // const [url, setUrl] = useState(null);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   fetch(`${API}/poster?title=${encodeURIComponent(title)}`)
  //     .then(r => r.json())
  //     .then(d => { setUrl(d.poster_url); setLoading(false); })
  //     .catch(() => setLoading(false));
  // }, [title]);
  const [url, setUrl] = useState(posterCache[title] ?? null);
  const [loading, setLoading] = useState(!posterCache[title]);

  useEffect(() => {
    if (posterCache[title] !== undefined) return;  // already cached
    fetch(`${API}/poster?title=${encodeURIComponent(title)}`)
      .then(r => r.json())
      .then(d => {
        posterCache[title] = d.poster_url;
        setUrl(d.poster_url);
        setLoading(false);
      })
      .catch(() => {
        posterCache[title] = null;
        setLoading(false);
      });
  }, [title]);

  if (loading) return <div className={`skeleton ${className}`} />;
  if (!url) return (
    <div className={`${className} flex items-center justify-center`}
      style={{ background: 'var(--surface2)' }}>
      <span style={{ color: 'var(--muted)', fontSize: 12 }}>No poster</span>
    </div>
  );
  return <img src={url} alt={title} className={className} style={{ objectFit: 'cover' }} />;
}


// ── Expanded card overlay ────────────────────────────────────────────────────
function ExpandedCard({ card, onClose }) {
  const ref = useRef(null);
  useOutsideClick(ref, onClose);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* backdrop */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.85)' }} />

      <motion.div ref={ref}
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="relative w-full max-w-lg rounded-2xl overflow-hidden z-10"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

        {/* poster */}
        <div style={{ position: 'relative', height: 280 }}>
          <Poster title={card.title} className="w-full h-full" />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, var(--surface) 0%, transparent 60%)'
          }} />
          {/* close */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(0,0,0,0.6)', border: 'none',
            borderRadius: '50%', width: 32, height: 32,
            color: '#fff', cursor: 'pointer', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>×</button>

          {/* source badge */}
          <span style={{
            position: 'absolute', top: 12, left: 12,
            background: card.source === 'tmdb' ? '#1d4ed8' : 'var(--red)',
            color: '#fff', fontSize: 10, fontWeight: 700,
            padding: '3px 8px', borderRadius: 4, letterSpacing: 1,
            textTransform: 'uppercase'
          }}>{card.source === 'tmdb' ? 'TMDB' : 'Netflix DB'}</span>
        </div>

        {/* info */}
        <div style={{ padding: '0 24px 28px' }}>
          <h2 className="display-font" style={{ fontSize: 32, lineHeight: 1, marginBottom: 8 }}>
            {card.title}
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={badgeStyle('var(--surface2)')}>{card.type}</span>
            <span style={badgeStyle('var(--surface2)')}>{card.release_year}</span>
            {card.rating !== 'Unknown' &&
              <span style={badgeStyle('var(--red-dark)')}>{card.rating}</span>}
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>
            {card.listed_in}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function badgeStyle(bg) {
  return {
    background: bg, color: 'var(--text)',
    fontSize: 11, padding: '3px 10px',
    borderRadius: 20, fontWeight: 500
  };
}

// ── Single recommendation card ───────────────────────────────────────────────
function RecCard({ card, index, source, onClick }) {
  return (
    <div className="fade-up" style={{ animationDelay: `${index * 60}ms` }}>
      <motion.div onClick={() => onClick({ ...card, source })}
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
          transition: 'border-color 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--red)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>

        {/* poster */}
        <div style={{ height: 200, position: 'relative' }}>
          <Poster title={card.title} className="w-full h-full" />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, var(--surface) 0%, transparent 70%)'
          }} />
        </div>

        {/* info */}
        <div style={{ padding: '10px 14px 14px' }}>
          <h3 style={{
            fontSize: 14, fontWeight: 600, marginBottom: 4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {card.title}
          </h3>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>
            {card.type} · {card.release_year}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Skeleton grid ─────────────────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: 16, marginTop: 32
    }}>
      {Array(10).fill(0).map((_, i) => (
        <div key={i} style={{
          background: 'var(--surface)', borderRadius: 12, overflow: 'hidden',
          border: '1px solid var(--border)'
        }}>
          <div className="skeleton" style={{ height: 200 }} />
          <div style={{ padding: '10px 14px 14px' }}>
            <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 10, width: '50%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
// ── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [query, setQuery] = useState('');
  const [titles, setTitles] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState('');
  const [source, setSource] = useState('local');
  const [page, setPage] = useState(0);
  const [activeCard, setActiveCard] = useState(null);
  const [error, setError] = useState('');
  const dropRef = useRef(null);
  useOutsideClick(dropRef, () => setShowDrop(false));

  // load titles for autocomplete
  useEffect(() => {
    fetch(`${API}/titles`)
      .then(r => r.json())
      .then(d => setTitles(d.titles))
      .catch(() => { });
  }, []);

  const filtered = query.length > 1
    ? titles.filter(t => t.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  const fetchRecs = useCallback(async (title, pg) => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${API}/recommend?title=${encodeURIComponent(title)}&page=${pg}`);
      if (!r.ok) throw new Error('Not found');
      const d = await r.json();
      setResults(d.recommendations);
      setSource(d.source);
      setSearched(title);
    } catch {
      setError(`Could not find "${title}". Try a different title.`);
      setResults([]);
    }
    setLoading(false);
  }, []);

  const handleSearch = (title) => {
    const t = title || query;
    if (!t.trim()) return;
    setQuery(t);
    setShowDrop(false);
    setPage(0);
    fetchRecs(t, 0);
  };

  const handleRefresh = () => {
    const next = page + 1;
    setPage(next);
    fetchRecs(searched, next);
  };

  return (
    <main style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(to bottom, #1a0000 0%, var(--bg) 100%)',
        padding: '60px 24px 48px', textAlign: 'center'
      }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>
          <h1 className="display-font" style={{
            fontSize: 'clamp(48px, 10vw, 96px)',
            color: 'var(--red)', letterSpacing: 2, lineHeight: 1
          }}>WHAT TO WATCH</h1>
          <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 15 }}>
            Powered by Sentence-BERT · KNN · Hybrid Matching
          </p>
        </motion.div>

        {/* search bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ position: 'relative', maxWidth: 560, margin: '32px auto 0' }}
          ref={dropRef}>

          <div style={{ display: 'flex', gap: 0 }}>
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setShowDrop(true); }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              onFocus={() => setShowDrop(true)}
              placeholder="Search a show or movie..."
              style={{
                flex: 1, padding: '14px 20px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRight: 'none', borderRadius: '8px 0 0 8px',
                color: 'var(--text)', fontSize: 15, outline: 'none',
                fontFamily: 'DM Sans, sans-serif'
              }}
            />
            <button onClick={() => handleSearch()}
              style={{
                padding: '14px 24px', background: 'var(--red)',
                border: 'none', borderRadius: '0 8px 8px 0',
                color: '#fff', fontWeight: 700, cursor: 'pointer',
                fontSize: 14, fontFamily: 'DM Sans, sans-serif',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.target.style.background = 'var(--red-dark)'}
              onMouseLeave={e => e.target.style.background = 'var(--red)'}>
              SEARCH
            </button>
          </div>

          {/* autocomplete dropdown */}
          <AnimatePresence>
            {showDrop && filtered.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 8, marginTop: 4, zIndex: 100,
                  listStyle: 'none', overflow: 'hidden', textAlign: 'left'
                }}>
                {filtered.map(t => (
                  <li key={t} onClick={() => handleSearch(t)}
                    style={{
                      padding: '10px 16px', cursor: 'pointer',
                      fontSize: 14, borderBottom: '1px solid var(--border)',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {t}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Results ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>

        {error && (
          <p style={{ textAlign: 'center', color: 'var(--red)', marginTop: 40 }}>{error}</p>
        )}

        {loading && <SkeletonGrid />}

        {!loading && results.length > 0 && (
          <>
            {/* results header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 20
            }}>
              <div>
                <h2 className="display-font" style={{ fontSize: 28, letterSpacing: 1 }}>
                  Because you searched{' '}
                  <span style={{ color: 'var(--red)' }}>{searched}</span>
                </h2>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {source === 'tmdb' ? '⚡ Matched via TMDB' : '📂 Matched from local DB'}
                  {' · '}Page {page + 1}
                </p>
              </div>

              <button onClick={handleRefresh}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', background: 'transparent',
                  border: '1px solid var(--border)', borderRadius: 8,
                  color: 'var(--text)', cursor: 'pointer', fontSize: 13,
                  fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--red)';
                  e.currentTarget.style.color = 'var(--red)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text)';
                }}>
                ↻ Refresh Results
              </button>
            </div>

            {/* grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 16
            }}>
              {results.map((card, i) => (
                <RecCard key={`${card.title}-${i}`} card={card} index={i}
                  source={source} onClick={setActiveCard} />
              ))}
            </div>
          </>
        )}

        {!loading && !error && results.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 80 }}>
            <p className="display-font" style={{ fontSize: 48, color: 'var(--border)' }}>
              SEARCH ANYTHING
            </p>
            <p style={{ color: 'var(--muted)', marginTop: 8 }}>
              Try Breaking Bad, Dune, Squid Game...
            </p>
          </div>
        )}
      </div>

      {/* ── Expanded card ── */}
      <AnimatePresence>
        {activeCard && (
          <ExpandedCard card={activeCard} onClose={() => setActiveCard(null)} />
        )}
      </AnimatePresence>
      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '24px',
        textAlign: 'center',
        marginTop: 40
      }}>
        <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 2 }}>
          Built by{' '}
          <a href="https://github.com/Ishita-kapoor" target="_blank"
            style={{ color: 'var(--red)', textDecoration: 'none', fontWeight: 600 }}
            onMouseEnter={e => e.target.style.textDecoration = 'underline'}
            onMouseLeave={e => e.target.style.textDecoration = 'none'}>
            Ishita Kapoor
          </a>
          {' '}· VIT Vellore '26 · ML Project
          <br />
          <span style={{ fontSize: 11 }}>
            Powered by{' '}
            <a href="https://www.themoviedb.org" target="_blank"
              style={{ color: 'var(--muted)', textDecoration: 'underline' }}>
              TMDB API
            </a>
            {' '}· Sentence-BERT · KNN
          </span>
        </p>
      </footer>
    </main>
  );
}