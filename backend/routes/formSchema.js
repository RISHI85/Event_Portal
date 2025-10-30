const express = require('express');
const router = express.Router();
const FormSchema = require('../models/FormSchema');
const { adminAuth } = require('../middleware/auth');

// GET active schema (latest active)
router.get('/', async (req, res) => {
  try {
    const schema = await FormSchema.findOne({ active: true }).sort({ version: -1 });
    res.json(schema || { version: 0, fields: [], active: true });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST new schema version (admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { fields } = req.body;
    if (!Array.isArray(fields)) return res.status(400).json({ message: 'fields must be an array' });

    const latest = await FormSchema.findOne().sort({ version: -1 });
    const nextVersion = (latest?.version || 0) + 1;

    // deactivate existing
    if (latest && latest.active) {
      latest.active = false;
      await latest.save();
    }

    const doc = new FormSchema({
      version: nextVersion,
      fields,
      active: true,
      createdBy: req.user._id,
    });
    await doc.save();
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
