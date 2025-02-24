// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  recipients: [
    {
      userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
      read: {type: Boolean, default: false},
      readAt: {type: Date, default: null}
    }
  ]
});

module.exports = mongoose.model('Notification', notificationSchema);
