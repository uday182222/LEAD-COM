import React from 'react';

const TemplateBuilder = ({ campaignId }) => {
  console.log("campaignId from prop:", campaignId);

  const startCampaign = async () => {
    if (!campaignId) return;
    console.log("📤 Starting campaign with hardcoded template variables");
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        console.log("✅ Campaign started successfully!");
      } else {
        console.error("❌ Failed to start campaign");
      }
    } catch (error) {
      console.error("⚠️ Error starting campaign:", error);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      {!campaignId && (
        <div style={{ color: '#ff5252', marginBottom: '1rem', fontWeight: 'bold' }}>
          ⚠️ Campaign ID is missing. Please create a campaign first.
        </div>
      )}
      <button
        onClick={startCampaign}
        disabled={!campaignId}
        style={{
          background: '#1595e7',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          padding: '14px 32px',
          border: 'none',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(21,149,231,0.15)',
          cursor: campaignId ? 'pointer' : 'not-allowed',
          marginTop: '2rem',
          opacity: campaignId ? 1 : 0.6,
          transition: 'background 0.2s',
        }}
        onMouseOver={e => { if (campaignId) e.currentTarget.style.background = '#0d7bc1'; }}
        onMouseOut={e => { if (campaignId) e.currentTarget.style.background = '#1595e7'; }}
      >
        🚀 Start Campaign with Hardcoded Template
      </button>
    </div>
  );
};

export default TemplateBuilder;