import React, { useState, useEffect } from 'react';

const PendingLeadsManager = ({ onProceedToCampaign, onBackToUpload, onLeadsUpdated }) => {
  const [pendingLeads, setPendingLeads] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPendingLeads();
    fetchPendingCount();
  }, []);

  const fetchPendingLeads = async () => {
    try {
      // Request more leads (1000 instead of default 100)
      const response = await fetch('/api/leads?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setPendingLeads(data.leads || []);
      } else {
        console.error('Failed to fetch pending leads');
      }
    } catch (error) {
      console.error('Error fetching pending leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const response = await fetch('/api/pending-leads-count');
      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  };

  const handleSelectLead = (leadId) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === pendingLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(pendingLeads.map(lead => lead.id));
    }
  };

  const deleteLead = async (leadId) => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setMessage('Lead deleted successfully');
        fetchPendingLeads();
        fetchPendingCount();
        if (onLeadsUpdated) onLeadsUpdated();
      } else {
        setMessage('Failed to delete lead');
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      setMessage('Error deleting lead');
    } finally {
      setDeleting(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const deleteSelectedLeads = async () => {
    if (selectedLeads.length === 0) {
      setMessage('Please select leads to delete');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch('/api/leads/delete-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ leadIds: selectedLeads })
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        setSelectedLeads([]);
        fetchPendingLeads();
        fetchPendingCount();
        if (onLeadsUpdated) onLeadsUpdated();
      } else {
        setMessage('Failed to delete selected leads');
      }
    } catch (error) {
      console.error('Error deleting leads:', error);
      setMessage('Error deleting leads');
    } finally {
      setDeleting(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const clearAllLeads = async () => {
    if (!window.confirm('Are you sure you want to clear ALL pending leads? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch('/api/leads/clear-all', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        setSelectedLeads([]);
        fetchPendingLeads();
        fetchPendingCount();
        if (onLeadsUpdated) onLeadsUpdated();
      } else {
        setMessage('Failed to clear all leads');
      }
    } catch (error) {
      console.error('Error clearing all leads:', error);
      setMessage('Error clearing all leads');
    } finally {
      setDeleting(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        color: '#64ffda',
        fontSize: '18px'
      }}>
        Loading pending leads...
      </div>
    );
  }

  if (pendingLeads.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#8892b0'
      }}>
        <h3 style={{ color: '#64ffda', marginBottom: '20px' }}>
          No Pending Leads
        </h3>
        <p style={{ marginBottom: '30px' }}>
          There are no pending leads in the database. Upload a file to get started.
        </p>
        <button
          onClick={onBackToUpload}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #64ffda, #4cd8b2)',
            color: '#1a1a2e',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          📁 Upload New File
        </button>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        background: 'rgba(26, 26, 46, 0.9)',
        borderRadius: '16px',
        border: '1px solid rgba(100, 255, 218, 0.2)'
      }}>
        <div>
          <h2 style={{ 
            color: '#64ffda', 
            marginBottom: '8px',
            fontSize: '2rem'
          }}>
            📋 Pending Leads Manager
          </h2>
          <p style={{ color: '#8892b0', margin: 0 }}>
            {pendingCount} leads ready for campaign creation
            {pendingLeads.length < pendingCount && (
              <span style={{ color: '#64ffda', marginLeft: '8px' }}>
                (Showing {pendingLeads.length} of {pendingCount})
              </span>
            )}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onProceedToCampaign}
            disabled={pendingLeads.length === 0}
            style={{
              padding: '12px 24px',
              background: pendingLeads.length === 0 
                ? 'rgba(136, 146, 176, 0.3)' 
                : 'linear-gradient(135deg, #64ffda, #4cd8b2)',
              color: pendingLeads.length === 0 ? '#8892b0' : '#1a1a2e',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: pendingLeads.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🚀 Create Campaign
          </button>
          
          <button
            onClick={onBackToUpload}
            style={{
              padding: '12px 24px',
              background: 'rgba(136, 146, 176, 0.2)',
              color: '#8892b0',
              border: '1px solid rgba(136, 146, 176, 0.3)',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            📁 Upload More
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: '12px 20px',
          marginBottom: '20px',
          borderRadius: '8px',
          background: message.includes('success') 
            ? 'rgba(100, 255, 218, 0.2)' 
            : 'rgba(255, 100, 100, 0.2)',
          color: message.includes('success') ? '#64ffda' : '#ff6464',
          border: `1px solid ${message.includes('success') ? 'rgba(100, 255, 218, 0.4)' : 'rgba(255, 100, 100, 0.4)'}`
        }}>
          {message}
        </div>
      )}

      {/* Bulk Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '16px',
        background: 'rgba(100, 255, 218, 0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(100, 255, 218, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="checkbox"
            checked={selectedLeads.length === pendingLeads.length && pendingLeads.length > 0}
            onChange={handleSelectAll}
            style={{ transform: 'scale(1.2)' }}
          />
          <span style={{ color: '#64ffda', fontWeight: 'bold' }}>
            Select All ({selectedLeads.length}/{pendingLeads.length})
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {selectedLeads.length > 0 && (
            <button
              onClick={deleteSelectedLeads}
              disabled={deleting}
              style={{
                padding: '8px 16px',
                background: 'rgba(255, 100, 100, 0.8)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: deleting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {deleting ? 'Deleting...' : `🗑️ Delete Selected (${selectedLeads.length})`}
            </button>
          )}
          
          <button
            onClick={clearAllLeads}
            disabled={deleting}
            style={{
              padding: '8px 16px',
              background: 'rgba(255, 100, 100, 0.8)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: deleting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {deleting ? 'Clearing...' : '🗑️ Clear All'}
          </button>
        </div>
      </div>

      {/* Leads List */}
      <div style={{
        background: 'rgba(26, 26, 46, 0.9)',
        borderRadius: '16px',
        border: '1px solid rgba(100, 255, 218, 0.2)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          background: 'rgba(100, 255, 218, 0.1)',
          borderBottom: '1px solid rgba(100, 255, 218, 0.2)',
          fontWeight: 'bold',
          color: '#64ffda'
        }}>
          Pending Leads ({pendingLeads.length})
        </div>
        
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {pendingLeads.map((lead, index) => (
            <div
              key={lead.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(136, 146, 176, 0.1)',
                background: selectedLeads.includes(lead.id) 
                  ? 'rgba(100, 255, 218, 0.1)' 
                  : 'transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                type="checkbox"
                checked={selectedLeads.includes(lead.id)}
                onChange={() => handleSelectLead(lead.id)}
                style={{ 
                  marginRight: '16px',
                  transform: 'scale(1.1)'
                }}
              />
              
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div>
                    <span style={{
                      color: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      {lead.first_name} {lead.last_name}
                    </span>
                    <span style={{
                      color: '#8892b0',
                      marginLeft: '12px',
                      fontSize: '14px'
                    }}>
                      {lead.company}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => deleteLead(lead.id)}
                    disabled={deleting}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(255, 100, 100, 0.8)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: deleting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    🗑️ Clear
                  </button>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '8px',
                  fontSize: '14px'
                }}>
                  <span style={{ color: '#64ffda' }}>
                    📧 {lead.email}
                  </span>
                  <span style={{ color: '#8892b0' }}>
                    📞 {lead.phone}
                  </span>
                  <span style={{ color: '#8892b0' }}>
                    💼 {lead.job_title}
                  </span>
                  <span style={{ color: '#8892b0' }}>
                    🏢 {lead.industry}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PendingLeadsManager; 