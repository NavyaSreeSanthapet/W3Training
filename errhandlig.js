//imported express module and created a server.
var express = require('express');
var app = express();


app.get('/', function(req, res){
    //Created an error and pass it to the next function
    var err = new Error("Something went wrong");
    next(err);
});


//created error handling middleware which skips all middleware and route handlers if an error occurs and is sent.
//executes if error is occured and sent skipping all middleware and route handlers in middle.
app.use(function(err, req, res, next) {
    console.log("something broke!.")
   //calls next errorhandle middleware function.
    next(err);
});
app.use(function(err, req, res, next) {
    res.status(500);
    res.send("Oops, something went wrong.");
    //calls next errorhandle middleware function.
    next(err);
});
app.use(function(err, req, res, next) {
    console.log("something broke!.");
});

app.listen(3000);

//to know every step what app does after executing it we can use DEBUG = express:* command in command prompt in absolute path of the app.
//to stop it just use DEBUG=express:*.
