const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const batchSchema = new Schema({
  name: { type: String, required: true },
  institution: { type: Schema.Types.ObjectId, ref: 'Institution', required: true },
  trainers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Batch', batchSchema);
