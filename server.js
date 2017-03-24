/* where i need to go from here:
add redundancies for play / stop toggles on user side (if it's playing, don't let it have play be sent again)
*/

var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var Repeat = require('repeat');
var $ = require("jquery");

var bpm = 100; //bpm is 100
var ms = (60000 / bpm)*4;

app.use(express.static('public'));

/* keeping track of the beat for sending initialization states to windows */

Repeat(beat).every(ms, 'ms').start();

function beat() {
  io.emit('beat');
};

/* initializing mice array */

var mice = [];



/* initializing togglestate array */

var numberOfSounds = 8;
var togglestate = [];
for (i = 0; i < numberOfSounds; i++) {
  togglestate.push(0);
}

io.on('connection', function(socket){

  //wraps user ID in an object for transmission
  var userID = socket.id;
  
  /* SOUNDS
  on connection, tell user which sounds are already playing
  1) wait for initialization request, which comes after all buffers are loaded
  2) loop through togglestate array
  3) if a sound is flagged as playing (togglestate[i] == 1), emit the play flag
  4) if it's flagged as stopped (togglestate[i] == 0), emit the stopped flag
   */
   
  console.log('a user connected ' + socket.id);

  socket.on('initialize', function() {
    console.log('initialize request from ' + socket.id);
    io.to(socket.id).emit('show_board'); //start individual transport
    for (i = 0; i < togglestate.length; i++) {
      if (togglestate[i] == 1) {
        console.log('initialized loop ' + i + ' to PLAY for ' + socket.id);
        // sending to individual socketid (private message)
        io.to(socket.id).emit('play', i);
      };
      /*
      if (togglestate[i] == 0) {
        console.log('initialized loop ' + i + ' to STOP for ' + socket.id);
        io.to(socket.id).emit('stop', i);
      }
      */
    };
  });

	/* takes in number of box when a box is clicked and routes it to play corresponding soundfile */
	socket.on('play', function(number) {
		if (togglestate[number] == 0) { //if it's not playing, play it & increment counter
	  	console.log('loop ' + number + ' set to PLAY by ' + socket.id);
	  	io.emit('play', number);
			togglestate[number]++;
		}
	});

  socket.on('stop', function(number) {
      if (togglestate[number] == 1) { //if it is playing, stop it & reset counter
      console.log('loop ' + number + ' set to STOP by ' + socket.id);
      io.emit('stop', number);
      togglestate[number] = 0;
    };
  });

  socket.on('disconnect', function(){
  	
    console.log('user disconnected ' + socket.id);
    /* remove mouse from array so it wont be initialized anymore */
    for (i = 0; i < mice.length; i++) {
      if(mice[i].id == userID){
        console.log('mouse removed');
        mice.splice(i, 1);
        break;
      };
    };
    /* send a disconnect signal to remove it from users windows */
    io.emit('disconnect_mouse', userID);
  });
});

app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/index.html');
});

server.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});
