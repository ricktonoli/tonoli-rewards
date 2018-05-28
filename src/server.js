var express = require('express');
var request = require('request');
var Datastore = require('nedb');

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}

var token = 'snorlax'

require('console-stamp')(console, '[mmm dd HH:MM:ss.l]');

// Create a store
var rewards = new Datastore({filename: '/opt/tonoli-reward/rewards.db', autoload: true});

var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

var port = 3124

app.get("/", function(request, response) {
  response.send("OK");
})


/** 
* transfer reward to someone else
**/
app.get("/reward/transfer/:from/:to/:amount", function(request, response) {

  if (request.query.token != token) {
    response.send('Invalid')
    return
  }

  from = request.params.from
  to = request.params.to
  amount = request.params.amount

  if (!isNaN(amount)) {
    rewards.find({id:{$regex: new RegExp(from, 'i')}}).exec(function (err, docs) {

        if (err || docs.length == 0) { 
          response.send("Not found")
        } else {
          if ((docs[0].amount - amount) >= 0) {
            console.log("Tranfering " + amount + " from " + from + " to " + to)
            addReward(from, -1*amount)
            addReward(to,amount)
            response.send("Done")
          } else {
            response.send("Not enough reward points to transfer")
          }
        }
    })
  }
})


/** 
* add an amount of reward to a person
*/
app.get("/reward/add/:who/:amount", function(request, response) {

  if (request.query.token != token) {
    response.send('Invalid')
    return
  }

  who = request.params.who
  amount = request.params.amount

  if (!isNaN(amount)) {
    addReward(who, amount)
  }

  response.send("OK")
})
  
/**
* Remove reward points
**/
app.get("/reward/subtract/:who/:amount", function(request, response) {

  if (request.query.token != token) {
    response.send('Invalid')
    return
  }

  who = request.params.who
  amount = request.params.amount

  if (!isNaN(amount)) {
    addReward(who, -1*amount)
  }
  response.send("OK")
})

/**
* Get persons current reward value
**/
app.get("/reward/get/:who", function(request, response) {
//  console.log(request)

  who = request.params.who

  rewards.find({id:{$regex: new RegExp(who, 'i')}}).exec(function (err, docs) {

      if (err || docs.length == 0) { 
        response.json({total:0})
      } else {
//        console.log(docs[0].amount)
        response.json({total:docs[0].amount})
      }
  })
})

app.listen(port, function () {
  console.log('Listening on port ' + port);
});

/**
** Add (or subtract) a reward, cannot go below zero.
**/
function addReward(who, amount) {

  if (amount >= 0) {
    word = "earned"
  } else {
    word = "paid"
  }

  message = who + " has " + word + " " + Math.abs(amount) + " reward points"
  console.log(message)
  rewards.find({id: who}, function (err, docs) {
    if (err) { console.log(err) }
    var total = 0
    if (docs.length == 0) {
      total = parseFloat(amount)
      if (total < 0) total = 0
      rewards.insert({id: who, amount: total}, function(err, newDoc) {
        if (err) console.log(err)
        console.log("Inserted " + total + " reward for " + who)
      })
    } else {
      total = docs[0].amount + parseFloat(amount)
      if (total < 0) total = 0
      rewards.update({id: who}, { $set: {amount: total}}, {}, function (err, numReplaced) {
        if (err) console.log(err)
        console.log("Updated reward for " + who + " to " + total)
      })
    }
  });
}

