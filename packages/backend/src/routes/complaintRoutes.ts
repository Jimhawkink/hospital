import express from 'express';
import Complaint from '../models/Complaint';
import { Encounter } from '../models/Encounter';

const router = express.Router();

// Get all complaints for an encounter
router.get('/encounters/:encounterId/complaints', async (req, res) => {
  try {
    const { encounterId } = req.params;
    
    // Validate that encounter exists
    const encounter = await Encounter.findByPk(encounterId);
    if (!encounter) {
      return res.status(404).json({ error: 'Encounter not found' });
    }
    
    const complaints = await Complaint.findAll({
      where: { encounter_id: encounterId },
      order: [['created_at', 'ASC']]
    });
    
    res.json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// Add a new complaint to an encounter
router.post('/encounters/:encounterId/complaints', async (req, res) => {
  try {
    const { encounterId } = req.params;
    const { complaint_text, duration_value, duration_unit, comments } = req.body;
    
    // Validate required fields
    if (!complaint_text || complaint_text.trim().length === 0) {
      return res.status(400).json({ error: 'Complaint text is required' });
    }
    
    // Validate that encounter exists
    const encounter = await Encounter.findByPk(encounterId);
    if (!encounter) {
      return res.status(404).json({ error: 'Encounter not found' });
    }
    
    // Validate duration_unit if provided
    const validUnits = ['Hours', 'Days', 'Weeks', 'Months', 'Years'];
    if (duration_unit && !validUnits.includes(duration_unit)) {
      return res.status(400).json({ error: 'Invalid duration unit. Must be one of: ' + validUnits.join(', ') });
    }
    
    const complaint = await Complaint.create({
      encounter_id: parseInt(encounterId),
      complaint_text: complaint_text.trim(),
      duration_value: duration_value || null,
      duration_unit: duration_unit || null,
      comments: comments || null
    });
    
    res.status(201).json(complaint);
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ error: 'Failed to create complaint' });
  }
});

// Update a complaint
router.put('/encounters/complaints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { complaint_text, duration_value, duration_unit, comments } = req.body;
    
    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    
    // Validate required fields
    if (!complaint_text || complaint_text.trim().length === 0) {
      return res.status(400).json({ error: 'Complaint text is required' });
    }
    
    // Validate duration_unit if provided
    const validUnits = ['Hours', 'Days', 'Weeks', 'Months', 'Years'];
    if (duration_unit && !validUnits.includes(duration_unit)) {
      return res.status(400).json({ error: 'Invalid duration unit. Must be one of: ' + validUnits.join(', ') });
    }
    
    await complaint.update({
      complaint_text: complaint_text.trim(),
      duration_value: duration_value || null,
      duration_unit: duration_unit || null,
      comments: comments || null
    });
    
    res.json(complaint);
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({ error: 'Failed to update complaint' });
  }
});

// Delete a complaint
router.delete('/encounters/complaints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findByPk(id);
    
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    
    await complaint.destroy();
    res.status(200).json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ error: 'Failed to delete complaint' });
  }
});

// Get a specific complaint
router.get('/encounters/complaints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findByPk(id);
    
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    
    res.json(complaint);
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
});

export default router;