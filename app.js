var express = require('express');
var path = require('path');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var _ = require('underscore');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

// const server = express()
//   .use((req, res) => res.sendFile(INDEX) )
//   .use(express.static(__dirname + '/node_modules'))
//   .listen(PORT, () => console.log(`Listening on ${ PORT }`));

app.use(express.static(__dirname + '/node_modules'));
app.get('/', function(req, res,next){
  res.sendFile(__dirname + '/index.html');
});


var bad_words = ['', 'fuck']
function checkword(word){
  if (_.contains(bad_words, word)){
    return false
  } else {
    return true
  }
}
var suggested_words = []
var connections = 0;
io.on('connection', (socket) => {
  connections++;
  io.emit('add', connections);
  console.log('Client connected');
  socket.on('disconnect', function() {
    connections--;
    io.emit('remove', connections);
    console.log('Client disconnected')
  });


  socket.on('word_suggestion', function(word){
    if (suggested_words.length < 10 && checkword(word)==true){
      suggested_words.push(word);
      io.emit('populate_suggestions', suggested_words);
      if (suggested_words.length==10){
        io.emit('add_result', mode(suggested_words));
        suggested_words = [];
        io.emit('populate_suggestions', suggested_words);
        return;
      }
      console.log(suggested_words);
    }

  });
});

function mode(array)
{
    if(array.length == 0)
        return null;
    var modeMap = {};
    var maxEl = array[0], maxCount = 1;
    for(var i = 0; i < array.length; i++)
    {
        var el = array[i];
        if(modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;
        if(modeMap[el] > maxCount)
        {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }
    return maxEl;
}

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);

server.listen(PORT);
