'use strict';
var Alexa = require("alexa-sdk");
// const doc = require('dynamodb-doc');
// const dynamo = new doc.DynamoDB();
var appId = ''; //'amzn1.echo-sdk-ams.app.your-skill-id';
var data = {
    "Items":
    [
    {"Direction":"crack egg\nscramble egg\n\nput bacon in pan\n\ncook 10 minuets\nadd egg\ncook 3 minuets\n",
    "RecipeName":"Egg and Bacon",
    "Ingredients":"Egg\nBacon"
    },
    {"RecipeName":"TLE",
     "Direction":"bake the bread\nheat the ham\nput ham and lettus and avocado in the bread",
    "Ingredients":"Bread\nham\navocado\nlettus"
    }
],
"Count":2,
"ScannedCount":2
}



exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.resourses = data;
    // const rp = require('request-promise');
    // rp({
    //     uri: 'https://jeo3iuph88.execute-api.us-east-1.amazonaws.com/prod/RecipeUpdate',
    //     json: true
    // }).catch(error => console.log('Whoops an error occurred')).then(data => {   // data is already a js object.
    //     data['Items'] // all your recipes are here probably.
    // });
    alexa.appId = appId;
    alexa.dynamoDBTableName = 'UserRecipe';
    alexa.registerHandlers(newSessionHandlers, startGameHandlers, IngredientModeHandlers);
    alexa.execute();
};
var states = {
    IngredientMode: '_IngredientMode', // User is trying to access the ingredient.
    STARTMODE: '_STARTMODE'  // Prompt the user to start or restart the game.
};
function getValueByKey(key, data) {
    var i, len = data.Items.length;

    for (i = 0; i < len; i++) {
        if (data.Items[i] && data.Items[i].RecipeName.toLowerCase() == key) {
            return i;
        }
    }
    return -1;
}

var newSessionHandlers = {
    'NewSession': function() {
        if(Object.keys(this.attributes).length === 0) {
            this.attributes['ingredientCount'] = 0;
            this.attributes['stepCount'] = 0;
            this.attributes['ingredientContent'] = "";
            this.attributes['stepContent'] = "";
        }
        this.handler.state = states.STARTMODE;
        this.emit(':ask', 'changed recipe assistant, what recipe would you like to make?',
            'Say the name of recipe or say: what can i say to get help.');
    },
    "AMAZON.StopIntent": function() {
      this.emit(':tell', "Goodbye!");
    },
    "AMAZON.CancelIntent": function() {
      this.emit(':tell', "Goodbye!");
    },
    'SessionEndedRequest': function () {
        console.log('session ended!');
        //this.attributes['endedSessionCount'] += 1;
        this.emit(":tell", "Goodbye!");
    }
};

var startGameHandlers = Alexa.CreateStateHandler(states.STARTMODE, {
    'NewSession': function () {
        this.emit('NewSession'); // Uses the handler in newSessionHandlers
    },
    'AMAZON.HelpIntent': function() {
        var message = 'To access your recipe say find plus your recipe name or say "exit" to quit the recipt';
        this.emit(':ask', message, message);
    },
    'FindIntent': function() {
        var itemSlot = this.event.request.intent.slots.Item;
        var itemName = itemSlot.value.toLowerCase();



        var curIndex = getValueByKey(itemName, data);

        if (curIndex == -1) {
            this.emit(':ask','Can not find the recipe','Please check your recipe list');

        }  else {
            this.attributes['ingredientContent'] = data.Items[curIndex].Ingredients.split(/\r?\n/);
            this.attributes['stepContent'] = data.Items[curIndex].Direction.split(/\r?\n/);
            this.handler.state = states.IngredientMode;
            this.emit(':ask', 'Recipe Found, you can check Ingredients by asking ingredient', 'Recipe Found, you can check Ingredients by asking ingredient');
        }
        // if (curIndex != -1) {
        //     this.emit(':tell', "you are right");

        //     this.attributes['ingredientContent'] = this.t("Items")[curIndex]['Ingredients'];
        //     this.attributes['stepContent'] = this.t("Items")[curIndex]['Direction'];
        //     this.emit(':ask', this.attributes['ingredientContent'], this.attributes['stepContent']);

        // } else {
        //     this.emit(':tell', "you are wrong");
        // }


    },
    'RestartIntent': function() {
        this.emit('NewSession');
    },
    "AMAZON.StopIntent": function() {
      console.log("STOPINTENT");
      this.emit(':tell', "Goodbye!");
    },
    "AMAZON.CancelIntent": function() {
      console.log("CANCELINTENT");
      this.emit(':tell', "Goodbye!");
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        //this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        var message = 'I do not understand your request.';
        this.emit(':ask', message, message);
    }
});

var IngredientModeHandlers = Alexa.CreateStateHandler(states.IngredientMode, {
    'NewSession': function () {
        this.handler.state = '';
        this.emitWithState('NewSession'); // Equivalent to the Start Mode NewSession handler
    },
    'StartIngredient': function() { // start the ingredient
        if (this.attributes['ingredientCount'] == 0) {
            this.attributes['ingredientCount'] += 1;
            var index = this.attributes['ingredientCount'];
            this.attributes['ResponseText'] = this.attributes['ingredientContent'][index];
            this.attributes['RepromptText'] = 'You can say next ingredient to check next ingredient';
            this.emit(':ask',this.attributes['ResponseText'],this.attributes['RepromptText']);

        } else {
            this.emit('Unhandled');
        }
    },
    'AdvanceIngredient': function() {
        if (this.attributes['ingredientCount'] !== 0) {
            this.attributes['ingredientCount'] += 1;
            var index = this.attributes['ingredientCount'];
            this.attributes['ResponseText'] = this.attributes['ingredientContent'][index];
            this.attributes['RepromptText'] = 'You can say next ingredient to check next ingredient';
            this.emit(':ask',this.attributes['ResponseText'],this.attributes['RepromptText']);
        } else {
            this.emit('Unhandled');
        }
    },
    'AMAZON.HelpIntent': function() {
        this.emit(':ask', 'List of help command','List of help command');
    },
    "AMAZON.StopIntent": function() {
        console.log("STOPINTENT");
        this.emit('NewSession'); // Uses the handler in newSessionHandlers
    },
    "AMAZON.CancelIntent": function() {
        console.log("CANCELINTENT");
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        this.emit(':ask', 'Sorry, I didn\'t get that. ', 'Sorry, I didn\'t get that. ');
    }
});
// These handlers are not bound to a state
// var guessAttemptHandlers = {
//     'TooHigh': function(val) {
//         this.emit(':ask', val.toString() + ' is too high.', 'Try saying a smaller number.');
//     },
//     'TooLow': function(val) {
//         this.emit(':ask', val.toString() + ' is too low.', 'Try saying a larger number.');
//     },
//     'JustRight': function(callback) {
//         this.handler.state = states.STARTMODE;
//         this.attributes['gamesPlayed']++;
//         callback();
//     },
//     'NotANum': function() {
//         this.emit(':ask', 'Sorry, I didn\'t get that. Try saying a number.', 'Try saying a number.');
//  }
// };


// 'use strict';
// var Alexa = require("alexa-sdk");
// var appId = ''; //'amzn1.echo-sdk-ams.app.your-skill-id';

// exports.handler = function(event, context, callback) {
//     var alexa = Alexa.handler(event, context);
//     alexa.appId = appId;
//     alexa.dynamoDBTableName = 'highLowGuessUsers';
//     alexa.registerHandlers(newSessionHandlers, guessModeHandlers, startGameHandlers, guessAttemptHandlers);
//     alexa.execute();
// };

// var states = {
//     GUESSMODE: '_GUESSMODE', // User is trying to guess the number.
//     STARTMODE: '_STARTMODE'  // Prompt the user to start or restart the game.
// };

// var newSessionHandlers = {
//     'NewSession': function() {
//         if(Object.keys(this.attributes).length === 0) {
//             this.attributes['endedSessionCount'] = 0;
//             this.attributes['gamesPlayed'] = 0;
//         }
//         this.handler.state = states.STARTMODE;
//         this.emit(':ask', 'Welcome to High Low guessing game. You have played '
//             + this.attributes['gamesPlayed'].toString() + ' times. would you like to play?',
//             'Say yes to start the game or no to quit.');
//     },
//     "AMAZON.StopIntent": function() {
//       this.emit(':tell', "Goodbye!");
//     },
//     "AMAZON.CancelIntent": function() {
//       this.emit(':tell', "Goodbye!");
//     },
//     'SessionEndedRequest': function () {
//         console.log('session ended!');
//         //this.attributes['endedSessionCount'] += 1;
//         this.emit(":tell", "Goodbye!");
//     }
// };

// var startGameHandlers = Alexa.CreateStateHandler(states.STARTMODE, {
//     'NewSession': function () {
//         this.emit('NewSession'); // Uses the handler in newSessionHandlers
//     },
//     'AMAZON.HelpIntent': function() {
//         var message = 'I will think of a number between zero and one hundred, try to guess and I will tell you if it' +
//             ' is higher or lower. Do you want to start the game?';
//         this.emit(':ask', message, message);
//     },
//     'AMAZON.YesIntent': function() {
//         this.attributes["guessNumber"] = Math.floor(Math.random() * 100);
//         this.handler.state = states.GUESSMODE;
//         this.emit(':ask', 'Great! ' + 'Try saying a number to start the game.', 'Try saying a number.');
//     },
//     'AMAZON.NoIntent': function() {
//         console.log("NOINTENT");
//         this.emit(':tell', 'Ok, see you next time!');
//     },
//     "AMAZON.StopIntent": function() {
//       console.log("STOPINTENT");
//       this.emit(':tell', "Goodbye!");
//     },
//     "AMAZON.CancelIntent": function() {
//       console.log("CANCELINTENT");
//       this.emit(':tell', "Goodbye!");
//     },
//     'SessionEndedRequest': function () {
//         console.log("SESSIONENDEDREQUEST");
//         //this.attributes['endedSessionCount'] += 1;
//         this.emit(':tell', "Goodbye!");
//     },
//     'Unhandled': function() {
//         console.log("UNHANDLED");
//         var message = 'Say yes to continue, or no to end the game.';
//         this.emit(':ask', message, message);
//     }
// });

// var guessModeHandlers = Alexa.CreateStateHandler(states.GUESSMODE, {
//     'NewSession': function () {
//         this.handler.state = '';
//         this.emitWithState('NewSession'); // Equivalent to the Start Mode NewSession handler
//     },
//     'NumberGuessIntent': function() {
//         var guessNum = parseInt(this.event.request.intent.slots.number.value);
//         var targetNum = this.attributes["guessNumber"];
//         console.log('user guessed: ' + guessNum);

//         if(guessNum > targetNum){
//             this.emit('TooHigh', guessNum);
//         } else if( guessNum < targetNum){
//             this.emit('TooLow', guessNum);
//         } else if (guessNum === targetNum){
//             // With a callback, use the arrow function to preserve the correct 'this' context
//             this.emit('JustRight', () => {
//                 this.emit(':ask', guessNum.toString() + 'is correct! Would you like to play a new game?',
//                 'Say yes to start a new game, or no to end the game.');
//         })
//         } else {
//             this.emit('NotANum');
//         }
//     },
//     'AMAZON.HelpIntent': function() {
//         this.emit(':ask', 'I am thinking of a number between zero and one hundred, try to guess and I will tell you' +
//             ' if it is higher or lower.', 'Try saying a number.');
//     },
//     "AMAZON.StopIntent": function() {
//         console.log("STOPINTENT");
//       this.emit(':tell', "Goodbye!");
//     },
//     "AMAZON.CancelIntent": function() {
//         console.log("CANCELINTENT");
//     },
//     'SessionEndedRequest': function () {
//         console.log("SESSIONENDEDREQUEST");
//         this.attributes['endedSessionCount'] += 1;
//         this.emit(':tell', "Goodbye!");
//     },
//     'Unhandled': function() {
//         console.log("UNHANDLED");
//         this.emit(':ask', 'Sorry, I didn\'t get that. Try saying a number.', 'Try saying a number.');
//     }
// });

// // These handlers are not bound to a state
// var guessAttemptHandlers = {
//     'TooHigh': function(val) {
//         this.emit(':ask', val.toString() + ' is too high.', 'Try saying a smaller number.');
//     },
//     'TooLow': function(val) {
//         this.emit(':ask', val.toString() + ' is too low.', 'Try saying a larger number.');
//     },
//     'JustRight': function(callback) {
//         this.handler.state = states.STARTMODE;
//         this.attributes['gamesPlayed']++;
//         callback();
//     },
//     'NotANum': function() {
//         this.emit(':ask', 'Sorry, I didn\'t get that. Try saying a number.', 'Try saying a number.');
//     }
// };
//