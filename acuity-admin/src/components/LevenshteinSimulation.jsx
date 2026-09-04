import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const levenshtein = (s1, s2) => {
    if (!s1 || !s2) return { score: 0, edits: 0, max_len: 0, path: [] };
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    const rows = s1.length + 1;
    const cols = s2.length + 1;
    const distance = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let i = 1; i < rows; i++) distance[i][0] = i;
    for (let k = 1; k < cols; k++) distance[0][k] = k;

    for (let col = 1; col < cols; col++) {
        for (let row = 1; row < rows; row++) {
            const cost = s1[row - 1] === s2[col - 1] ? 0 : 1;
            distance[row][col] = Math.min(
                distance[row - 1][col] + 1,      // deletion
                distance[row][col - 1] + 1,      // insertion
                distance[row - 1][col - 1] + cost // substitution
            );
        }
    }
    
    // Backtrace
    const path = [];
    let r = rows - 1;
    let c = cols - 1;
    
    while (r > 0 || c > 0) {
        if (r > 0 && c > 0 && s1[r - 1] === s2[c - 1]) {
            path.push({ op: 'match', char: s1[r - 1] });
            r--; c--;
        } else if (r > 0 && c > 0 && distance[r][c] === distance[r - 1][c - 1] + 1) {
            path.push({ op: 'substitute', char: s2[c - 1] });
            r--; c--;
        } else if (r > 0 && distance[r][c] === distance[r - 1][c] + 1) {
            path.push({ op: 'delete', char: s1[r - 1] });
            r--;
        } else {
            path.push({ op: 'insert', char: s2[c - 1] });
            c--;
        }
    }
    path.reverse();

    const max_len = Math.max(s1.length, s2.length);
    const edits = distance[s1.length][s2.length];
    return { score: max_len ? 1.0 - (edits / max_len) : 1.0, edits, max_len, path };
};

const MockTerminal = styled.div`
    width: 100%;
    background: #0f111a;
    border-radius: var(--radius-md);
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    margin-top: 1rem;
`;

const TerminalHeader = styled.div`
    background: #1a1d27;
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;

    &::before {
        content: '';
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #ef4444;
        margin-right: 6px;
        box-shadow: 16px 0 0 #f59e0b, 32px 0 0 #10b981;
    }
`;

const TerminalBody = styled.div`
    padding: 1.5rem;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.85rem;
    color: #e2e8f0;
    line-height: 1.5;
`;

const TerminalInput = styled.input`
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.85rem;
    width: 100%;
    margin-bottom: 8px;

    &:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 8px rgba(20, 184, 166, 0.3);
    }
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const CharSubstitute = styled.span`
    color: #f59e0b;
    font-weight: bold;
    text-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
`;

const CharInsert = styled.span`
    color: #10b981;
    font-weight: bold;
    text-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
`;

const CharDelete = styled.span`
    color: #ef4444;
    text-decoration: line-through;
    font-weight: bold;
`;

const CharMatch = styled.span`
    color: #38bdf8;
    font-weight: bold;
    text-shadow: 0 0 8px rgba(56, 189, 248, 0.5);
    background: rgba(56, 189, 248, 0.15);
    border-radius: 3px;
`;

const TerminalLine = styled.div`
    margin-bottom: 4px;
`;

const tokenizeAndSort = (str) => {
    return (str || "").toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/).sort().join(" ");
};

function LevenshteinSimulation({ sourceText, targetText }) {
    const [levA, setLevA] = useState(sourceText || "");
    const [levB, setLevB] = useState(targetText || "");
    
    // We compute the token-sorted versions
    const sortedA = tokenizeAndSort(levA);
    const sortedB = tokenizeAndSort(levB);
    
    const [levResult, setLevResult] = useState(levenshtein(sortedA, sortedB));
    
    const [simFrame, setSimFrame] = useState(-1);
    const [isSimulating, setIsSimulating] = useState(false);

    const startSimulation = () => {
        if (isSimulating || !levResult.path || !levResult.path.length) return;
        setIsSimulating(true);
        setSimFrame(0);
    };

    useEffect(() => {
        setLevResult(levenshtein(tokenizeAndSort(levA), tokenizeAndSort(levB)));
    }, [levA, levB]);

    useEffect(() => {
        let timer;
        if (isSimulating && simFrame >= 0 && simFrame < levResult.path.length) {
            timer = setTimeout(() => {
                setSimFrame(prev => prev + 1);
            }, 600);
        } else if (simFrame === levResult.path.length) {
            setIsSimulating(false);
        }
        return () => clearTimeout(timer);
    }, [isSimulating, simFrame, levResult.path]);

    return (
        <MockTerminal>
            <TerminalHeader>Interactive Python Simulator (Token-Sort Ratio)</TerminalHeader>
            <TerminalBody>
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '8px' }}>
                    <TerminalInput 
                        type="text" 
                        value={levA} 
                        onChange={(e) => { setLevA(e.target.value); setSimFrame(-1); setIsSimulating(false); }} 
                        placeholder="Input A" 
                        disabled={isSimulating} 
                    />
                    <TerminalInput 
                        type="text" 
                        value={levB} 
                        onChange={(e) => { setLevB(e.target.value); setSimFrame(-1); setIsSimulating(false); }} 
                        placeholder="Input B" 
                        disabled={isSimulating} 
                    />
                </div>
                
                <div style={{ marginBottom: '1rem', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Token-Sorted Forms:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: '#f59e0b' }}>[A] {sortedA || "..."}</span>
                        <span style={{ color: '#10b981' }}>[B] {sortedB || "..."}</span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <TerminalLine style={{ flex: 1, height: '24px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                        {simFrame === -1 || simFrame === levResult.path.length ? (
                            <span><span style={{color: 'var(--text-muted)'}}>Result:</span> {levResult.path.length > 0 && simFrame === levResult.path.length ? sortedB : sortedA}</span>
                        ) : (
                            <span style={{ fontFamily: 'monospace', whiteSpace: 'pre' }}>
                                <span style={{color: 'var(--text-muted)'}}>Anim: </span>
                                <span style={{ color: '#e2e8f0' }}>
                                    {levResult.path.slice(0, simFrame).filter(p => p.op !== 'delete').map(p => p.char).join('')}
                                    {(() => {
                                        const active = levResult.path[simFrame];
                                        if (!active) return null;
                                        if (active.op === 'match') return <CharMatch>{active.char}</CharMatch>;
                                        if (active.op === 'substitute') return <CharSubstitute>{active.char}</CharSubstitute>;
                                        if (active.op === 'insert') return <CharInsert>{active.char}</CharInsert>;
                                        if (active.op === 'delete') return <CharDelete>{active.char}</CharDelete>;
                                        return null;
                                    })()}
                                    {(() => {
                                        const consumed = levResult.path.slice(0, simFrame + 1).filter(p => p.op !== 'insert').length;
                                        return sortedA.substring(consumed);
                                    })()}
                                </span>
                            </span>
                        )}
                    </TerminalLine>
                    <button 
                        className="btn" 
                        style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: isSimulating ? 'not-allowed' : 'pointer', fontSize: '0.75rem', opacity: isSimulating ? 0.5 : 1 }} 
                        onClick={startSimulation} 
                        disabled={isSimulating}
                    >
                        Simulate
                    </button>
                </div>

                <TerminalLine>Max Length: {levResult.max_len}</TerminalLine>
                <TerminalLine>Edits Required: {simFrame >= 0 ? levResult.path.slice(0, Math.min(simFrame, levResult.path.length)).filter(p => p.op !== 'match').length : levResult.edits} / {levResult.edits}</TerminalLine>
                <TerminalLine style={{ color: levResult.score >= 0.8 ? '#10b981' : levResult.score >= 0.6 ? '#f59e0b' : '#ef4444' }}>
                    Final Score: {(levResult.score * 100).toFixed(2)}% {levResult.score >= 0.8 ? '(Auto-Verified)' : levResult.score >= 0.6 ? '(Manual Review)' : '(Mismatch)'}
                </TerminalLine>
            </TerminalBody>
        </MockTerminal>
    );
}

export default LevenshteinSimulation;
