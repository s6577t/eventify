function eventify(source, configure) {

   // register a new event for the source
   function installEvent (options) {

      var eventManager = new eventify.EventManager(options);

      // assign the event listener registration function to the specified name
      source[options.eventName] = function(listener) {
        if (listener) return eventManager.bind(listener);
        return eventManager;
      };

      source[options.eventName]._eventifyEvent = true;
   }

   var configurationApi = {
     define: function (eventName, options) {
       options = options || {};

       options.source = source;
       options.eventName = eventName;

       installEvent(options);

       return this;
     }
   };
   
   if (typeof configure === 'function') {
     configure.call(configurationApi, configurationApi);
   }

   return source;
}

eventify.removeAllListeners = function (object) {

  for (var member in object) {
    if (object[member] && object[member]._eventifyEvent) {
      object[member]().unbindAll();
    }
  }

  return object;
}

