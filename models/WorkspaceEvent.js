var mongoose = require('mongoose');

// Using {strict: false} makes the model schemaless.
var workspaceEventSchema = new mongoose.Schema({}, {strict: false});
var WorkspaceEvent = mongoose.model('WorkspaceEvent', workspaceEventSchema);
