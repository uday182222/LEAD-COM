import React from 'react';
import { useParams } from 'react-router-dom';

const TemplateBuilder = () => {
  const { campaignId } = useParams();

  const startCampaign = async () => {
    console.log("📤 Starting campaign with hardcoded template variables");
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // ⛔ Do NOT send template_variables anymore
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
      <button onClick={startCampaign}>
        🚀 Start Campaign with Hardcoded Template
      </button>
    </div>
  );
};

export default TemplateBuilder;