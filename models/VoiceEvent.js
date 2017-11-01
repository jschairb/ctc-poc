const mongoose = require('mongoose');

// Using {strict: false} makes the model schemaless.
const schema = new mongoose.Schema({}, { strict: false });
module.exports = mongoose.model('VoiceEvent', schema);
