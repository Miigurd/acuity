import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const AdminDataContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAdminData = () => useContext(AdminDataContext);

export const AdminDataProvider = ({ children }) => {
  const [rawData, setRawData] = useState([]);
  const [registry, setRegistry] = useState([]);
  const [queue, setQueue] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [heldEdits, setHeldEdits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('admin_token'));

  const login = (newToken) => {
    localStorage.setItem('admin_token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
  };

  const fetchWithAuth = useCallback(async (url, options = {}) => {
    const headers = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(url, { ...options, headers });
    
    // Automatically logout if token expires
    if (response.status === 401) {
      logout();
    }
    
    return response;
  }, [token]);


  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/businesses');
        if (response.ok) {
          const payload = await response.json();
          const data = payload.data || payload;
          setRawData(data); // Retain exactly what was fetched for POSTing back later
          
          // Map extracted data to our table formats
          const addZ = (ts) => (ts && !ts.endsWith('Z') && !ts.includes('+')) ? ts + 'Z' : ts;
          
          const mappedRegistry = data.map((b) => ({
            id: b.id,
            name: b.business_name || b.name || 'Unknown',
            owner: 'Unverified (Extracted)',
            status: b.status === 'Restricted' 
              ? 'Restricted' 
              : ((b.is_verified || b.status === 'Verified' || b.isVerified) 
                ? 'Verified' 
                : (b.status === 'Pending Verification' ? 'Pending Verification' : 'Unverified')),
            timestamp: addZ((b.status_history && b.status_history.length > 0) 
              ? b.status_history[0].timestamp 
              : (b.published_at || b.created || new Date().toISOString())),
            raw: b
          }));
          setRegistry(mappedRegistry);
          


          // Fetch the real Verification Match Queue
          const queueRes = await fetchWithAuth((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/bplo/queue');
          if (queueRes.ok) {
             const queueData = await queueRes.json();
             setQueue(queueData);
          }
          
          // Fetch held edits
          const heldRes = await fetchWithAuth((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/held-edits');
          if (heldRes.ok) {
             const heldData = await heldRes.json();
             setHeldEdits(heldData.map(h => ({
               ...h,
               timestamp: addZ(h.timestamp)
             })));
          }
          
          // Helper to find the most frequent string in an array
          const getMostCommonReason = (reasons) => {
            if (!Array.isArray(reasons) || reasons.length === 0) return 'Community reported';
            const frequency = {};
            let maxCount = 0;
            let commonReason = reasons[0];
            
            for (const r of reasons) {
              if (typeof r !== 'string') continue;
              frequency[r] = (frequency[r] || 0) + 1;
              if (frequency[r] > maxCount) {
                maxCount = frequency[r];
                commonReason = r;
              }
            }
            return commonReason;
          };

          // Map real flagged businesses from payload (include both active and archived flags)
          const flaggedItems = data
            .map((b, index) => ({ ...b, originalIndex: index }))
            .filter(b => (b.flagCount && b.flagCount > 0) || (b.allFlagCount && b.allFlagCount > 0) || b.flag_status === 'Archived' || b.flag_status === 'Restricted' || b.flag_status === 'Investigating');
            
          const mappedFlagged = flaggedItems
            .map((b) => ({
              id: `FLAG-${b.originalIndex + 500}`,
              name: b.name || b.business_name || 'Unknown',
              flags: b.flagCount,
              allFlags: b.allFlagCount,
              reason: getMostCommonReason(b.flagReasons),
              flag_status: b.flag_status || 'Flagged',
              raw: b,
              originalIndex: b.originalIndex,
              status_history: b.status_history || []
            }));
          setFlagged(mappedFlagged);
        }
      } catch (error) {
        console.error("Failed to fetch extracted businesses:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBusinesses();

    const socket = io((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '');
    socket.on('business_updated', () => {
        fetchBusinesses();
    });
    socket.on('business_flagged', () => {
        fetchBusinesses();
    });
    socket.on('analytics_updated', () => {
        fetchBusinesses();
    });

    return () => socket.disconnect();
  }, [fetchWithAuth]);

  const approveQueueItem = async (id) => {
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/bplo/queue/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        setQueue(prev => prev.filter(item => !item.matches.some(m => m.match_id === id)));
      }
    } catch (err) {
      console.error('Failed to approve queue item', err);
    }
  };

  const rejectQueueItem = async (id) => {
    if (!window.confirm("Are you sure you want to permanently reject this match?")) return;
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/bplo/queue/${id}/reject`, { method: 'POST' });
      if (res.ok) {
        setQueue(prev => prev.filter(item => !item.matches.some(m => m.match_id === id)));
      }
    } catch (err) {
      console.error('Failed to reject queue item', err);
    }
  };

  const archiveFlaggedItem = async (id) => {
    const item = flagged.find(f => f.id === id);
    if (!item) return;
    
    const targetIndex = item.originalIndex;
    const updatedRaw = [...rawData];

    if (updatedRaw[targetIndex]) {
      const updatedItem = { ...updatedRaw[targetIndex], flag_status: 'None', flagCount: 0 };
      updatedRaw[targetIndex] = updatedItem;
            try {
          await fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/businesses/${updatedItem.id}/flag-status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ flag_status: 'Safe' })
          });
        } catch (err) {
        console.error('Failed to sync to backend', err);
      }
      setRawData(updatedRaw);
    }
    
    // An archived item is removed from the active flagged list in the frontend UI view
    setFlagged(prev => prev.map(f => f.id === id ? { ...f, flag_status: 'None', flagCount: 0 } : f));
  };

  const investigateFlaggedItem = async (id) => {
    const item = flagged.find(f => f.id === id);
    if (!item) return;

    const targetIndex = item.originalIndex;
    const updatedRaw = [...rawData];

    if (updatedRaw[targetIndex]) {
      const updatedItem = { ...updatedRaw[targetIndex], flag_status: 'Investigating' };
      updatedRaw[targetIndex] = updatedItem;
      
      try {
        await fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/businesses/${updatedItem.id}/flag-status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flag_status: 'Investigating' })
        });
      } catch (err) {
        console.error('Failed to sync to backend', err);
      }
      setRawData(updatedRaw);
    }

    setFlagged(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, flag_status: 'Investigating' };
      }
      return f;
    }));
  };

  const restrictFlaggedItem = async (id) => {
    const item = flagged.find(f => f.id === id);
    if (!item) return;

    const targetIndex = item.originalIndex;
    const updatedRaw = [...rawData];

    if (updatedRaw[targetIndex]) {
      const updatedItem = { ...updatedRaw[targetIndex], flag_status: 'Restricted', status: 'Restricted', flagCount: 0 };
      updatedRaw[targetIndex] = updatedItem;
      
      try {
        await fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/businesses/${updatedItem.id}/flag-status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flag_status: 'Restricted' })
        });
      } catch (err) {
        console.error('Failed to sync to backend', err);
      }
      setRawData(updatedRaw);
      setRegistry(prev => prev.map(r => r.id === id ? { ...r, status: 'Restricted' } : r));
    }

    setFlagged(prev => prev.map(f => f.id === id ? { ...f, flag_status: 'Restricted', flagCount: 0 } : f));
  };

  const approveHeldEdit = async (id) => {
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/held-edits/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        setHeldEdits(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to approve held edit', err);
    }
  };

  const rejectHeldEdit = async (id) => {
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/held-edits/${id}/reject`, { method: 'POST' });
      if (res.ok) {
        setHeldEdits(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to reject held edit', err);
    }
  };

  return (
    <AdminDataContext.Provider value={{
      token, login, logout, fetchWithAuth,
      registry, setRegistry,
      queue, approveQueueItem, rejectQueueItem,
      flagged, setFlagged, isLoading,
      archiveFlaggedItem, investigateFlaggedItem, restrictFlaggedItem,
      heldEdits, approveHeldEdit, rejectHeldEdit
    }}>
      {children}
    </AdminDataContext.Provider>
  );
};
