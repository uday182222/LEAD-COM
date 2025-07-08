import React, { useState, useEffect, useMemo } from 'react';

const FieldSelection = ({ availableFields, onFieldSelection, onPresetLoad }) => {
  const [selectedFields, setSelectedFields] = useState([]);
  const [maxFields] = useState(5); // Maximum number of fields user can select
  const [presets, setPresets] = useState([]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [previewMessage, setPreviewMessage] = useState('');

  // Debug logging
  console.log('FieldSelection component props:', { availableFields, onFieldSelection });
  console.log('Available fields length:', availableFields?.length);
  console.log('Selected fields:', selectedFields);

  // Sample data for preview - memoized to prevent unnecessary re-renders
  const sampleData = useMemo(() => ({
    first_name: 'John',
    last_name: 'Doe',
    company: 'Tech Corp',
    job_title: 'Manager',
    city: 'Mumbai',
    industry: 'Technology',
    phone: '9876543210',
    email: 'john.doe@techcorp.com'
  }), []);

  // Load presets from localStorage on component mount
  useEffect(() => {
    const savedPresets = localStorage.getItem('fieldPresets');
    if (savedPresets) {
      setPresets(JSON.parse(savedPresets));
    }
  }, []);

  // Update preview when selected fields change
  useEffect(() => {
    let message = 'Hi {first_name}, I hope this message finds you well.';
    
    selectedFields.forEach(field => {
      if (field !== 'first_name' && field !== 'email' && field !== 'phone') {
        message += `\n\nI noticed you work at {${field}} and thought you might be interested in our services.`;
      }
    });
    
    message += '\n\nBest regards,\nYour Team';
    
    // Replace placeholders with sample data
    let preview = message;
    Object.keys(sampleData).forEach(key => {
      preview = preview.replace(new RegExp(`{${key}}`, 'g'), sampleData[key]);
    });
    
    setPreviewMessage(preview);
  }, [selectedFields, sampleData]);

  const handleFieldToggle = (field) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else if (selectedFields.length < maxFields) {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const savePreset = () => {
    if (!presetName.trim()) return;
    
    const newPreset = {
      id: Date.now(),
      name: presetName,
      fields: selectedFields
    };
    
    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem('fieldPresets', JSON.stringify(updatedPresets));
    setPresetName('');
    setShowPresetModal(false);
  };

  const loadPreset = (preset) => {
    setSelectedFields(preset.fields);
    onFieldSelection(preset.fields);
  };

  const deletePreset = (presetId) => {
    const updatedPresets = presets.filter(p => p.id !== presetId);
    setPresets(updatedPresets);
    localStorage.setItem('fieldPresets', JSON.stringify(updatedPresets));
  };

  const getFieldDisplayName = (field) => {
    const fieldNames = {
      first_name: 'First Name',
      last_name: 'Last Name',
      company: 'Company',
      job_title: 'Job Title',
      city: 'City',
      state: 'State',
      industry: 'Industry',
      phone: 'Phone',
      email: 'Email',
      website: 'Website',
      linkedin_url: 'LinkedIn',
      notes: 'Notes',
      source: 'Source'
    };
    return fieldNames[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getFieldDescription = (field) => {
    const descriptions = {
      first_name: 'Personalize with first name',
      last_name: 'Use for formal communication',
      company: 'Reference their organization',
      job_title: 'Mention their role',
      industry: 'Industry-specific messaging',
      phone: 'For call campaigns',
      email: 'Email address (always included)',
      website: 'Reference their website',
      linkedin_url: 'LinkedIn profile link',
      notes: 'Custom notes or tags',
      source: 'Lead source information'
    };
    return descriptions[field] || 'Additional field for personalization';
  };

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: '2rem auto', 
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{ 
          color: '#64ffda', 
          marginBottom: '0.5rem', 
          fontSize: '2.5rem',
          fontWeight: 'bold',
          textShadow: '0 0 20px rgba(100, 255, 218, 0.3)'
        }}>
          🎯 Select Outreach Fields
        </h2>
        <p style={{ color: '#8892b0', fontSize: '1.1rem' }}>
          Choose up to {maxFields} fields to personalize your outreach messages
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '2rem',
        width: '100%',
        maxWidth: '1200px'
      }}>
        {/* Field Selection Panel */}
        <div style={{
          background: 'rgba(26, 26, 46, 0.9)',
          borderRadius: 16,
          padding: '24px',
          border: '1px solid rgba(100, 255, 218, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h3 style={{ 
              color: '#64ffda', 
              fontSize: '1.5rem',
              fontWeight: 'bold',
              margin: 0
            }}>
              📋 Available Fields
            </h3>
            <div style={{ 
              color: '#8892b0', 
              fontSize: '14px',
              background: 'rgba(136, 146, 176, 0.1)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(136, 146, 176, 0.2)'
            }}>
              {selectedFields.length}/{maxFields} selected
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr', 
            gap: '12px',
            marginBottom: '24px'
          }}>
            {availableFields.map((field) => (
              <div
                key={field}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: selectedFields.includes(field) ? '2px solid #64ffda' : '2px solid rgba(136, 146, 176, 0.3)',
                  background: selectedFields.includes(field) ? 'rgba(100, 255, 218, 0.1)' : 'rgba(136, 146, 176, 0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedFields.includes(field) ? '0 4px 12px rgba(100, 255, 218, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}
                onClick={() => handleFieldToggle(field)}
                onMouseEnter={(e) => {
                  if (!selectedFields.includes(field)) {
                    e.target.style.borderColor = '#64ffda';
                    e.target.style.background = 'rgba(100, 255, 218, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedFields.includes(field)) {
                    e.target.style.borderColor = 'rgba(136, 146, 176, 0.3)';
                    e.target.style.background = 'rgba(136, 146, 176, 0.05)';
                  }
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: 'bold',
                      fontSize: '14px',
                      color: selectedFields.includes(field) ? '#64ffda' : '#ffffff',
                      marginBottom: '4px'
                    }}>
                      {getFieldDisplayName(field)}
                    </div>
                    <div style={{ 
                      fontSize: '12px',
                      color: selectedFields.includes(field) ? 'rgba(100, 255, 218, 0.7)' : '#8892b0'
                    }}>
                      {getFieldDescription(field)}
                    </div>
                  </div>
                  {selectedFields.includes(field) && (
                    <span style={{ 
                      color: '#64ffda',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      ✓
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Preset Management */}
          <div style={{ 
            borderTop: '1px solid rgba(136, 146, 176, 0.2)',
            paddingTop: '24px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h4 style={{ 
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: '#ffffff',
                margin: 0
              }}>
                💾 Field Presets
              </h4>
              <button
                onClick={() => setShowPresetModal(true)}
                disabled={selectedFields.length === 0}
                style={{
                  padding: '8px 16px',
                  background: selectedFields.length === 0 ? 'rgba(136, 146, 176, 0.3)' : 'linear-gradient(135deg, #64ffda, #4cd8b2)',
                  color: selectedFields.length === 0 ? '#8892b0' : '#1a1a2e',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: selectedFields.length === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedFields.length > 0 ? '0 4px 12px rgba(100, 255, 218, 0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (selectedFields.length > 0) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(100, 255, 218, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedFields.length > 0) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(100, 255, 218, 0.3)';
                  }
                }}
              >
                Save Preset
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: 'rgba(136, 146, 176, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(136, 146, 176, 0.2)'
                  }}
                >
                  <div>
                    <div style={{ 
                      fontWeight: 'bold',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}>
                      {preset.name}
                    </div>
                    <div style={{ 
                      fontSize: '12px',
                      color: '#8892b0'
                    }}>
                      {preset.fields.length} fields
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => loadPreset(preset)}
                      style={{
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #4cd8b2, #64ffda)',
                        color: '#1a1a2e',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 8px rgba(100, 255, 218, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deletePreset(preset.id)}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(220, 53, 69, 0.8)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(220, 53, 69, 1)';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(220, 53, 69, 0.8)';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {presets.length === 0 && (
                <div style={{ 
                  color: '#8892b0',
                  fontSize: '14px',
                  textAlign: 'center',
                  padding: '16px',
                  fontStyle: 'italic'
                }}>
                  No saved presets yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div style={{
          background: 'rgba(26, 26, 46, 0.9)',
          borderRadius: 16,
          padding: '24px',
          border: '1px solid rgba(100, 255, 218, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ 
            color: '#64ffda', 
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '24px',
            margin: '0 0 24px 0'
          }}>
            👀 Message Preview
          </h3>
          
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(136, 146, 176, 0.2)',
            marginBottom: '16px'
          }}>
            <div style={{ 
              fontSize: '12px',
              color: '#8892b0',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              Sample Message:
            </div>
            <div style={{
              whiteSpace: 'pre-wrap',
              color: '#ffffff',
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: '1.5'
            }}>
              {previewMessage}
            </div>
          </div>

          <div style={{
            background: 'rgba(100, 255, 218, 0.1)',
            border: '1px solid rgba(100, 255, 218, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ 
              fontSize: '12px',
              color: '#64ffda',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              📝 Selected Fields:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedFields.map((field) => (
                <span
                  key={field}
                  style={{
                    padding: '4px 8px',
                    background: 'rgba(100, 255, 218, 0.2)',
                    border: '1px solid rgba(100, 255, 218, 0.4)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#64ffda',
                    fontWeight: 'bold'
                  }}
                >
                  {getFieldDisplayName(field)}
                </span>
              ))}
              {selectedFields.length === 0 && (
                <span style={{ 
                  color: '#8892b0',
                  fontSize: '12px',
                  fontStyle: 'italic'
                }}>
                  No fields selected
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              console.log('Button clicked! Selected fields:', selectedFields);
              console.log('onFieldSelection function:', onFieldSelection);
              if (onFieldSelection && typeof onFieldSelection === 'function') {
                onFieldSelection(selectedFields);
              } else {
                console.error('onFieldSelection is not a function or is undefined');
                alert('Error: Field selection handler is not properly configured.');
              }
            }}
            disabled={selectedFields.length === 0}
            style={{
              width: '100%',
              padding: '16px',
              background: selectedFields.length === 0 ? 'rgba(136, 146, 176, 0.3)' : 'linear-gradient(135deg, #64ffda, #4cd8b2)',
              color: selectedFields.length === 0 ? '#8892b0' : '#1a1a2e',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: selectedFields.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: selectedFields.length > 0 ? '0 8px 24px rgba(100, 255, 218, 0.4)' : 'none',
              transform: selectedFields.length > 0 ? 'translateY(0)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (selectedFields.length > 0) {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 12px 32px rgba(100, 255, 218, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedFields.length > 0) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 24px rgba(100, 255, 218, 0.4)';
              }
            }}
          >
            ✅ Confirm Field Selection
          </button>
        </div>
      </div>

      {/* Save Preset Modal */}
      {showPresetModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'rgba(26, 26, 46, 0.95)',
            borderRadius: '16px',
            padding: '24px',
            width: '400px',
            border: '1px solid rgba(100, 255, 218, 0.3)',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ 
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#64ffda',
              marginBottom: '16px',
              margin: '0 0 16px 0'
            }}>
              Save Field Preset
            </h3>
            <label htmlFor="presetName" style={{ color: '#64ffda', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
              Preset Name
            </label>
            <input
              id="presetName"
              name="presetName"
              type="text"
              placeholder="Enter preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(136, 146, 176, 0.1)',
                border: '1px solid rgba(136, 146, 176, 0.3)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#64ffda';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(136, 146, 176, 0.3)';
              }}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={savePreset}
                disabled={!presetName.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: !presetName.trim() ? 'rgba(136, 146, 176, 0.3)' : 'linear-gradient(135deg, #64ffda, #4cd8b2)',
                  color: !presetName.trim() ? '#8892b0' : '#1a1a2e',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: !presetName.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (presetName.trim()) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(100, 255, 218, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (presetName.trim()) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                Save
              </button>
              <button
                onClick={() => setShowPresetModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(136, 146, 176, 0.3)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(136, 146, 176, 0.5)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(136, 146, 176, 0.3)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldSelection; 