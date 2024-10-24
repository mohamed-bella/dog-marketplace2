const express = require('express');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const minifyHTML = require('express-minify-html');
const flash = require('connect-flash');
require('dotenv').config();
require('./config/passport');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser()); // Ensure cookieParser is before session middleware

// View Engine
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Express session middleware with MongoDB store
app.use(session({
     secret: 'your-secret-key',
     resave: false,
     saveUninitialized: true,
     store: MongoStore.create({
          mongoUrl: process.env.DATABASE_URI,
          ttl: 14 * 24 * 60 * 60, // Keep session for 14 days
          autoRemove: 'native' // Automatically remove expired sessions
     })
}));


// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Method override for PUT and DELETE methods in forms
app.use(methodOverride('_method'));

// Flash messages middleware
app.use(flash());
app.use((req, res, next) => {
     res.locals.messages = req.flash(); // This will make `messages` available in all views
     next();
});

// Global variables for flash messages and user info
app.use((req, res, next) => {
     res.locals.success = req.flash('success');
     res.locals.error = req.flash('error');
     res.locals.user = req.user || null; // Make user globally available in views
     next();
});

// HTML Minification middleware
app.use(minifyHTML({
     override: true,
     htmlMinifier: {
          removeComments: true,
          collapseWhitespace: true,
          minifyJS: true,
          minifyCSS: true,
     },
}));

// CONNECT TO DATABASE
mongoose.connect(process.env.DATABASE_URI, {
     useNewUrlParser: true,
     useUnifiedTopology: true,
})
     .then(() => {
          app.listen(3000, () => console.log('Database connected and listening on port 3000'));
     })
     .catch((err) => console.log(`Error connecting to the database: ${err.message}`));

// Routes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const articleRoutes = require('./routes/articleRoutes');
const contactRoute = require('./routes/contactRoute');
const serviceRoutes = require('./routes/serviceRoutes');



app.use(userRoutes);
app.use(authRoutes);
app.use(adminRoutes);
app.use(articleRoutes);
app.use(contactRoute);
app.use(serviceRoutes);

// Error handling middleware (404)
app.use((req, res) => {
     res.status(404).render('user/404', { message: 'Page Not Found' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
     console.error(err.stack);
     res.status(500).render('user/500', { message: 'Something went wrong!' });
});
