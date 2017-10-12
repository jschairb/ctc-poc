var mongoose = require('mongoose');

// Using {strict: false} makes the model schemaless.
var assignmentCallbackSchema = new mongoose.Schema({}, {strict: false});
mongoose.model('AssignmentCallback', assignmentCallbackSchema);
