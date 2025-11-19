const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('./models/User');  // Make sure schema updated with name
const Course = require('./models/Course');

const app = express();
const PORT = 3000;

const mongoURI = 'mongodb+srv://admin:SecurePass123%21@myapp-cluster.ps67pw8.mongodb.net/mydatabase?retryWrites=true&w=majority&appName=myapp-cluster';

mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

// Routes

app.get('/', (req, res) => {
  res.render('login');
});
app.get('/login', (req, res) => {
  res.render('login');
});
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = new User({ name, email, password: hashedPassword, registeredCourses: [] });
    await user.save();
    req.flash('success_msg', 'Registration successful! You can now login.');
    res.redirect('/');
  } catch (error) {
    req.flash('error_msg', 'User with email may already exist.');
    res.redirect('/register');
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user._id;
      req.flash('success_msg', 'Login successful!');
      res.redirect('/dashboard');
    } else {
      req.flash('error_msg', 'Invalid email or password.');
      res.redirect('/login');
    }
  } catch (error) {
    req.flash('error_msg', 'Error logging in.');
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/dashboard', async (req, res) => {
  if (!req.session.userId) {
    req.flash('error_msg', 'Please login first.');
    return res.redirect('/login');
  }
  const user = await User.findById(req.session.userId);
  const nameToShow = user.name || user.email.split('@')[0];
  res.render('dashboard', { name: nameToShow });
});

app.get('/courses', async (req, res) => {
  if (!req.session.userId) {
    req.flash('error_msg', 'Please login first.');
    return res.redirect('/login');
  }
  const courses = await Course.find({});
  res.render('courses', { courses });
});

app.post('/register-course', async (req, res) => {
  if (!req.session.userId) {
    req.flash('error_msg', 'Please login first.');
    return res.redirect('/login');
  }
  const { courseId } = req.body;
  try {
    const user = await User.findById(req.session.userId);
    if (user.registeredCourses.includes(courseId)) {
      req.flash('error_msg', 'You have already registered for this course.');
      return res.redirect('/courses');
    }
    user.registeredCourses.push(courseId);
    await user.save();
    req.flash('success_msg', 'Course registered successfully!');
    res.redirect('/courses');
  } catch (error) {
    req.flash('error_msg', 'Error registering for course.');
    res.redirect('/courses');
  }
});

app.get('/my-courses', async (req, res) => {
  if (!req.session.userId) {
    req.flash('error_msg', 'Please login first.');
    return res.redirect('/login');
  }
  const user = await User.findById(req.session.userId);
  const courses = await Course.find({ courseId: { $in: user.registeredCourses } });
  res.render('my-courses', { courses });
});

app.post('/unregister-course', async (req, res) => {
  if (!req.session.userId) {
    req.flash('error_msg', 'Please login first.');
    return res.redirect('/login');
  }
  const { courseId } = req.body;
  try {
    await User.findByIdAndUpdate(
      req.session.userId,
      { $pull: { registeredCourses: courseId } }
    );
    req.flash('success_msg', 'Course unregistered successfully!');
    res.redirect('/my-courses');
  } catch (error) {
    req.flash('error_msg', 'Error unregistering from course.');
    res.redirect('/my-courses');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
