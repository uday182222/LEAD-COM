import express from 'express';
import emailQueue from '../queue/emailQueue.js';

const router = express.Router();

router.get('/:campaignId', async (req, res) => {
  const { campaignId } = req.params;

  try {
    const allJobs = await emailQueue.getJobs(['waiting', 'active', 'completed', 'failed']);

    const campaignJobs = allJobs
      .filter(job => job?.data?.campaignId === campaignId)
      .map(job => ({
        id: job.id,
        status: job.finishedOn ? 'completed' : job.failedReason ? 'failed' : job.state,
        recipient: job.data.to,
        subject: job.data.subject,
        error: job.failedReason || null,
        createdAt: job.timestamp,
        finishedAt: job.finishedOn,
      }));

    res.json({ jobs: campaignJobs });
  } catch (err) {
    console.error('Error fetching campaign jobs:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

export default router; 