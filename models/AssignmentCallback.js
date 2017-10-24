const mongoose = require('mongoose');

// Using {strict: false} makes the model schemaless.
const assignmentCallbackSchema = new mongoose.Schema({}, { strict: false });
module.exports = mongoose.model('AssignmentCallback', assignmentCallbackSchema);
