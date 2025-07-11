import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext.js';
import toast from 'react-hot-toast';

const SESConfigPanel = () => {
  const { colors } = useTheme();
  const [config, setConfig] = useState({
    awsRegion: '',
    awsAccessKeyId: '',
    awsSecretAccessKey: '',
    emailFrom: '',
    method: 'ses-api'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({
    isConnected: false,
    method: 'unknown',
    fromEmail: '',
    configStatus: {}
  });

  useEffect(() => {
    fetchConfig();
    fetchStatus();
  }, []);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  const fetchConfig = async () => {
    try {
      // In a real app, you'd fetch the current config from backend
      // For now, we'll use placeholder values
      setConfig({
        awsRegion: process.env.REACT_APP_AWS_REGION || 'us-east-1',
        awsAccessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID || '',
        awsSecretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY || '',
        emailFrom: process.env.REACT_APP_EMAIL_FROM || '',
        method: 'ses-api'
      });
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/test-email`);
      if (response.ok) {
        const data = await response.json();
        setStatus({
          isConnected: data.isConnected || false,
          method: data.configStatus?.method || 'unknown',
          fromEmail: data.fromEmail || '',
          configStatus: data.configStatus || {}
        });
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/ses-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          awsRegion: config.awsRegion,
          awsAccessKeyId: config.awsAccessKeyId,
          awsSecretAccessKey: config.awsSecretAccessKey,
          emailFrom: config.emailFrom
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('SES configuration saved successfully!');
        setIsEditing(false);
        
        // Refresh status after saving
        setTimeout(() => {
          fetchStatus();
        }, 1000);
      } else {
        toast.error(data.error || 'Failed to save SES configuration');
      }
      
    } catch (error) {
      toast.error('Failed to save SES configuration');
      console.error('Error saving config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      const response = await fetch(`${API_URL}/api/test-email`);
      const data = await response.json();
      
      if (data.isConnected) {
        toast.success('SES connection test successful!');
      } else {
        toast.error('SES connection test failed');
      }
      
      fetchStatus(); // Refresh status
    } catch (error) {
      toast.error('Error testing SES connection');
      console.error('Error testing connection:', error);
    }
  };

  const getStatusColor = () => {
    return status.isConnected ? colors.success : colors.error;
  };

  const getStatusIcon = () => {
    return status.isConnected ? '✅' : '❌';
  };

  return (
    <div style={{
      background: colors.surface,
      borderRadius: '16px',
      padding: '2rem',
      border: `1px solid ${colors.border}`,
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h2 style={{
          color: colors.primary,
          fontSize: '1.5rem',
          margin: 0
        }}>
          ⚙️ Amazon SES Configuration
        </h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={handleTestConnection}
            style={{
              padding: '0.5rem 1rem',
              background: colors.info,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            🔄 Test Connection
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              padding: '0.5rem 1rem',
              background: isEditing ? colors.warning : colors.primary,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {isEditing ? 'Cancel' : 'Edit Config'}
          </button>
        </div>
      </div>

      {/* Status Display */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <span style={{ fontSize: '2rem' }}>{getStatusIcon()}</span>
          <div>
            <div style={{
              fontWeight: 'bold',
              fontSize: '1.1rem',
              color: getStatusColor()
            }}>
              {status.isConnected ? 'Connected to Amazon SES' : 'Not Connected'}
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: colors.textSecondary
            }}>
              Method: {status.method === 'ses-api' ? 'SES API' : status.method} • 
              From: {status.fromEmail || 'Not configured'}
            </div>
          </div>
        </div>

        {status.configStatus?.issues && status.configStatus.issues.length > 0 && (
          <div style={{
            background: `${colors.error}20`,
            border: `1px solid ${colors.error}40`,
            borderRadius: '8px',
            padding: '1rem',
            marginTop: '1rem'
          }}>
            <strong style={{ color: colors.error }}>Configuration Issues:</strong>
            <ul style={{ margin: '0.5rem 0 0 1rem', color: colors.error }}>
              {status.configStatus.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Configuration Form */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
        padding: '1.5rem'
      }}>
        <h3 style={{
          color: colors.text,
          marginBottom: '1.5rem',
          fontSize: '1.2rem'
        }}>
          SES Configuration
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: colors.text,
              fontWeight: 'bold'
            }} htmlFor="awsRegion">
              AWS Region
            </label>
            <input
              id="awsRegion"
              type="text"
              name="awsRegion"
              value={config.awsRegion}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="us-east-1"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                background: isEditing ? colors.background : colors.surface,
                color: colors.text,
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: colors.text,
              fontWeight: 'bold'
            }} htmlFor="awsAccessKeyId">
              AWS Access Key ID
            </label>
            <input
              id="awsAccessKeyId"
              type="text"
              name="awsAccessKeyId"
              value={config.awsAccessKeyId}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="AKIA..."
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                background: isEditing ? colors.background : colors.surface,
                color: colors.text,
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: colors.text,
              fontWeight: 'bold'
            }} htmlFor="awsSecretAccessKey">
              AWS Secret Access Key
            </label>
            <input
              id="awsSecretAccessKey"
              type="password"
              name="awsSecretAccessKey"
              value={config.awsSecretAccessKey}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="••••••••••••••••••••••••••••••••"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                background: isEditing ? colors.background : colors.surface,
                color: colors.text,
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: colors.text,
              fontWeight: 'bold'
            }} htmlFor="emailFrom">
              From Email Address
            </label>
            <input
              id="emailFrom"
              type="email"
              name="emailFrom"
              value={config.emailFrom}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="your-email@domain.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                background: isEditing ? colors.background : colors.surface,
                color: colors.text,
                fontSize: '0.9rem'
              }}
            />
          </div>
        </div>

        {isEditing && (
          <div style={{
            marginTop: '2rem',
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                padding: '0.75rem 1.5rem',
                background: colors.surface,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '0.75rem 1.5rem',
                background: colors.success,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                opacity: isSaving ? 0.7 : 1
              }}
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: `${colors.info}10`,
        border: `1px solid ${colors.info}30`,
        borderRadius: '12px'
      }}>
        <h4 style={{
          color: colors.info,
          marginBottom: '1rem',
          fontSize: '1.1rem'
        }}>
          💡 Amazon SES Setup Guide
        </h4>
        <div style={{
          color: colors.textSecondary,
          fontSize: '0.9rem',
          lineHeight: '1.6'
        }}>
          <p><strong>1. AWS Account Setup:</strong></p>
          <ul style={{ margin: '0.5rem 0 1rem 1rem' }}>
            <li>Create an AWS account if you don't have one</li>
            <li>Navigate to Amazon SES in the AWS Console</li>
            <li>Verify your email address or domain</li>
          </ul>
          
          <p><strong>2. IAM User Creation:</strong></p>
          <ul style={{ margin: '0.5rem 0 1rem 1rem' }}>
            <li>Create an IAM user with SES permissions</li>
            <li>Generate Access Key ID and Secret Access Key</li>
            <li>Attach the "AmazonSESFullAccess" policy</li>
          </ul>
          
          <p><strong>3. Sandbox Mode:</strong></p>
          <ul style={{ margin: '0.5rem 0 1rem 1rem' }}>
            <li>New SES accounts start in sandbox mode</li>
            <li>You can only send to verified email addresses</li>
            <li>Request production access to send to any email</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SESConfigPanel; 