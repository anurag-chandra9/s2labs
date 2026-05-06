const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['student', 'trainer', 'institution', 'programme_manager', 'monitoring_officer'],
    required: true,
  },
  institution: { type: Schema.Types.ObjectId, ref: 'Institution', default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
