import React, { useState } from 'react';
import { FiActivity, FiPlay, FiAlertTriangle, FiCpu, FiLayers, FiFileText, FiClock, FiPhone } from 'react-icons/fi';
import { LANDMARKS } from '../context/MockDataContext';

const STEP_LABELS = ['Tokenize / IDF', 'Query Vector', 'Cosine Similarity', 'Haversine Distance', 'Composite Rank'];

const LiveBadge = () => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'rgba(16,185,129,0.15)', color: 'var(--success, #10b981)',
    border: '1px solid rgba(16,185,129,0.35)', borderRadius: '999px',
    padding: '3px 12px', fontSize: '0.75rem', fontWeight: 700
  }}>
    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }} />
    LIVE — REAL SYSTEM OUTPUT
  </span>
);

const SectionTitle = ({ step, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '18px 0 10px' }}>
    <span className="badge badge-navy" style={{ width: '26px', height: '26px', padding: 0, borderRadius: '50%', justifyContent: 'center' }}>{step}</span>
    <h4 style={{ fontWeight: 800, margin: 0, fontSize: '0.98rem' }}>{title}</h4>
  </div>
);

const CodeBox = ({ children }) => (
  <div style={{
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', fontFamily: 'monospace',
    fontSize: '0.78rem', padding: '10px 12px', maxHeight: '180px',
    overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word'
  }}>
    {children}
  </div>
);

const ExpertModeLive = () => {
  const [recQuery, setRecQuery] = useState('repair');
  const [recLandmark, setRecLandmark] = useState('brgy_banay_banay');
  const [trace, setTrace] = useState(null);
  const [isTracing, setIsTracing] = useState(false);
  const [traceError, setTraceError] = useState(null);

  const [extractText, setExtractText] = useState("Looking for a laundry shop near Brgy. Pulo, Cabuyao. Open 8am-5pm, 0917-123-4567.");
  const [extractTrace, setExtractTrace] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);

  const runRecommendTrace = async () => {
    setIsTracing(true);
    setTraceError(null);
    const lm = LANDMARKS.find(l => l.id === recLandmark) || LANDMARKS[0];
    try {
      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/expert/recommend-trace?q=${encodeURIComponent(recQuery)}&lat=${lm.latLng[0]}&lon=${lm.latLng[1]}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Backend returned an error');
      setTrace(data);
    } catch (e) {
      console.error(e);
      setTrace(null);
      setTraceError(`Live backend unavailable: ${e.message}`);
    } finally {
      setIsTracing(false);
    }
  };

  const runExtractTrace = async () => {
    setIsExtracting(true);
    setExtractError(null);
    try {
      const res = await fetch((process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api/expert/extract-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Backend returned an error');
      setExtractTrace(data);
    } catch (e) {
      console.error(e);
      setExtractTrace(null);
      setExtractError(`Live backend unavailable: ${e.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const renderRecommendation = () => (
    <div>
      <div className="card mb-6">
        <div className="flex justify-between items-center mb-2" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
            Live Recommendation Pipeline Trace
          </h3>
          <LiveBadge />
        </div>
        <p className="text-secondary text-sm mb-4">
          Runs the <strong>actual production engine</strong> (<code>acuity.recommendation.RecommendationEngine</code>) against the
          verified profiles in the live database — the same cached engine, corpus, and TF-IDF state that{' '}
          <code>/api/search</code> uses. Every number below is computed by Python, not re-simulated in the browser.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <div>
            <label className="text-muted font-bold" style={{ fontSize: '0.78rem' }}>QUERY:</label>
            <input
              type="text"
              className="form-control mt-1"
              value={recQuery}
              onChange={(e) => setRecQuery(e.target.value)}
              placeholder="e.g. repair, bakery, laundry..."
            />
          </div>
          <div>
            <label className="text-muted font-bold" style={{ fontSize: '0.78rem' }}>RESIDENT LOCATION:</label>
            <select
              className="form-control mt-1"
              value={recLandmark}
              onChange={(e) => setRecLandmark(e.target.value)}
            >
              {LANDMARKS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={runRecommendTrace} disabled={isTracing} style={{ width: '100%' }}>
              <FiPlay /> {isTracing ? 'Running Pipeline...' : 'Run Live Trace'}
            </button>
          </div>
        </div>
      </div>

      {traceError && (
        <div className="card" style={{ border: '1px solid var(--danger, #ef4444)', background: 'rgba(239,68,68,0.06)' }}>
          <div className="flex items-center gap-2 text-danger" style={{ fontWeight: 700 }}>
            <FiAlertTriangle /> {traceError}
          </div>
          <p className="text-secondary text-sm mt-2 mb-0">
            Make sure the backend is running (<code>python -m webapp.app</code> on port 5000).
          </p>
        </div>
      )}

      {trace && trace.error && !traceError && (
        <div className="card" style={{ border: '1px solid var(--warning, #f59e0b)', background: 'rgba(245,158,11,0.06)' }}>
          <div className="flex items-center gap-2" style={{ fontWeight: 700, color: 'var(--warning, #f59e0b)' }}>
            <FiAlertTriangle /> Empty Recommendation Corpus
          </div>
          <p className="text-secondary text-sm mt-2 mb-0">{trace.error}</p>
        </div>
      )}

      {trace && trace.corpus && trace.corpus.length > 0 && (
        <div className="card">
          {/* Pipeline steps */}
          <SectionTitle step="0" title="Pipeline Stages" />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
            {STEP_LABELS.map((label, i) => (
              <span key={i} className="badge badge-sky" style={{ fontSize: '0.75rem' }}>
                {i + 1}. {label}
              </span>
            ))}
          </div>

          {/* Weights */}
          <SectionTitle step="1" title={`Configuration & Weights (source: ${trace.source})`} />
          <CodeBox>
{JSON.stringify({
  relevance_weight: trace.weights.relevance_weight,
  proximity_weight: trace.weights.proximity_weight,
  top_k: trace.weights.top_k,
  engine: trace.engine,
  formula: 'final = (relevance_weight * cosine) + (proximity_weight * proximity)',
  proximity_formula: 'proximity = 1 / (1 + distance_km)'
}, null, 2)}
          </CodeBox>

          {/* Corpus */}
          <SectionTitle step="2" title={`Vectorized Corpus — ${trace.corpus.length} verified profile(s) from the live database`} />
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', overflow: 'auto', maxHeight: '260px' }}>
            <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                <tr>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>#</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Profile</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Vectorized Text</th>
                </tr>
              </thead>
              <tbody>
                {trace.corpus.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ padding: '8px', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '8px', fontSize: '0.72rem', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>{c.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Query vector */}
          <SectionTitle step="3" title={`Query Vector — "${trace.query || '(empty)'}"`} />
          <CodeBox>{JSON.stringify(trace.query_vector, null, 2)}</CodeBox>

          {/* IDF table */}
          <details style={{ marginTop: '16px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>
              IDF Weight Table ({trace.vocabulary_size} vocabulary terms)
            </summary>
            <div style={{ marginTop: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', overflow: 'auto', maxHeight: '240px' }}>
              <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  <tr>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Term</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>IDF = log(N/df)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(trace.idf_table).sort((a, b) => b[1] - a[1]).map(([term, idf]) => (
                    <tr key={term} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600 }}>{term}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-secondary)' }}>{idf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          {/* Ranked results */}
          <SectionTitle step="4" title="Final Ranked Output (identical to /api/search)" />
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', overflow: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse', minWidth: '640px' }}>
              <thead style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                <tr>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Rank</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Business</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Cosine</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Distance (km)</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Proximity</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Final Score</th>
                </tr>
              </thead>
              <tbody>
                {trace.results.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>#{i + 1}</td>
                    <td style={{ padding: '8px', fontWeight: 700 }}>{r.name}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{(r.relevance_score || 0).toFixed(4)}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{r.distance_km != null ? r.distance_km.toFixed(2) : '—'}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{(r.proximity_score || 0).toFixed(4)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 800, color: 'var(--primary)' }}>{(r.final_score || 0).toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Per-profile TF vectors */}
          <details style={{ marginTop: '16px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>
              Per-Profile TF-IDF Vectors ({trace.per_profile.length})
            </summary>
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {trace.per_profile.map((p, i) => (
                <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', padding: '10px 12px' }}>
                  <div className="flex justify-between mb-2" style={{ flexWrap: 'wrap', gap: '6px' }}>
                    <strong style={{ fontSize: '0.82rem' }}>{p.name}</strong>
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                      cosine {p.cosine_similarity} · dist {p.distance_km != null ? `${p.distance_km}km` : 'n/a'} · prox {p.proximity_score} · final {p.final_score}
                    </span>
                  </div>
                  <CodeBox>{JSON.stringify(p.tf_vector, null, 2)}</CodeBox>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );

  const renderExtraction = () => (
    <div className="card">
      <div className="flex justify-between items-center mb-2" style={{ flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
          Live Extraction Pipeline Trace (CRF NER)
        </h3>
        <LiveBadge />
      </div>
      <p className="text-secondary text-sm mb-4">
        Runs the <strong>real preprocessing → CRF NER → rule-based → profile construction</strong> pipeline
        (<code>acuity.extraction</code>) on the text below — the same code path that processes scraped community posts.
      </p>

      <textarea
        className="form-control mb-4"
        rows="3"
        value={extractText}
        onChange={(e) => setExtractText(e.target.value)}
      />

      <button className="btn btn-primary mb-4" onClick={runExtractTrace} disabled={isExtracting}>
        <FiPlay /> {isExtracting ? 'Running Extraction Pipeline...' : 'Run Live Extraction Trace'}
      </button>

      {extractError && (
        <div style={{ border: '1px solid var(--danger, #ef4444)', background: 'rgba(239,68,68,0.06)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontWeight: 700, color: 'var(--danger, #ef4444)' }}>
          <FiAlertTriangle /> {extractError}
        </div>
      )}

      {extractTrace && extractTrace.model_loaded === false && (
        <div style={{ border: '1px solid var(--warning, #f59e0b)', background: 'rgba(245,158,11,0.06)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
          <div style={{ fontWeight: 700, color: 'var(--warning, #f59e0b)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiAlertTriangle /> CRF model not loaded
          </div>
          <p className="text-secondary text-sm mt-1 mb-0">
            No trained <code>crf_model.pkl</code> found, so entity recognition returns no tags. Train it with{' '}
            <code>python train_crf.py</code> and place the model where <code>/api/extract</code> expects it.
            The other stages (preprocessing, rules, profile construction) still run live below.
          </p>
        </div>
      )}

      {extractTrace && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <SectionTitle step="1" title="Raw Post Text" />
            <CodeBox>{extractTrace.raw_text}</CodeBox>
          </div>

          <div>
            <SectionTitle step="2" title="Preprocessed (Unicode / URLs / Emoji / Whitespace)" />
            <CodeBox>{extractTrace.preprocessed_text}</CodeBox>
          </div>

          <div>
            <SectionTitle step="3" title={`Token-Level CRF BIO Predictions (${extractTrace.token_tags.length} tokens)`} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {extractTrace.token_tags.map((t, i) => (
                <span key={i} style={{
                  display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: '6px', padding: '3px 7px', fontSize: '0.7rem'
                }}>
                  <span style={{ fontWeight: 700 }}>{t.token}</span>
                  <span style={{
                    color: t.tag === 'O' ? 'var(--text-muted)' : '#ffffff',
                    background: t.tag.startsWith('B-') ? 'var(--primary)' : (t.tag.startsWith('I-') ? 'var(--secondary)' : 'transparent'),
                    borderRadius: '3px', padding: '0 4px', marginTop: '2px'
                  }}>
                    {t.tag}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle step="4" title="Grouped Entities" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                ['Business Name', extractTrace.entities.business_name],
                ['Category', extractTrace.entities.categories],
                ['Location', extractTrace.entities.locations]
              ].map(([label, values]) => (
                <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }} key={label}>
                  <span className="text-secondary">{label}:</span>
                  <strong>{values.length ? values.join(', ') : 'None Detected'}</strong>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle step="5" title="Rule-Based Structured Fields (regex patterns)" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
                <div className="flex items-center gap-2 text-muted mb-2" style={{ fontSize: '0.75rem', fontWeight: 700 }}><FiPhone /> PHONES</div>
                <div style={{ fontSize: '0.82rem' }}>{extractTrace.structured_fields.phones.length ? extractTrace.structured_fields.phones.join(', ') : 'None'}</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
                <div className="flex items-center gap-2 text-muted mb-2" style={{ fontSize: '0.75rem', fontWeight: 700 }}><FiClock /> HOURS</div>
                <div style={{ fontSize: '0.82rem' }}>{extractTrace.structured_fields.hours.length ? extractTrace.structured_fields.hours.join(', ') : 'None'}</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
                <div className="flex items-center gap-2 text-muted mb-2" style={{ fontSize: '0.75rem', fontWeight: 700 }}><FiFileText /> PRICES</div>
                <div style={{ fontSize: '0.82rem' }}>{extractTrace.structured_fields.prices.length ? extractTrace.structured_fields.prices.join(', ') : 'None'}</div>
              </div>
            </div>
          </div>

          <div>
            <SectionTitle step="6" title="Constructed Business Profile" />
            {extractTrace.profile ? (
              <CodeBox>{JSON.stringify(extractTrace.profile, null, 2)}</CodeBox>
            ) : (
              <div className="flex items-center gap-2 p-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid var(--warning, #f59e0b)', borderRadius: 'var(--radius-sm)' }}>
                <FiAlertTriangle style={{ color: 'var(--warning, #f59e0b)' }} />
                <span className="text-secondary text-sm">No profile constructed — insufficient extractable information (needs a business name, category, or contact).</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="card mb-6" style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.08), transparent)',
        border: '1px solid rgba(16,185,129,0.25)'
      }}>
        <div className="flex justify-between items-center mb-2" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <span className="badge badge-navy mb-0"><FiCpu /> EXPERT MODE — LIVE SYSTEM TRACE</span>
          <LiveBadge />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '6px 0 8px' }}>
          Demonstrate the system and algorithm as it actually runs
        </h3>
        <p className="text-secondary text-sm mb-0" style={{ maxWidth: '760px' }}>
          Unlike the sandboxes above (which re-implement the math in JavaScript on sample data), this mode connects to the{' '}
          <strong>real Flask backend</strong> and displays the exact intermediate values produced by the deployed Python
          pipeline — the same engine and database that power the live search. Use it to show evaluators precisely
          what the system computes, step by step.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="flex items-center gap-2 mb-2" style={{ fontWeight: 800, color: 'var(--primary)' }}>
            <FiLayers /> Recommendation Engine
          </div>
          <p className="text-secondary text-sm mb-0">
            TF-IDF vectorization → cosine relevance → Haversine proximity → weighted composite ranking
            over the live verified business corpus.
          </p>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="flex items-center gap-2 mb-2" style={{ fontWeight: 800, color: 'var(--secondary)' }}>
            <FiActivity /> NLP Extraction (NER)
          </div>
          <p className="text-secondary text-sm mb-0">
            Raw post → preprocessing → CRF BIO tagging → rule-based fields (phones/hours/prices) → business profile construction.
          </p>
        </div>
      </div>

      {renderRecommendation()}
      {renderExtraction()}
    </div>
  );
};

export default ExpertModeLive;
