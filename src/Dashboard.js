import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext.js';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { colors } = useTheme();
  const [stats, setStats] = useState({
    pendingLeads: 0,
    completedLeads: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    emailsSent: 0
  });
  const [campaignData, setCampaignData] = useState([]);
  const [leadData, setLeadData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState({ to: '', subject: '', body: '' });
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [emailConfig, setEmailConfig] = useState({
    status: 'unknown',
    method: 'unknown',
    fromEmail: '',
    isConnected: false,
    configStatus: {}
  });
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    type: '',
    data: [],
    title: ''
  });

  const [previewData, setPreviewData] = useState({
    campaigns: [],
    pendingLeads: [],
    completedLeads: 0
  });

  useEffect(() => {
    fetchDashboardData();
    fetchEmailConfig();
  }, []);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch campaigns
      const campaignsResponse = await fetch(`${API_URL}/api/campaigns`);
      const campaignsData = await campaignsResponse.json();
      
      // Fetch pending leads
      const pendingLeadsResponse = await fetch(`${API_URL}/api/leads/pending`);
      const pendingLeadsData = await pendingLeadsResponse.json();
      
      // Fetch completed leads count
      const completedLeadsResponse = await fetch(`${API_URL}/api/leads/completed/count`);
      const completedLeadsData = await completedLeadsResponse.json();
      
      if (campaignsData.success && pendingLeadsData.success && completedLeadsData.success) {
        const campaigns = campaignsData.campaigns || [];
        const pendingLeads = pendingLeadsData.leads || [];
        
        // Calculate stats
        const pendingLeadsCount = pendingLeadsData.totalLeads || 0;
        const completedLeadsCount = completedLeadsData.completedLeads || 0;
        const totalCampaigns = campaigns.length;
        const activeCampaigns = campaigns.filter(c => c.status === 'RUNNING').length;
        const emailsSent = campaigns.reduce((sum, c) => sum + (c.leadCount || 0), 0);
        
        setStats({
          pendingLeads: pendingLeadsCount,
          completedLeads: completedLeadsCount,
          totalCampaigns,
          activeCampaigns,
          emailsSent
        });

        // Store data for previews
        setPreviewData({
          campaigns: campaigns,
          pendingLeads: pendingLeads,
          completedLeads: completedLeadsData.completedLeads || 0
        });

        // Prepare campaign chart data
        const campaignChartData = campaigns.map(campaign => ({
          name: campaign.name,
          leads: campaign.leadCount || 0,
          status: campaign.status
        }));

        // Prepare lead source data
        const leadSources = {};
        pendingLeads.forEach(lead => {
          const source = lead.source || 'Unknown';
          leadSources[source] = (leadSources[source] || 0) + 1;
        });

        const leadSourceData = Object.entries(leadSources).map(([source, count]) => ({
          name: source,
          value: count
        }));

        setCampaignData(campaignChartData);
        setLeadData(leadSourceData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/test-email`);
      if (response.ok) {
        const data = await response.json();
        setEmailConfig({
          status: data.isConnected ? 'connected' : 'disconnected',
          method: data.configStatus?.method || 'unknown',
          fromEmail: data.fromEmail || '',
          isConnected: data.isConnected || false,
          configStatus: data.configStatus || {}
        });
      }
    } catch (error) {
      console.error('Error fetching email config:', error);
      setEmailConfig({
        status: 'error',
        method: 'unknown',
        fromEmail: '',
        isConnected: false,
        configStatus: {}
      });
    }
  };

  const handleTestEmailChange = (e) => {
    const { name, value } = e.target;
    setTestEmail(prev => ({ ...prev, [name]: value }));
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    setSendingTestEmail(true);
    try {
      const response = await fetch(`${API_URL}/api/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail.to,
          subject: testEmail.subject,
          body: testEmail.body
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Test email sent successfully!');
        setTestEmail({ to: '', subject: '', body: '' });
      } else {
        toast.error(data.error || 'Failed to send test email');
      }
    } catch (err) {
      toast.error('Error sending test email');
    } finally {
      setSendingTestEmail(false);
    }
  };

  const getEmailStatusColor = () => {
    switch (emailConfig.status) {
      case 'connected': return colors.success;
      case 'disconnected': return colors.error;
      case 'error': return colors.error;
      default: return colors.warning;
    }
  };

  const getEmailStatusIcon = () => {
    switch (emailConfig.status) {
      case 'connected': return '✅';
      case 'disconnected': return '❌';
      case 'error': return '⚠️';
      default: return '❓';
    }
  };

  const getEmailMethodDisplay = () => {
    switch (emailConfig.method) {
      case 'ses-api': return 'Amazon SES API';
      case 'smtp': return 'SMTP';
      default: return 'Unknown';
    }
  };

  const COLORS = [colors.primary, colors.secondary, colors.success, colors.warning, colors.error, colors.info];

  const handleStatClick = (type) => {
    let modalData = [];
    let title = '';
    
    switch (type) {
      case 'pendingLeads':
        modalData = previewData.pendingLeads;
        title = 'Pending Leads';
        break;
      case 'completedLeads':
        modalData = [];
        title = 'Completed Leads';
        break;
      case 'totalCampaigns':
        modalData = previewData.campaigns;
        title = 'All Campaigns';
        break;
      case 'activeCampaigns':
        modalData = previewData.campaigns.filter(c => c.status === 'RUNNING');
        title = 'Active Campaigns';
        break;
      case 'emailsSent':
        modalData = previewData.campaigns.filter(c => c.leadCount > 0);
        title = 'Email Campaigns';
        break;
      default:
        return;
    }
    
    setPreviewModal({
      isOpen: true,
      type: type,
      data: modalData,
      title: title
    });
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        color: colors.text 
      }}>
        <div style={{ 
          animation: 'spin 1s linear infinite',
          width: '40px',
          height: '40px',
          border: `4px solid ${colors.border}`,
          borderTop: `4px solid ${colors.primary}`,
          borderRadius: '50%'
        }}></div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '2rem',
      backgroundColor: colors.background,
      minHeight: '100vh',
      color: colors.text
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto' 
      }}>
        {/* Header */}
        <div style={{ 
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            color: colors.primary,
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            📊 Dashboard
          </h1>
          <p style={{ 
            color: colors.textSecondary,
            fontSize: '1.1rem'
          }}>
            Monitor your lead management performance
          </p>
        </div>

        {/* Email Service Status */}
        <div style={{
          background: colors.surface,
          borderRadius: '16px',
          padding: '1.5rem',
          border: `1px solid ${colors.border}`,
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{ 
              color: colors.primary,
              fontSize: '1.25rem',
              margin: 0
            }}>
              📧 Email Service Status
            </h3>
            <button
              onClick={() => setShowEmailConfig(!showEmailConfig)}
              style={{
                padding: '0.5rem 1rem',
                background: colors.primary,
                color: colors.background,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {showEmailConfig ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <span style={{ fontSize: '1.5rem' }}>{getEmailStatusIcon()}</span>
            <div>
              <div style={{ 
                fontWeight: 'bold',
                color: getEmailStatusColor()
              }}>
                {emailConfig.status === 'connected' ? 'Connected' : 
                 emailConfig.status === 'disconnected' ? 'Disconnected' : 
                 emailConfig.status === 'error' ? 'Error' : 'Unknown Status'}
              </div>
              <div style={{ 
                fontSize: '0.9rem',
                color: colors.textSecondary
              }}>
                {getEmailMethodDisplay()} • {emailConfig.fromEmail}
              </div>
            </div>
          </div>

          {showEmailConfig && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              padding: '1rem',
              marginTop: '1rem'
            }}>
              <h4 style={{ 
                color: colors.text,
                marginBottom: '0.5rem',
                fontSize: '1rem'
              }}>
                Configuration Details
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.5rem',
                fontSize: '0.9rem'
              }}>
                <div>
                  <strong>Method:</strong> {getEmailMethodDisplay()}
                </div>
                <div>
                  <strong>From Email:</strong> {emailConfig.fromEmail || 'Not configured'}
                </div>
                <div>
                  <strong>Status:</strong> 
                  <span style={{ color: getEmailStatusColor() }}>
                    {emailConfig.status}
                  </span>
                </div>
                <div>
                  <strong>Connected:</strong> 
                  <span style={{ color: emailConfig.isConnected ? colors.success : colors.error }}>
                    {emailConfig.isConnected ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              
              {emailConfig.configStatus?.issues && emailConfig.configStatus.issues.length > 0 && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.5rem',
                  background: `${colors.error}20`,
                  border: `1px solid ${colors.error}40`,
                  borderRadius: '6px'
                }}>
                  <strong style={{ color: colors.error }}>Configuration Issues:</strong>
                  <ul style={{ margin: '0.5rem 0 0 1rem', color: colors.error }}>
                    {emailConfig.configStatus.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <StatCard 
            title="Pending Leads" 
            value={stats.pendingLeads} 
            icon="⏳" 
            color={colors.warning}
            colors={colors}
            onClick={() => handleStatClick('pendingLeads')}
          />
          <StatCard 
            title="Completed Leads" 
            value={stats.completedLeads} 
            icon="✅" 
            color={colors.success}
            colors={colors}
            onClick={() => handleStatClick('completedLeads')}
          />
          <StatCard 
            title="Total Campaigns" 
            value={stats.totalCampaigns} 
            icon="📢" 
            color={colors.primary}
            colors={colors}
            onClick={() => handleStatClick('totalCampaigns')}
          />
          <StatCard 
            title="Active Campaigns" 
            value={stats.activeCampaigns} 
            icon="🚀" 
            color={colors.info}
            colors={colors}
            onClick={() => handleStatClick('activeCampaigns')}
          />
          <StatCard 
            title="Emails Sent" 
            value={stats.emailsSent} 
            icon="📧" 
            color={colors.secondary}
            colors={colors}
            onClick={() => handleStatClick('emailsSent')}
          />
        </div>

        {/* Charts Grid */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {/* Campaign Performance Chart */}
          <div style={{
            background: colors.surface,
            borderRadius: '16px',
            padding: '1.5rem',
            border: `1px solid ${colors.border}`
          }}>
            <h3 style={{ 
              color: colors.primary,
              marginBottom: '1rem',
              fontSize: '1.25rem'
            }}>
              📈 Campaign Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={campaignData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis 
                  dataKey="name" 
                  stroke={colors.textSecondary}
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke={colors.textSecondary} fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    color: colors.text
                  }}
                />
                <Bar dataKey="leads" fill={colors.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lead Sources Chart */}
          <div style={{
            background: colors.surface,
            borderRadius: '16px',
            padding: '1.5rem',
            border: `1px solid ${colors.border}`
          }}>
            <h3 style={{ 
              color: colors.primary,
              marginBottom: '1rem',
              fontSize: '1.25rem'
            }}>
              📊 Lead Sources
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leadData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leadData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    color: colors.text
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Email Chart */}
          <div style={{
            background: colors.surface,
            borderRadius: '16px',
            padding: '1.5rem',
            border: `1px solid ${colors.border}`
          }}>
            <h3 style={{ 
              color: colors.primary,
              marginBottom: '1rem',
              fontSize: '1.25rem'
            }}>
              📊 Email Communication
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={[
                { name: 'Email', sent: stats.emailsSent, delivered: stats.emailsSent * 0.95 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis 
                  dataKey="name" 
                  stroke={colors.textSecondary}
                  fontSize={12}
                />
                <YAxis stroke={colors.textSecondary} fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    color: colors.text
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sent" 
                  stackId="1" 
                  stroke={colors.primary} 
                  fill={colors.primary} 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="delivered" 
                  stackId="1" 
                  stroke={colors.success} 
                  fill={colors.success} 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <div style={{
            background: colors.surface,
            borderRadius: '16px',
            padding: '1.5rem',
            border: `1px solid ${colors.border}`
          }}>
            <h3 style={{ 
              color: colors.primary,
              marginBottom: '1rem',
              fontSize: '1.25rem'
            }}>
              ⏰ Recent Activity
            </h3>
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <ActivityItem 
                icon="📧" 
                title="Email Campaign Started" 
                description="Test Campaign 2" 
                time="2 hours ago"
                colors={colors}
              />
              <ActivityItem 
                icon="👥" 
                title="Leads Imported" 
                description="100 new leads added" 
                time="1 day ago"
                colors={colors}
              />
              <ActivityItem 
                icon="📢" 
                title="Campaign Completed" 
                description="Introduction Campaign" 
                time="2 days ago"
                colors={colors}
              />

            </div>
          </div>
        </div>

        {/* Manual Test Email Form - Moved to bottom */}
        <div style={{
          background: colors.surface,
          borderRadius: '16px',
          padding: '1.5rem',
          border: `1px solid ${colors.border}`,
          maxWidth: 600,
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <h3 style={{ color: colors.info, marginBottom: '1rem' }}>✉️ Send Test Email</h3>
          <form onSubmit={handleSendTestEmail}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: 4 }}>To (Recipient Email):</label>
              <input
                type="email"
                name="to"
                value={testEmail.to}
                onChange={handleTestEmailChange}
                required
                style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${colors.border}` }}
                placeholder="recipient@example.com"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: 4 }}>Subject:</label>
              <input
                type="text"
                name="subject"
                value={testEmail.subject}
                onChange={handleTestEmailChange}
                required
                style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${colors.border}` }}
                placeholder="Test Subject"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: 4 }}>Body:</label>
              <textarea
                name="body"
                value={testEmail.body}
                onChange={handleTestEmailChange}
                required
                rows={5}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${colors.border}` }}
                placeholder="Test email body..."
              />
            </div>
            <button
              type="submit"
              disabled={sendingTestEmail}
              style={{
                background: colors.info,
                color: '#fff',
                padding: '0.75rem 2rem',
                border: 'none',
                borderRadius: 8,
                fontWeight: 'bold',
                cursor: sendingTestEmail ? 'not-allowed' : 'pointer',
                opacity: sendingTestEmail ? 0.7 : 1
              }}
            >
              {sendingTestEmail ? 'Sending...' : 'Send Test Email'}
            </button>
          </form>
        </div>
      </div>

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: colors.surface,
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
            border: `1px solid ${colors.border}`,
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                color: colors.primary,
                fontSize: '1.5rem',
                margin: 0
              }}>
                {previewModal.title}
              </h3>
              <button
                onClick={() => setPreviewModal({ ...previewModal, isOpen: false })}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: colors.textSecondary,
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                ✕
              </button>
            </div>

            {previewModal.data.length > 0 ? (
              <div>
                {previewModal.type === 'pendingLeads' && (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {previewModal.data.map((lead, index) => (
                      <div key={lead.id} style={{
                        background: colors.background,
                        padding: '1rem',
                        borderRadius: '8px',
                        border: `1px solid ${colors.border}`
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                          {lead.first_name} {lead.last_name}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
                          📧 {lead.email} • 📱 {lead.phone}
                          {lead.company && ` • 🏢 ${lead.company}`}
                          {lead.job_title && ` • 💼 ${lead.job_title}`}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginTop: '0.5rem' }}>
                          Source: {lead.source} • Status: {lead.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {previewModal.type === 'totalCampaigns' && (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {previewModal.data.map((campaign, index) => (
                      <div key={campaign.id} style={{
                        background: colors.background,
                        padding: '1rem',
                        borderRadius: '8px',
                        border: `1px solid ${colors.border}`
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                          {campaign.name}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
                          Status: <span style={{
                            color: campaign.status === 'RUNNING' ? colors.success :
                                   campaign.status === 'COMPLETED' ? colors.textSecondary :
                                   colors.warning,
                            fontWeight: 'bold'
                          }}>
                            {campaign.status}
                          </span>
                          • Leads: {campaign.leadCount || 0}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginTop: '0.5rem' }}>
                          Created: {new Date(campaign.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {previewModal.type === 'activeCampaigns' && (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {previewModal.data.length > 0 ? (
                      previewModal.data.map((campaign, index) => (
                        <div key={campaign.id} style={{
                          background: colors.background,
                          padding: '1rem',
                          borderRadius: '8px',
                          border: `1px solid ${colors.border}`
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            {campaign.name}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
                            Status: <span style={{ color: colors.success, fontWeight: 'bold' }}>
                              {campaign.status}
                            </span>
                            • Leads: {campaign.leadCount || 0}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginTop: '0.5rem' }}>
                            Created: {new Date(campaign.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', color: colors.textSecondary, padding: '2rem' }}>
                        No active campaigns at the moment
                      </div>
                    )}
                  </div>
                )}

                {previewModal.type === 'emailsSent' && (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {previewModal.data.length > 0 ? (
                      previewModal.data.map((campaign, index) => (
                        <div key={campaign.id} style={{
                          background: colors.background,
                          padding: '1rem',
                          borderRadius: '8px',
                          border: `1px solid ${colors.border}`
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            {campaign.name}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
                            Emails Sent: <span style={{ color: colors.success, fontWeight: 'bold' }}>
                              {campaign.leadCount || 0}
                            </span>
                            • Status: {campaign.status}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginTop: '0.5rem' }}>
                            Created: {new Date(campaign.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', color: colors.textSecondary, padding: '2rem' }}>
                        No emails have been sent yet
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: colors.textSecondary, padding: '2rem' }}>
                {previewModal.type === 'completedLeads' ? 
                  'No completed leads yet' : 
                  'No data available'
                }
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, colors, onClick }) => (
  <div style={{
    background: colors.surface,
    borderRadius: '16px',
    padding: '1.5rem',
    border: `1px solid ${colors.border}`,
    textAlign: 'center',
    transition: 'transform 0.2s ease',
    cursor: 'pointer'
  }}
  onMouseEnter={(e) => {
    e.target.style.transform = 'translateY(-4px)';
  }}
  onMouseLeave={(e) => {
    e.target.style.transform = 'translateY(0)';
  }}
  onClick={onClick}
  >
    <div style={{ 
      fontSize: '2rem',
      marginBottom: '0.5rem'
    }}>
      {icon}
    </div>
    <div style={{ 
      fontSize: '2rem',
      fontWeight: 'bold',
      color: color,
      marginBottom: '0.5rem'
    }}>
      {value.toLocaleString()}
    </div>
    <div style={{ 
      color: colors.textSecondary,
      fontSize: '0.9rem'
    }}>
      {title}
    </div>
  </div>
);

const ActivityItem = ({ icon, title, description, time, colors }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem',
    borderRadius: '8px',
    background: colors.background
  }}>
    <div style={{ 
      fontSize: '1.5rem',
      width: '40px',
      textAlign: 'center'
    }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ 
        fontWeight: 'bold',
        color: colors.text,
        fontSize: '0.9rem'
      }}>
        {title}
      </div>
      <div style={{ 
        color: colors.textSecondary,
        fontSize: '0.8rem'
      }}>
        {description}
      </div>
    </div>
    <div style={{ 
      color: colors.textSecondary,
      fontSize: '0.75rem'
    }}>
      {time}
    </div>
  </div>
);

export default Dashboard; 