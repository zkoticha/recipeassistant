'use strict';
var Alexa = require("alexa-sdk");
const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();
var appId = ''; //'amzn1.echo-sdk-ams.app.your-skill-id';
var data = {
    "Items":
    [       
    {"Direction":"crack egg\nscramble egg\nput bacon in pan\ncook 10 minuets\nadd egg\ncook 3 minuets\n",
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

var data = "";

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    
 //    var params = {
 //        TableName: "Recipes"
 //    };
 //    dynamo.scan(params, function(err, data1) {
 //        if (err) console.log(err, err.stack); // an error occurred
 //        else {
 //            console.log(data1);   
 //            data = data1;
 //        }        // successful response
 
 // });
    alexa.appId = appId;
   // alexa.dynamoDBTableName = 'UserRecipe';
    alexa.registerHandlers(newSessionHandlers, startGameHandlers, IngredientModeHandlers,DirectionModeHandlers);
    alexa.execute();
};
var states = {
    IngredientMode: '_IngredientMode', // User is trying to access the ingredient.
    STARTMODE: '_STARTMODE',  // Prompt the user to start or restart the game.
    DirectionMode: '_DirectionMode'
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
            //this.attributes['testData'] = data;
            this.attributes['ingredientCount'] = -1;
            this.attributes['stepCount'] = -1;
            this.attributes['ingredientContent'] = "";
            this.attributes['stepContent'] = "";
        }
        this.handler.state = states.STARTMODE;
        this.emit(':ask', 'recipe assistant, what recipe would you like to make?',
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
        if (this.attributes['ingredientCount'] == -1) {
            this.attributes['ingredientCount'] += 1;
            var index = this.attributes['ingredientCount'];

            this.attributes['ResponseText'] = 'the first ingredient is, ' + this.attributes['ingredientContent'][index];
            this.attributes['RepromptText'] = 'You can say next ingredient to check next ingredient';
            this.emit(':ask',this.attributes['ResponseText'],this.attributes['RepromptText']);

        } else {
            this.emit('Unhandled');
        }
    },
    'AdvanceIngredient': function() {
        if (this.attributes['ingredientCount'] !== -1) {
            this.attributes['ingredientCount'] += 1;
            var index = this.attributes['ingredientCount'];

            if (index >= this.attributes['ingredientContent'].length) {
                this.handler.state = states.DirectionMode;
                this.emit(':ask',"You have reached the end of Ingredient list say read recipe to access the step", "say read rescipe or start to aceess Direction");
            }
            this.attributes['ResponseText'] = 'the next ingredient is, ' + this.attributes['ingredientContent'][index];
            this.attributes['RepromptText'] = 'You can say next ingredient to check next ingredient';
            this.emit(':ask',this.attributes['ResponseText'],this.attributes['RepromptText']);
        } else {
            this.emit('Unhandled');
        }
    },
    'RestartIntent': function() {
        var index = 0;
        this.attributes['ingredientCount'] = 0;
        this.attributes['ResponseText'] = 'the first ingredient is.' + this.attributes['ingredientContent'][index];
        this.attributes['RepromptText'] = 'You can say next ingredient to check next ingredient';
        this.emit(':ask',this.attributes['ResponseText'],this.attributes['RepromptText']);

    },
    'LastIngredient': function() {
        if (this.attributes['ingredientCount'] > 0) {
            this.attributes['ingredientCount'] -= 1;
            var index = this.attributes['ingredientCount'];

            this.attributes['ResponseText'] = 'the previous ingredient is,' + this.attributes['ingredientContent'][index];
            this.attributes['RepromptText'] = 'the previous ingredient is,' + this.attributes['ingredientContent'][index];
            this.emit(':ask', this.attributes['ResponseText'], this.attributes['RepromptText']);

        } else {
            this.attributes['ResponseText'] = 'This is the first ingredient in the list';
            this.attributes['RepromptText'] = 'Please user other command';
            this.emit(':ask',this.attributes['ResponseText'],this.attributes['RepromptText']);
        }

    },
    'AMAZON.HelpIntent': function() {
        this.emit(':ask', 'List of help command','List of help command');
    },
    "AMAZON.StopIntent": function() {
        console.log("STOPINTENT");
        this.handler.state = states.STARTMODE;
        this.emit('NewSession'); // Uses the handler in newSessionHandlers
    },
    "AMAZON.CancelIntent": function() {
        console.log("CANCELINTENT");
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        this.emit(':ask', 'Sorry, I didn\'t get that. ', 'Sorry, I didn\'t get that. ');
    }
});

var DirectionModeHandlers = Alexa.CreateStateHandler(states.DirectionMode, {
    'NewSession': function () {
        this.handler.state = '';
        this.emitWithState('NewSession'); // Equivalent to the Start Mode NewSession handler
    },
    'AMAZON.HelpIntent': function() {
        this.emit(':ask', 'List of help command','List of help command');
    },
    "AMAZON.StopIntent": function() {
        console.log("STOPINTENT");
        this.emit('NewSession'); // Uses the handler in newSessionHandlers
    },
    'StartDirection': function() { // start the ingredient
        if (this.attributes['stepCount'] == -1) {
            this.attributes['stepCount'] += 1;
            var index = this.attributes['stepCount'];

            this.attributes['ResponseText'] = 'the first step is, ' + this.attributes['stepContent'][index];
            this.attributes['RepromptText'] = 'You can say next step to check next step';
            this.emit(':ask',this.attributes['ResponseText'],this.attributes['RepromptText']);

        } else {
            this.emit('Unhandled');
        }
    },
    'AdvanceDirection': function() {
        if (this.attributes['stepCount'] !== -1) {
            this.attributes['stepCount'] += 1;
            var index = this.attributes['stepCount'];

            if (index >= this.attributes['stepContent'].length) {
                this.emit(':ask',"You have reached the end of Direction list say stop to return Main menu", "say stop to return to main menu");
            }
            this.attributes['ResponseText'] = 'the next step is,' + this.attributes['stepContent'][index];
            this.attributes['RepromptText'] = 'You can say next ingredient to check next ingredient';
            this.emit(':ask',this.attributes['ResponseText'],this.attributes['RepromptText']);
        } else {
            this.emit('Unhandled');
        }
    },
    'RestartIntent': function() {
        var index = 0;
        this.attributes['stepCount'] = 0;
        this.attributes['ResponseText'] = 'the first step is, ' + this.attributes['stepContent'][index];
        this.attributes['RepromptText'] = 'You can say next step to check next ingredient';
        this.emit(':ask',this.attributes['ResponseText'],this.attributes['RepromptText']);

    },
    'LastDirection': function() {
        if (this.attributes['stepCount'] > 0) {
            this.attributes['stepCount'] -= 1;
            var index = this.attributes['stepCount'];

            this.attributes['ResponseText'] = 'the previous step is, ' + this.attributes['stepContent'][index];
            this.attributes['RepromptText'] = 'the previous step is, ' + this.attributes['stepContent'][index];
            this.emit(':ask', this.attributes['ResponseText'], this.attributes['RepromptText']);

        } else {
            this.attributes['ResponseText'] = 'This is the first step in the list';
            this.attributes['RepromptText'] = 'Please give other command';
            this.emit(':ask',this.attributes['ResponseText'],this.attributes['RepromptText']);
        }

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
