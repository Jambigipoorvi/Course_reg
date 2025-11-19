const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },  // added name field
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  registeredCourses: [String]
});

module.exports = mongoose.model('User', userSchema);
