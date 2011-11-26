function eventify(source) {

   // register a new event for the source
   function installEvent (eventName) {

      var eventManager = new eventify.EventManager(source, eventName);

      // assign the event listener registration function to the specified name
      source[eventName] = function(listener) {
        if (listener) return eventManager.bind(listener);
        return eventManager;
      };

      source[eventName].__eventifyEvent = true;
   }

   return {
     define: function () {
       for (var i = 0; i < arguments.length; i++) {
         installEvent(arguments[i]);
       }       
       return source;
     }
   };
}

