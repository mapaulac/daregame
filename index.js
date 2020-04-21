const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port);

app.use(express.static(__dirname + '/public')); //or: '../../build'

var numUsers = 0; 
var numNames = 0;
var namesSubmitted = false;
var part4CheckNumber = 0;
var continuePart5 = false;
var userArray = [];
var choseTimerUser = false;
var timerUser; 
var choseTimerUser2 = false;
var timerUser2; 
var choseTimerUser3 = false;
var timerUser3; 
var roundCompleted = 0;
var continueDare = false;
var currentRound = 1;
var roundCompletionCount = 0; 
var player1Dares = [];
var player2Dares = [];
var swapped = false;
var numGiveUp = 0;
var nameNumber = 0;

io.on('connection', function(socket){
  console.log(numUsers);
  const sessionID = socket.id;
  console.log("ID: " + sessionID); //get users' IDs 
  userArray.push(sessionID);
  console.log(userArray);
  numUsers++;
  console.log('a user has connected');
  console.log('number of users playing: '+numUsers);

  if (numUsers == 2){
    io.to(`${sessionID}`).emit('change background', true);
  }

  socket.on('disconnect', function(){
    //deleting sessions once people reload the page 
    console.log('user disconnected');
    numUsers--;
    deleteUser();

    function deleteIndex(session) {
      return session == socket.id;
    }

    function deleteUser() {
      console.log("index to delete:");
      console.log(userArray.findIndex(deleteIndex));
      userArray.splice(userArray.findIndex(deleteIndex),1)
    }

    console.log('UPDATED number of users online: '+ numUsers);
    console.log(userArray);

    console.log("restarting every variable"); 
    numNames = 0;
    namesSubmitted = false;
    part4CheckNumber = 0;
    continuePart5 = false;
    choseTimerUser = false;
    timerUser; 
    choseTimerUser2 = false;
    timerUser2; 
    choseTimerUser3 = false;
    timerUser3; 
    roundCompleted = 0;
    continueDare = false;
    currentRound = 1;
    roundCompletionCount = 0; 
    roundCompleted = 0;
    swapped = false;
    numGiveUp = 0;
    nameNumber = 0;
    var numDares = player1Dares.length; 
    player1Dares.splice(0,numDares);
    player2Dares.splice(0,numDares);

    //alerting other user that one user has disconnected
    socket.broadcast.emit('lost player', true);

    if (numUsers <= 0){
      var numIDs = userArray.length; 
      userArray.splice(0,numIDs);
      console.log("restarted ID array");
      var numDares = player1Dares.length; 
      player1Dares.splice(0,numDares);
      player2Dares.splice(0,numDares);
      console.log("restarted dare arrays");
    }
    // }
  });

  //CHECKPOINTS 
  //names checkpoint
  socket.on('player names checkpoint', function(reachedNames){
    if (reachedNames){
      nameNumber++;
      console.log("reached name section. increase number");
      console.log("current people in name phase: " + nameNumber);
    }
    if (nameNumber == 2){
      console.log("both players in name section. submit possible now.")
      io.emit('player names checkpoint', true);
    }
  });

  //instructions checkpoint
  socket.on('instructions checkpoint', function(reached){
    if (reached){
      part4CheckNumber++;
    }
    if (part4CheckNumber == 2){
      continuePart5 = true;
      io.emit('instructions checkpoint', continuePart5);
    }
  });

  //round completion checkpoint - REPEAT FOR EVERY ROUND
  socket.on('dare complete checkpoint', function(reachedDare){
    if (reachedDare){
      roundCompleted++;
      io.emit('hide swap', true);
    }
    if (roundCompleted == 2){
      continueDare = true;
      console.log("both users submitted something");
      io.emit('dare complete checkpoint', continueDare);
      roundCompleted = 0;
      continueDare = false;
    }
  });

  //SWAPPING
  //saving dares to arrays according to IDs 
  socket.on('save dare', function(dare){
    if (userArray[0] == sessionID){
      player1Dares.push(dare);
      console.log("player 1 dares: ");
      console.log(player1Dares);
    } else if (userArray[1] == sessionID){
      player2Dares.push(dare);
      console.log("player 2 dares: ");
      console.log(player2Dares);
    }
  });

  socket.on('swap dares', function(round){
    if (swapped == false){
      //get index to obtain dare
      var getIndex; 
      var swapDare1;
      var swapDare2;

      if (currentRound == 1){
        getIndex = 0;
      } else if (currentRound == 2){
        getIndex = 1;
      } else if (currentRound == 3){
        getIndex = 2;
      }

      //getting dare to swap
      swapDare1 = player1Dares[getIndex];
      swapDare2 = player2Dares[getIndex];
      console.log("swapping dare 1: " + swapDare1);
      console.log("swapping dare 2: " + swapDare2);

      //swapping dares
      player1Dares.splice(getIndex,1,swapDare2);
      player2Dares.splice(getIndex,1,swapDare1);
      console.log("done swapping. new arrays:");
      console.log(player1Dares);
      console.log(player2Dares);

      //emitting according to specific IDs
      io.to(`${userArray[0]}`).emit('swap dares', swapDare2);
      io.to(`${userArray[1]}`).emit('swap dares', swapDare1);   
      swapped = true;
    } 
  });

  //GIVING UP 
  socket.on('give up', function(gaveUp){
    if (gaveUp){
      numGiveUp++;
      console.log("gave up number: "+numGiveUp);
    }
    if (numGiveUp == 1){
      socket.broadcast.emit('giveup alert', true);
      io.to(`${sessionID}`).emit('hide giveup', true);
    }
    if (numGiveUp == 2){
      console.log("both users gave up...")
      io.emit('give up', true);
    }
  });

  socket.on('restart giveup', function(restart){
    numGiveUp = 0;
    console.log("updated numGive up: " + numGiveUp);
  });

  //timer checkpoint (filtering) - round 1
  socket.on('round one checkpoint', function(reachedTimer){
    if (reachedTimer){
      if (choseTimerUser == false){
        console.log("timer user "+ sessionID);
        timerUser = sessionID;
        choseTimerUser = true;
        io.emit('start round', true);
      }
    }
  });

  //timer checkpoint - round 2
  socket.on('round two checkpoint', function(reachedTimer2){
    currentRound = 2;
    swapped = false;
    console.log("current round: " + currentRound);
    roundCompletionCount = 0;
    console.log("restarting round completion count: "+ roundCompletionCount);
    roundCompleted = 0;
    if (reachedTimer2){
      if (choseTimerUser2 == false){
        console.log("timer user "+ sessionID);
        timerUser2 = sessionID;
        choseTimerUser2 = true;
        io.emit('start round', true);
      }
    }
  });
  
  //timer checkpoint - round 3
  socket.on('round three checkpoint', function(reachedTimer3){
    currentRound = 3;
    swapped = false;
    console.log("current round: " + currentRound);
    roundCompletionCount = 0;
    console.log("restarting round completion count: "+ roundCompletionCount);
    roundCompleted = 0;
    if (reachedTimer3){
      if (choseTimerUser3 == false){
        console.log("timer user "+ sessionID);
        timerUser3 = sessionID;
        choseTimerUser3 = true;
        io.emit('start round', true);
      }
    }
  });

  //receiving and sending round completion values 
  socket.on('round completion count', function(increaseCounter){
    roundCompletionCount++; 
    console.log("updated round completion count: " + roundCompletionCount);
  });

  socket.on('timer', function(receiveTimer){
    if (currentRound == 1){
      if (sessionID == timerUser){
        console.log('time left: '  + receiveTimer);
        io.emit('timer', receiveTimer);
      }
    } else if (currentRound == 2){
      if (sessionID == timerUser2){
        console.log('time left: '  + receiveTimer);
        io.emit('timer', receiveTimer);
      }
    } else if (currentRound == 3){
      if (sessionID == timerUser3){
        console.log('time left: '  + receiveTimer);
        io.emit('timer', receiveTimer);
      }
    }
  });

  socket.on('timer done', function(isTimerDone){
    console.log("timer is done");
    if (isTimerDone){
      io.emit('timer done', roundCompletionCount);
      // io.emit('round completion count', roundCompletionCount);
    }
});

  

  socket.on('chat message', function(msg){ //when form is submitted
    numNames++;
    console.log('name: ' + msg);
    io.emit('chat message', msg);//send name to client-side
    socket.broadcast.emit('broadcast', msg); //sending name, only other player receives it

    //all names have been submitted
    if (numNames == 2){
      console.log("names have been sumbitted, sending over to client")
      namesSubmitted = true;
      io.emit('names submitted', namesSubmitted);
    }
  });
});

http.listen(port, () => console.log('listening on port ' + port));