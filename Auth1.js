//imported express module.
const express = require('express');
//imported 'pg' module used to connect server to database.
const { Pool } = require('pg');
//imported body-parser used to process data sent in request body using below middleware functions.
const bodyParser = require('body-parser');
//imported jsonwebtoken module for user authorization to resources through tokens.
const jwt = require('jsonwebtoken');
//imported express-session used to create sessions to store data between http request used for authentication.
const session = require("express-session");

//created instance of express and assigned to port 3000.
const app = express();
const port = 3000;
//set pug as view engine and ./views folder as views for the app.
app.set("view engine", "pug");
app.set("views","./views");

//created connection to postgresql database instance created in render using a given external url.
const itemsPool = new Pool({
    connectionString: process.env.DBConfigLink,
    ssl: {
        rejectUnauthorized: false
    }
});


// Event listener for successful connection
itemsPool.on('connect', () => {
    console.log('Connected to PostgreSQL successfully!');
});

// PostgreSQL error event listener
itemsPool.on('error', (err) => {
    console.error('Error connecting to PostgreSQL:', err.message);
});


//connected middleware functions to server
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//session middle function used to create sessions by adding data to req.session object and delete it when ever necessary.
app.use(
    session({
        secret: "your_secret_key",
        resave: false,
        saveUninitialized: false,
    })
);


// created a simple get route handler at '/api/data' to output table Users
app.get('/api/data', async (req, res) => {
    try {
        // Query to fetch data from the database Users and result object assigned to queryResult variable.
        const queryResult = await pool.query('SELECT * FROM Users');
        //output stored in rows property and sent in response.
        res.json(queryResult.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching data from the database.' });
    }
});


//created a get route handler at /register to display inputform in response.
app.get('/register', async (req, res) => {
    const message = "Welcome to the signup page!";
    //renders login pug page
    res.render("login",{ message });
});
//created a Post route handler for new users to  register.
app.post('/register', async (req, res) => {
    try {
        //the username ,password and role values are sent through the request and stoted in below variables.
        const username = req.body.username;
        const password =req.body.password;
        const role=req.body.role;
        //logged to see weather server received correct values.
        console.log('Received data:', {username, password, role});
        //if any values is not sent in request sent a error message in response.
        if (!username || !password || !role) {
            return res.status(400).json({error: 'Missing required data.'});
        }
        //query to insert the given user values into database using below command.
        const query = 'INSERT INTO Users (username, password, role) VALUES ($1, $2, $3)';
        await itemsPool.query(query, [username, password, role]);
        //once the database query is successfull sent a success message in response.
        const message = "User registered successfully!";
        //once user is registered successfully displays register page created.
        res.status(201).render("register",{message});
    }//if any error occurs will send the error message in response.
    catch (err) {
        res.status(500).json({error: err.message});
    }
});

//created a get method at /login route handler to display login page.
app.get('/login', async (req, res) => {
    const message = "Welcome to the Login page!";
    res.render("login1",{ message });
});
//created a route handler at 'login' to authenticate user and creates a token for authorization on successful authentication.
app.post('/login', async (req, res) => {
    try {
        //the username ,password values sent through request are stored in below variables.
        const { username, password } = req.body;
        //query to select users with given id.
        const query = 'SELECT * FROM users WHERE username = $1';
        //below query selects the users from database with request id.
        const { rows } = await pool.query(query, [username]);
        //then if result of database query is null then returns invalid credentials message in response.
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const user = rows[0];
        //compared the result password with given password if both doesn't match send a message in response as 'Invalid credentials.'
        if (user.password!=password) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        //once user is Authenticated assigns user details to req.session.use object and send login2 page in response.
        req.session.user = user;
        res.status(200).render('login2',{ message: "Login successful." });
        //sends the token in response.
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//created a route handler at route '/protected' to only authorize users who are valid.
app.get('/protected', (req, res) => {
    //checks if req.session object of user has any value if yes then sends protected page response.
    if (req.session.user) {
        res.status(200).render('protected',{ message: "You have access to protected data!" });
    } else {
        res.status(403).json({ message: "Access forbidden. Authentication failed." });
    }
});

//created a route handler at "/logout" to delete or destroy the user session created by destroying or deleting the data assigned to req.session object.
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
        }
        //after that redirects to login page.
        res.redirect("/login");
    });
});





// Start the server and listen for incoming requests
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

//example curl commands used for above
//curl -X POST -H "Content-Type: application/json" -d "{\"username\":\"hello\",\"password\":\"abcd\",\"role\":\"admin\"}" http://localhost:3000/register
//curl -X GET -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjkwMzA2MTA3fQ.UxKQqovvN9nB2K55oZVlBIdW3889QMno1obzok4qVuE" http://localhost:3000/protected
//curl -X POST -H "Content-Type: application/json" -d "{\"username\":\"john_doe\",\"password\":\"hashed_password_here\"}" http://localhost:3000/login
