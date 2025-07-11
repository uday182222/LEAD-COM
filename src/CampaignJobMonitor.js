import React, { useEffect, useState } from 'react';

async function fetchCampaignJobs(campaignId) {
  try {
    const res = await fetch(`/api/jobs/${campaignId}`);
    if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.status}`);
    return await res.json();
  } catch (err) {
    throw err;
  }
}

async function retryJob(jobId) {
  try {
    const res = await fetch(`/api/jobs/${jobId}/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Failed to retry job: ${res.status}`);
    return await res.json();
  } catch (err) {
    throw err;
  }
}

const statusColors = {
  waiting: '#f0ad4e',
  active: '#5bc0de',
  completed: '#5cb85c',
  failed: '#d9534f',
};

export default function CampaignJobMonitor({ campaignId }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState({});

  useEffect(() => {
    setLoading(true);
    fetchCampaignJobs(campaignId)
      .then(setJobs)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [campaignId]);

  const handleRetry = async (jobId) => {
    setRetrying((r) => ({ ...r, [jobId]: true }));
    try {
      await retryJob(jobId);
      // Refetch jobs after retry
      fetchCampaignJobs(campaignId).then(setJobs);
    } catch (err) {
      setError(err);
    } finally {
      setRetrying((r) => ({ ...r, [jobId]: false }));
    }
  };

  if (loading) return <div>Loading jobs...</div>;
  if (error) return <div>Error loading jobs: {error.message}</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h2>Campaign Job Monitor</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Status</th>
            <th>Recipient</th>
            <th>Subject</th>
            <th>Timestamp</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>
              <td>
                <span
                  style={{
                    display: 'inline-block',
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: statusColors[job.status] || '#ccc',
                    marginRight: 8,
                  }}
                  title={job.status}
                />
                {job.status}
                {job.status === 'failed' && job.error && (
                  <div style={{ color: '#d9534f', fontSize: 12 }}>{job.error}</div>
                )}
              </td>
              <td>{job.recipient}</td>
              <td>{job.subject}</td>
              <td>{new Date(job.timestamp).toLocaleString()}</td>
              <td>
                {job.status === 'failed' ? (
                  <button
                    onClick={() => handleRetry(job.id)}
                    disabled={retrying[job.id]}
                    style={{ background: '#f0ad4e', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4 }}
                  >
                    {retrying[job.id] ? 'Retrying...' : 'Retry'}
                  </button>
                ) : (
                  <span style={{ color: '#aaa' }}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 