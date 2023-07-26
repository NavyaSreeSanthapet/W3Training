//imported express module.
const express = require('express');
//imported 'pg' module used to connect server to database.
const { Pool } = require('pg');
//imported body-parser used to process data sent in request body using below middleware functions.
const bodyParser = require('body-parser');
//imported jsonwebtoken module for user authorization to resources through tokens.
const jwt = require('jsonwebtoken');


//created instance of express and assigned to port 3000.
const app = express();
const port = 3000;

const knex = require('knex');
const pool= knex({
  client: 'pg',
  connection: {
    connectionString: 'postgres://navya:tKIsnxDnITw9gSCC7QP3O5UHffcOH3sA@dpg-cj0kee3438irjjdv9ja0-a/week3',
    ssl: {
      rejectUnauthorized: false
    }
  }
});

module.exports = db;

const createTableQuery = '
  CREATE TABLE Users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL
);
';
pool.query(createTableQuery, (err, res) => {
  if (err) {
    console.error('Error creating table:', err);
  } else {
    console.log('Table created successfully');
  }
});

// Event listener for successful connection
pool.on('connect', () => {
    console.log('Connected to PostgreSQL successfully!');
});

// PostgreSQL error event listener
pool.on('error', (err) => {
    console.error('Error connecting to PostgreSQL:', err.message);
});

//connected middleware functions to server
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//created middleware function for route '/protected' to authorize the users by
//validating the token user sends through request
//if token is valid request is sent to route handler else returns response.
const authenticateUser = (req, res, next) => {
    //seperating only the token.
    const token = req.headers.authorization.split(' ')[1];
    //if no token is there, sent a message as 'Access denied. Token not provided' in response.
    if (!token) {
        return res.status(401).json({ message: 'Access denied. Token not provided.' });
    }
    //.verify method decodes the token with the key and assigns it to req.user object for future reference.
    try {
        const decoded = jwt.verify(token, 'your_secret_key');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token.' });
    }
};

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
        await pool.query(query, [username, password, role]);
        //once the database query is successfull sent a success message in response.
        res.status(201).json({message: 'User registered successfully.'});
    }//if any error occurs will send the error message in response.
    catch (err) {
        res.status(500).json({error: err.message});
    }
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
        //once authenticated creates a new token with id which encrypts with given key and creates a token.
        const token = jwt.sign({ id: user.id }, 'your_secret_key');
        //sends the token in response.
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//created a route handler at route '/protected' to only authorize users who are valid.
app.get('/protected', authenticateUser, (req, res) => {
    // Only authorized users can access this route
    res.json({ message: 'Protected route. You are authorized!' });
});




// Start the server and listen for incoming requests
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

//example curl commands used for above
//curl -X POST -H "Content-Type: application/json" -d "{\"username\":\"hello\",\"password\":\"abcd\",\"role\":\"admin\"}" http://localhost:3000/register
//curl -X GET -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjkwMzA2MTA3fQ.UxKQqovvN9nB2K55oZVlBIdW3889QMno1obzok4qVuE" http://localhost:3000/protected
//curl -X POST -H "Content-Type: application/json" -d "{\"username\":\"john_doe\",\"password\":\"hashed_password_here\"}" http://localhost:3000/login
