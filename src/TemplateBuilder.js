import React, { useState } from 'react';

const TemplateBuilder = ({ selectedFields, onTemplateComplete }) => {
  // Remove subject state and input field from TemplateBuilder

  // ... other template building logic ...

  const handleComplete = () => {
    // Collect template data here (e.g., from state)
    const templateData = {
      // ...fill with other actual template data...
    };
    onTemplateComplete(templateData);
  };

  return (
    <div style={{ padding: '2rem' }}>
      {/* Editable subject field */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="template-subject" style={{ fontWeight: 'bold', marginRight: '1rem' }}>Subject:</label>
        <input
          id="template-subject"
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Enter email subject..."
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            fontSize: '1rem',
            width: '320px',
          }}
        />
      </div>
      {/* ...template builder UI... */}
      <button
        onClick={handleComplete}
        style={{
          background: '#1595e7',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          padding: '14px 32px',
          border: 'none',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(21,149,231,0.15)',
          cursor: 'pointer',
          marginTop: '2rem',
          transition: 'background 0.2s',
        }}
        onMouseOver={e => { e.currentTarget.style.background = '#0d7bc1'; }}
        onMouseOut={e => { e.currentTarget.style.background = '#1595e7'; }}
      >
        ✅ Save Template & Proceed to Campaign Creation
      </button>
    </div>
  );
};

export default TemplateBuilder;