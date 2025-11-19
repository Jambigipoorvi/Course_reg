const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseId: { type: String, required: true, unique: true },
  courseName: { type: String, required: true },
  description: { type: String }
});

module.exports = mongoose.model('Course', courseSchema);
