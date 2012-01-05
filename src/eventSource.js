function eventSource(source) {

   // register a new event for the source
   function installEvent (eventName) {

      var eventManager = new eventSource.EventManager(source, eventName);

      // assign the event listener registration function to the specified name
      source[eventName] = function(listener) {
        if (listener) return eventManager.bind(listener);
        return eventManager;
      };

      source[eventName].__eventSourceEvent = true;
   }

   return {
     define: function (eventName, options) {
       options = options || {};

       installEvent(eventName);

       if (options.oneTimeEvent) {
         source[eventName]().oneTimeEvent();
       }

       if (options.emitInterval) {
         source[eventName]().emitInterval(options.emitInterval);
       }

       return this;
     }
   };
}

eventSource.remove = function (object) {

  for (var member in object) {
    if (object[member] && object[member].__eventSourceEvent) {
      object[member]().unbindAll();
    }
  }

  return object;
}

