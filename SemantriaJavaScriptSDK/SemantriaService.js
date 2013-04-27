var SemantriaService = (function() {
  var debug = false;
  //var outputElement = document.getElementById("output");

  // Implement custom callback handler if needed
  function SimpleCallbackHandler() {};
  SimpleCallbackHandler.prototype = CallbackHandler;

  SimpleCallbackHandler.prototype.onRequest = function(request) {
    //output('onRequest: ' + request);
  };
  SimpleCallbackHandler.prototype.onResponse = function(request) {
    //output('onResponse: ' + request);
  };
  SimpleCallbackHandler.prototype.onError = function(request) {
    //output('onError: ' + request);
  };
  SimpleCallbackHandler.prototype.onDocsAutoResponse = function(request) {};
  SimpleCallbackHandler.prototype.onCollsAutoResponse = function(request) {};

  // the consumer key and secret
  var consumerKey = "9cb16157-23ac-42cb-8e3f-4c08cf74740f";
  var consumerSecret = "8dd0484c-95cd-4474-beec-0530044d0246";

  // Creates JSON serializer instance
  var serializer = new JsonSerializer();
  // Initializes new session with the keys, the serializer object, application name and compression condition.
  var session = new Session(consumerKey, consumerSecret, serializer, 'myApp', true);
  // Initialize session callback handler
  var callback = new SimpleCallbackHandler();
  session.setCallbackHandler(callback);

  function wait(milliseconds) {
    milliseconds += new Date().getTime();
    while (new Date() < milliseconds){}
  }

  function output(message) {
    if (debug) {
      console.log(message);
    }
  }

  function batchQueueDocuments(texts) {
    // Push text for analysis
    var docs = [];
    for (var key in texts) {
      // Creates a sample document which need to be processed on Semantria
      var doc = {"id" : key, "text" : texts[key]};
      docs.push(doc); 
    }


    var remaining = docs.length;
    var batchnum = 0;
    var perbatch = 50;
    while (remaining > 0) {
      var start = batchnum*perbatch;
      var end = Math.min(start+perbatch, docs.length);
      var batch = docs.slice(start, end);
      output("sent " + end + "/" + docs.length);
      remaining -= perbatch;
      // Queues document for processing on Semantria service
      var status = session.queueBatchOfDocuments(docs);
      // Check status from Semantria service
      if (status == 202) {
        output("\"" + doc["id"] + "\" document queued successfully");
      } else {
        console.log("something went wrong: " + status);
       	console.log(status);
      }
      batchnum++;
    }

    var analyticData = new Array();
    while(analyticData.length < texts.length) {
      output("Retrieving your processed results...<br/>");
      // Give Semantria time to process queued documents
      wait(2000);

      // Requests processed results from Semantria service
      var processedDocuments = session.getProcessedDocuments();
      if (processedDocuments && processedDocuments.constructor == Array) {
        for (var i in processedDocuments) {
          output("Got back " + analyticData.length + "/" + texts.length);
          analyticData.push(processedDocuments[i]);
        }
      }
    } 

    return analyticData;
  }

  return {
    // Main function of our test application
    getSentimentScores: function (texts) {
      var objects = batchQueueDocuments(texts);
      var scores = new Array();
      output("re read");
      for (var i = 0; i < objects.length; i++) {
        var o = objects[i];
        output(o["summary"] + ": " + o["sentiment_score"]);
        scores[parseInt(o["id"])] = o["sentiment_score"];
      }

      return scores;
    },

    session: function() {
      return session;
    }
  };
})();