var mongoose = require('mongoose');

// Using {strict: false} makes the model schemaless.
var assignmentCallbackSchema = new mongoose.Schema({}, {strict: false});
module.exports.AssignmentCallback = mongoose.model('AssignmentCallback', assignmentCallbackSchema);
