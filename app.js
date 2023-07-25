const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

// In-memory "database" to store user information
const users = {};

// Routes
app.get('/', (req, res) => {
    res.send('Welcome to the login system! Go to /signup or /login to get started.');
});

app.get('/signup', (req, res) => {
    res.send(`
    <h1>Signup</h1>
    <form method="post" action="/signup">
      <input type="text" name="username" placeholder="Username" required>
      <input type="password" name="password" placeholder="Password" required>
      <button type="submit">Signup</button>
    </form>
  `);
});

app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    if (!users[username]) {
        users[username] = { password };
        res.send('Signup successful! Go to <a href="/login">login page</a>.');
    } else {
        res.send('Username already exists! Please choose a different username.');
    }
});

app.get('/login', (req, res) => {
    res.send(`
    <h1>Login</h1>
    <form method="post" action="/login">
      <input type="text" name="username" placeholder="Username" required>
      <input type="password" name="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
  `);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users[username];
    if (user && user.password === password) {
        req.session.authenticated = true;
        req.session.username = username;
        res.redirect('/dashboard');
    } else {
        res.send('Invalid username or password. <a href="/login">Try again</a>.');
    }
});

app.get('/dashboard', (req, res) => {
    if (req.session.authenticated) {
        res.send(`Welcome, ${req.session.username}! This is your dashboard.`);
    } else {
        res.redirect('/login');
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});