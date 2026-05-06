const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const institutionSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Institution', institutionSchema);
