const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true },
  label: { type: String, required: true, trim: true },
  type: { type: String, required: true, enum: ['text', 'number', 'date', 'radio', 'checkbox', 'select'] },
  required: { type: Boolean, default: false },
  options: { type: [String], default: [] },
  inputType: { type: String, default: '' },
  bindTo: { type: String, default: '' },
  order: { type: Number, default: 0 },
});

const formSchema = new mongoose.Schema({
  version: { type: Number, required: true },
  fields: { type: [fieldSchema], default: [] },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('FormSchema', formSchema);
