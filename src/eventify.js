function eventify(source) {

    var namespace, configure;

    if (arguments.length === 3) {
      namespace = arguments[1];
      configure = arguments[2];
    } else {
      configure = arguments[1];
    }

   function installEvent (options) {

      var _event = new eventify.Event(options);

      // assign the event listener registration function to the specified name
      source[options.eventName] = function(listener) {

        if (typeof listener === 'function') {
          return _event._listen({
            listener: listener
          });
        }

        return _event;
      };

      source[options.eventName]._returnsAnEventifyEvent = true;

      if (_event.isOneTimeEvent()) {
        eventify._oneTimeEvents[_event.fullName()] = { hasOccurred: false };
      }
   }

   var configurationApi = {

     define: function (eventName, options) {
       options = options || {};

       options.source    = source;
       options.eventName = eventName;
       options.namespace = namespace

       installEvent(options);

       return this;
     }
   };

   if (typeof configure === 'function') {
     configure.call(configurationApi, configurationApi);
   }

   return source;
}

eventify.cancelAllSubscriptionsOn = function (object) {

  for (var member in object) {
    if (object[member] && object[member]._returnsAnEventifyEvent) {
      object[member]().subscriptions().cancelAll();
    }
  }

  return object;
}