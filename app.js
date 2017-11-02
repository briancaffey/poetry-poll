var express = require('express');
var path = require('path');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var _ = require('underscore');
var mongo = require('mongodb').MongoClient;



const PORT = process.env.PORT || 3000;
const MONGO = process.env.MONGO
const INDEX = path.join(__dirname, 'index.html');

app.use(express.static(__dirname + '/node_modules'));

app.get('/', function(req, res,next){
  res.sendFile(__dirname + '/index.html');
});

app.get('/about', function(req, res){
  res.render('ind', {title:'Hey', message: 'Hello there!'});
});

function load_recent(){
  mongo.connect(MONGO, function(err, db){
    var collection = db.collection('words').find().sort({ _id: -1}).toArray(function( err, result){
      if (err) {
        console.log(err);
        throw err;
      }
      io.emit('show_recent', result);
    });
    //stream.on('data', function(recent){io.emit('show_recent', recent)});
  })
}


function save_db(wrd){
  mongo.connect(MONGO, function (err, db) {
      var collection = db.collection('words');
      collection.insert({ content: wrd }, function(err, o) {
          if (err) { console.warn(err.message); }
          else { console.log("word data inserted into db"); }
      });
  });
}
var word_data
var bad_words = ['', 'fuck', ' ']

function getSum(total, num){
  return total + num;
}

function checkword(word){
  if (_.contains(bad_words, word)){
    return false
  } else {
    return true
  }
}
var suggested_words = {' ': 1}
var connections = 0;
io.on('connection', (socket) => {
  load_recent();
  connections++;
  io.emit('add', connections);
  socket.on('disconnect', function() {
    connections--;
    io.emit('remove', connections);
  });


  socket.on('word_suggestion', function(word){
    console.log(suggested_words);
    if (_.contains(bad_words, word)) return
    if (_.values(suggested_words).reduce(getSum) < 10){
      if (suggested_words.hasOwnProperty(word)){
        suggested_words[word] += 1;
      } else {
        suggested_words[word] = 1;
      };

      var total_votes = _.values(suggested_words).reduce(getSum);
      var populate = {'total_votes':total_votes, 'suggested_words':suggested_words};
      io.emit('populate_suggestions', populate);
      if (populate.total_votes == 10){
        var winner = Object.keys(suggested_words).reduce(function(a, b){ return suggested_words[a] > suggested_words[b] ? a : b });
        load_recent();
        
        var doc = {'words':suggested_words, 'winner':winner, 'time_stamp': time_stamp};
        save_db(doc);
        suggested_words = {' ':1};
        io.emit('populate_suggestions', populate);
        return;
      }
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


server.listen(PORT);
