import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import '../styles/design-system.css';

const ITExpertValidation = () => {
  const [liveText, setLiveText] = useState('');
  const [extractedEntities, setExtractedEntities] = useState(null);
  const [expectedEntities, setExpectedEntities] = useState({
    business_name: '', category: '', location: ''
  });
  const [liveScore, setLiveScore] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });

  const showTooltip = (e, text) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      text,
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  };

  const hideTooltip = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const handleExtract = async () => {
    setIsExtracting(true);
    setLiveScore(null);
    try {
      const res = await fetch('http://localhost:5000/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: liveText })
      });
      const data = await res.json();
      
      // Map backend plural keys to singular UI keys
      const mappedData = {
        business_name: data.business_name || [],
        category: data.categories || [],
        location: data.locations || []
      };
      
      setExtractedEntities(mappedData);
    } catch (e) {
      console.error(e);
      alert('Error connecting to backend API for extraction.');
    } finally {
      setIsExtracting(false);
    }
  };

  const computeLiveScore = () => {
    if (!extractedEntities) return;
    
    const keys = ['business_name', 'category', 'location'];
    let totalTP = 0;
    let totalFP = 0;
    let totalFN = 0;
    
    const entityScores = keys.map(key => {
      const expected = (expectedEntities[key] || '').trim().toLowerCase();
      const extractedStr = Array.isArray(extractedEntities[key]) 
        ? extractedEntities[key].join(' ') 
        : (extractedEntities[key] || '');
      const extracted = extractedStr.trim().toLowerCase();
      
      let tp = 0, fp = 0, fn = 0;
      let interpretation = "";
      if (expected && extracted && expected === extracted) {
        tp = 1;
        interpretation = "Perfect Match";
      } else if (expected && !extracted) {
        fn = 1;
        interpretation = "Missed (False Negative)";
      } else if (!expected && extracted) {
        fp = 1;
        interpretation = "Over-extraction (False Positive)";
      } else if (expected && extracted && expected !== extracted) {
        fp = 1;
        fn = 1;
        interpretation = "Mismatch (Wrong extraction)";
      } else {
        interpretation = "Correctly Ignored";
      }
      
      totalTP += tp;
      totalFP += fp;
      totalFN += fn;
      
      const p = tp + fp === 0 ? 0 : tp / (tp + fp);
      const r = tp + fn === 0 ? 0 : tp / (tp + fn);
      const f1 = p + r === 0 ? 0 : 2 * (p * r) / (p + r);
      
      return { entity: key, precision: p, recall: r, f1: f1, expected, extracted, interpretation };
    });
    
    const microP = totalTP + totalFP === 0 ? 0 : totalTP / (totalTP + totalFP);
    const microR = totalTP + totalFN === 0 ? 0 : totalTP / (totalTP + totalFN);
    const microF1 = microP + microR === 0 ? 0 : 2 * (microP * microR) / (microP + microR);
    
    setLiveScore({ entityScores, microP, microR, microF1 });
  };
  // Mock data for the IT Expert Evaluation based on SOP 2
  const [metrics] = useState([
    { entity: 'Business Name', precision: 0.85, recall: 0.82, f1: 0.83 },
    { entity: 'Service Category', precision: 0.78, recall: 0.75, f1: 0.76 },
    { entity: 'Location Reference', precision: 0.90, recall: 0.88, f1: 0.89 },
  ]);

  // Overall micro-averaged score
  const overallF1 = 0.82; 

  const getF1Status = (f1) => {
    if (f1 >= 0.80) return { label: 'Good', color: 'var(--success-color, #10b981)' };
    if (f1 >= 0.70) return { label: 'Acceptable', color: 'var(--warning-color, #f59e0b)' };
    return { label: 'Requires Refinement', color: 'var(--danger-color, #ef4444)' };
  };

  return (
    <div className="container py-4">
      <div className="card">
        <h2 className="mb-2">IT Expert Validation Module</h2>
        <p className="text-muted mb-4">
          This hidden module is intended for IT expert validators to review the 
          Information Extraction (NER) pipeline performance as defined in SOP 2.
        </p>

        <div className="mb-4">
          <h3 className="mb-2">Evaluation Metrics (SOP 2)</h3>
          <p className="mb-3 text-muted">
            These scores tell us how smart the system is at reading a community post and automatically pulling out the business information.
          </p>
          <ul className="mb-4 space-y-2" style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
            <li>
              <strong>Precision (Accuracy of the Guesses):</strong> If the system highlights a word and says "this is a Business Name", how often is it actually right? A high score means the system rarely makes a wrong guess.
            </li>
            <li>
              <strong>Recall (Finding Everything):</strong> Out of all the actual Business Names mentioned in the post, how many did the system successfully catch? A high score means the system rarely misses anything important.
            </li>
            <li>
              <strong>F1-Score (The Overall Grade):</strong> This is the final balanced grade combining both Precision and Recall. It ensures the system is both accurate (doesn't guess wrong) and thorough (doesn't miss things).
            </li>
          </ul>
          
          <div className="card bg-light p-3">
            <h4>F1-Score Thresholds:</h4>
            <div className="flex gap-4 mt-2">
              <span style={{ color: 'var(--success-color, #10b981)', fontWeight: 'bold' }}>F1 &ge; 0.80 (Good)</span>
              <span style={{ color: 'var(--warning-color, #f59e0b)', fontWeight: 'bold' }}>0.70 &le; F1 &lt; 0.80 (Acceptable)</span>
              <span style={{ color: 'var(--danger-color, #ef4444)', fontWeight: 'bold' }}>F1 &lt; 0.70 (Requires Refinement)</span>
            </div>
          </div>
        </div>

        <h3 className="mb-3">NER Pipeline Performance</h3>
        
        <div className="table-responsive mb-4">
          <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color, #e5e7eb)' }}>
                <th className="px-4 py-3">Entity Type</th>
                <th className="px-4 py-3">Precision</th>
                <th className="px-4 py-3">Recall</th>
                <th className="px-4 py-3">F1-Score</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, idx) => {
                const status = getF1Status(m.f1);
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
                    <td className="px-4 py-3 font-medium">{m.entity}</td>
                    <td 
                      className="px-4 py-3" 
                      style={{cursor: 'help'}}
                      onMouseEnter={(e) => showTooltip(e, `When guessing a ${m.entity}, the system is correct ${Math.round(m.precision * 100)}% of the time.`)}
                      onMouseLeave={hideTooltip}
                    >
                      {m.precision.toFixed(2)}
                    </td>
                    <td 
                      className="px-4 py-3"
                      style={{cursor: 'help'}}
                      onMouseEnter={(e) => showTooltip(e, `Out of all actual ${m.entity} mentions, the system catches ${Math.round(m.recall * 100)}% of them.`)}
                      onMouseLeave={hideTooltip}
                    >
                      {m.recall.toFixed(2)}
                    </td>
                    <td 
                      className="px-4 py-3 font-bold"
                      style={{cursor: 'help'}}
                      onMouseEnter={(e) => showTooltip(e, `Overall grade for ${m.entity} balancing accuracy and catch rate.`)}
                      onMouseLeave={hideTooltip}
                    >
                      {m.f1.toFixed(2)}
                    </td>
                    <td className="px-4 py-3" style={{ color: status.color, fontWeight: 'bold' }}>
                      {status.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: 'var(--bg-secondary, #f3f4f6)' }}>
                <td className="px-4 py-4 font-bold" colSpan={3}>Overall Micro-Averaged F1-Score</td>
                <td className="px-4 py-4 font-bold text-lg">{overallF1.toFixed(2)}</td>
                <td className="px-4 py-4" style={{ color: getF1Status(overallF1).color, fontWeight: 'bold' }}>
                  {getF1Status(overallF1).label}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <hr className="my-4" />

        <h3 className="mb-3">Live Extraction Test</h3>
        <p className="text-muted mb-3">
          Paste a made-up community post below. Run the pipeline, input the expected entities (Ground Truth), and compute the actual score for this post.
        </p>

        <div className="mb-3">
          <textarea
            className="form-control w-full p-2 border rounded"
            rows="5"
            placeholder="Paste your dummy community post here..."
            value={liveText}
            onChange={(e) => setLiveText(e.target.value)}
          ></textarea>
        </div>
        <button 
          className="btn btn-primary mb-4"
          onClick={handleExtract}
          disabled={!liveText || isExtracting}
        >
          {isExtracting ? 'Running Pipeline...' : 'Run Pipeline'}
        </button>

        {extractedEntities && (
          <div className="card bg-light p-3 mb-4">
            <h4 className="mb-2">Pipeline Output & Ground Truth</h4>
            <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div><strong>Entity Type</strong></div>
              <div><strong>Extracted Value</strong></div>
            </div>
            {['business_name', 'category', 'location'].map(key => {
              const val = Array.isArray(extractedEntities[key]) 
                ? extractedEntities[key].join(', ') 
                : (extractedEntities[key] || '');
              return (
                <div key={key} className="grid gap-3 items-center mt-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="capitalize">{key.replace('_', ' ')}</div>
                  <div className="p-2 bg-white border rounded min-h-[40px]">{val || <span className="text-muted italic">None</span>}</div>
                </div>
              );
            })}

            <div className="mt-4">
              <h5 className="mb-2">Enter Expected Values (Ground Truth) to Compute Score:</h5>
              {['business_name', 'category', 'location'].map(key => (
                <div key={`exp-${key}`} className="grid gap-3 items-center mt-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="capitalize">Expected {key.replace('_', ' ')}</div>
                  <input 
                    type="text" 
                    className="form-control p-2 border rounded w-full"
                    value={expectedEntities[key]}
                    onChange={(e) => setExpectedEntities({...expectedEntities, [key]: e.target.value})}
                    placeholder={`Expected ${key.replace('_', ' ')}`}
                  />
                </div>
              ))}
              <button 
                className="btn btn-secondary mt-3"
                onClick={computeLiveScore}
              >
                Compute Actual Score
              </button>
            </div>
          </div>
        )}

        {liveScore && (
          <div className="card p-3" style={{ border: '2px solid var(--primary-color, #3b82f6)' }}>
            <h4 className="mb-3">Live Evaluation Results</h4>
            <table className="w-full text-left mt-4" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color, #e5e7eb)' }}>
                  <th className="px-4 py-3">Entity Type</th>
                  <th className="px-4 py-3">Precision</th>
                  <th className="px-4 py-3">Recall</th>
                  <th className="px-4 py-3">F1-Score</th>
                  <th className="px-4 py-3">Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {liveScore.entityScores.map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
                    <td className="px-4 py-3 font-medium capitalize">{s.entity.replace('_', ' ')}</td>
                    <td className="px-4 py-3">{s.precision.toFixed(2)}</td>
                    <td className="px-4 py-3">{s.recall.toFixed(2)}</td>
                    <td className="px-4 py-3 font-bold">{s.f1.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-muted">{s.interpretation}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: 'var(--bg-secondary, #f3f4f6)' }}>
                  <td className="px-4 py-4 font-bold">Micro-Averaged</td>
                  <td className="px-4 py-4 font-bold">{liveScore.microP.toFixed(2)}</td>
                  <td className="px-4 py-4 font-bold">{liveScore.microR.toFixed(2)}</td>
                  <td className="px-4 py-4 font-bold text-lg">{liveScore.microF1.toFixed(2)}</td>
                  <td className="px-4 py-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Global Fixed Tooltip */}
      {tooltip.visible && createPortal(
        <div 
          style={{ 
            position: 'fixed',
            zIndex: 99999,
            top: `${tooltip.y - 10}px`, 
            left: `${tooltip.x}px`,
            transform: 'translate(-50%, -100%)',
            whiteSpace: 'nowrap',
            backgroundColor: '#1f2937', 
            color: '#ffffff',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: 'normal',
            pointerEvents: 'none',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)'
          }}
        >
          {tooltip.text}
          <div 
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: '6px',
              borderStyle: 'solid',
              borderColor: '#1f2937 transparent transparent transparent'
            }}
          />
        </div>,
        document.body
      )}
    </div>
  );
};

export default ITExpertValidation;
