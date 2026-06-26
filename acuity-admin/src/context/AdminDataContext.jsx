import React, { createContext, useState, useContext, useEffect } from 'react';

const AdminDataContext = createContext();

export const useAdminData = () => useContext(AdminDataContext);

export const AdminDataProvider = ({ children }) => {
  const [rawData, setRawData] = useState([]);
  const [registry, setRegistry] = useState([]);
  const [queue, setQueue] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [heldEdits, setHeldEdits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/businesses');
        if (response.ok) {
          const data = await response.json();
          setRawData(data); // Retain exactly what was fetched for POSTing back later
          
          // Map extracted data to our table formats
          const mappedRegistry = data.map((b, index) => ({
            id: b.id,
            name: b.business_name || b.name || 'Unknown',
            owner: 'Unverified (Extracted)',
            status: (b.is_verified || b.status === 'Verified' || b.isVerified) 
              ? 'Verified' 
              : (b.status === 'Pending Verification' ? 'Pending Verification' : 'Unverified'),
            raw: b
          }));
          setRegistry(mappedRegistry);
          
          // Filter out already verified businesses for the Queue
          const unverifiedData = data
            .map((b, index) => ({ ...b, originalIndex: index })) // Track original position for the API POST
            .filter(b => !(b.is_verified || b.status === 'Verified' || b.isVerified));

          // Fetch the real Verification Match Queue
          const queueRes = await fetch('http://localhost:5000/api/bplo/queue');
          if (queueRes.ok) {
             const queueData = await queueRes.json();
             setQueue(queueData);
          }
          
          // Fetch held edits
          const heldRes = await fetch('http://localhost:5000/api/held-edits');
          if (heldRes.ok) {
             const heldData = await heldRes.json();
             setHeldEdits(heldData);
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

          // Map real flagged businesses from payload
          const flaggedItems = data
            .map((b, index) => ({ ...b, originalIndex: index }))
            .filter(b => b.flagCount && b.flagCount > 0);
            
          const mappedFlagged = flaggedItems
            .map((b, index) => ({
              id: `FLAG-${b.originalIndex + 500}`,
              name: b.name || b.business_name || 'Unknown',
              flags: b.flagCount,
              reason: getMostCommonReason(b.flagReasons),
              status: b.status || 'Under Review',
              raw: b,
              originalIndex: b.originalIndex
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
  }, []);

  const approveQueueItem = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/bplo/queue/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        setQueue(prev => prev.filter(item => item.id !== id));
        // We should really re-fetch registry here, but for now just force a reload
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to approve queue item', err);
    }
  };

  const rejectQueueItem = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/bplo/queue/${id}/reject`, { method: 'POST' });
      if (res.ok) {
        setQueue(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to reject queue item', err);
    }
  };

  const removeFlaggedItem = async (id) => {
    const item = flagged.find(f => f.id === id);
    if (!item) return;
    
    const targetIndex = item.originalIndex;
    const updatedRaw = [...rawData];

    if (updatedRaw[targetIndex]) {
      updatedRaw[targetIndex].flagCount = 0;
      updatedRaw[targetIndex].flagReasons = [];
      
      try {
        await fetch('http://localhost:5000/api/businesses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedRaw)
        });
      } catch (err) {
        console.error('Failed to sync to backend', err);
      }
      setRawData(updatedRaw);
    }
    
    setFlagged(prev => prev.filter(f => f.id !== id));
  };

  const investigateFlaggedItem = async (id) => {
    const item = flagged.find(f => f.id === id);
    if (!item) return;

    const targetIndex = item.originalIndex;
    const updatedRaw = [...rawData];

    if (updatedRaw[targetIndex]) {
      updatedRaw[targetIndex].status = 'Investigating';
      
      try {
        await fetch('http://localhost:5000/api/businesses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedRaw)
        });
      } catch (err) {
        console.error('Failed to sync to backend', err);
      }
      setRawData(updatedRaw);
    }

    setFlagged(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, status: 'Investigating' };
      }
      return f;
    }));
  };

  const approveHeldEdit = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/held-edits/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        setHeldEdits(prev => prev.filter(item => item.id !== id));
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to approve held edit', err);
    }
  };

  const rejectHeldEdit = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/held-edits/${id}/reject`, { method: 'POST' });
      if (res.ok) {
        setHeldEdits(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to reject held edit', err);
    }
  };

  return (
    <AdminDataContext.Provider value={{
      registry, setRegistry,
      queue, approveQueueItem, rejectQueueItem,
      flagged, setFlagged, isLoading,
      removeFlaggedItem, investigateFlaggedItem,
      heldEdits, approveHeldEdit, rejectHeldEdit
    }}>
      {children}
    </AdminDataContext.Provider>
  );
};
