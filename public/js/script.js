var socket = io();
var mobile = false;

$(document).ready(function() {
	$("#container").hide(); //hide container on load so it can show when buffered
	$("#startprompt").hide();
	/* hide recorder div on mobile */
	if (isMobile.any == true) {
		$("#record").hide();
		mobile = true;
	};

	/* chat app */
    $('form').submit(function(){
      socket.emit('chat message', $('#m').val());
      $('#m').val('');
      return false;
    });

    socket.on('chat message', function(msg){
      $('#messages').append($('<li>').text(msg));
    });

	/* start prompt for mobile */
	$("#startprompt").click(function() {
		$("#startprompt").hide();
		$("#container").show();
	});

	//pass in the audio context
	var context = new AudioContext();

	//on iOS, the context will be started on the first valid user action the .box class
	StartAudioContext(Tone.context, '#startprompt').then(function(){
	    //console.log('up and running');
	});

	/* multiplayer with sounds loaded in as array of paths to files
	accessible by sounds.command(number);
	*/
	var sounds = [];
	var frozen = [];
	var files = new Tone.Buffers([
		"../sound/loop1.mp3",
		"../sound/loop2.mp3",
		"../sound/loop3.mp3",
		"../sound/loop4.mp3",
		"../sound/loop5.mp3",
		"../sound/loop6.mp3",
		"../sound/loop7.mp3",
		"../sound/loop8.mp3",
	], function() { // fill sounds[] array with players after all buffers are loaded
		console.log('all buffers loaded');
		for (i = 0; i < 8; i++) {
				sounds[i] = new Tone.Player({
					"url" : files.get(i),
					"loop" : true
				}).toMaster();
				//sounds[i].buffer = files.get("bmore");
				//console.log(sounds[i]);
				frozen[i] = false;
			};
	});

	/* start tranposrt helper so that it only occurs once */

	var startTransport = function(){
		startTransport = function(){}; // kill it as soon as it was called
		//tone.js transport
		Tone.Transport.bpm.value = 100;
		Tone.Transport.start();
		console.log('transport started');
		socket.emit('initialize');
	};

	/* called on regular interval from server, but only starts the transport once
	this syncronizes all the windows to roughly the same downbeat for smoother collaboration
	starts transport */
	
	socket.on('beat', function() {
		//sconsole.log(buffers.loaded);
		if (files.loaded == true) {
			startTransport(); // start the transport only when the buffers have loaded
		}
	});

	/* received after sending init request to server
	if the transport has already started, show/hide the right windows on downbeat
	on mobile, ask user to click for start */

	socket.on('show_board', function() {
		if (Tone.Transport.state == 'started' && isMobile.any == true) { //hide loading, show prompt on mobile
			console.log('tranposrt has already started, showing board on user prompt');
			$("#loading").hide();
			$("#startprompt").show();
		}
		else if (Tone.Transport.state == 'started' && isMobile.any == false) {
			console.log('tranposrt has already started, showing board on downbeat');
			Tone.Draw.schedule(function() { //hide loading, show board on desktop
				$("#loading").hide();
				$("#container").show();
			}, "@1n");
		}
		else if (Tone.Transport.state == 'stopped') {
			console.log('tranposrt has not started yet, cannot show board');
		}
	});

	/* takes in clicks and emits the id of the box clicked */
	$(".box").each(function(index) {
	    $(this).on("click", function(){
	    	//takes the last number of box__ and sends it through socket.io
	        var id = $(this).attr('id').substring(3);
	        //console.log(sounds[id].state);
	        if (sounds[id].state == "started") { // if it's playing, send a stop command
	        	console.log(id + ' clicked, telling server to stop it');
	        	socket.emit('stop', id);
	        	//return;
	        }
	        else if (sounds[id].state == "stopped") {// if it's stopped, send a play command
	        	console.log(id + ' clicked, telling server to play it');
	        	socket.emit('play', id);
	        	//return;
	        }
			//socket.emit('playtoggle', id)
			//console.log(sounds.buffers.get(id)._buffer.state);
	    });
	});

	/* takes in signal to play and plays the corresponding sound file */
	socket.on('play', function(number){
		$("#box" + number).removeClass("stopped");
		$("#box" + number).addClass("playing");  // change color to "playing"
		Tone.Draw.schedule(function(){
			/* flash on desktop on downbeat */
			if (mobile == false) {
				$("#box" + number).fadeIn(100).fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
			}
		}, "@1n")
		sounds[number].start("@1n"); // play it on beat
	});

	/* takes in signal to stop and stops the corresponding sound file */
	socket.on('stop', function(number){
		$("#box" + number).removeClass("playing");
		$("#box" + number).addClass("stopped"); // changed color to "stopped"
		sounds[number].stop(); // stop it on beat
	});

});