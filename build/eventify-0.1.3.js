/*  Copyright (C) 2011 by sjltaylor

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicence, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/;function eventify(source) {

   // register a new event for the source
   function installEvent (eventName) {
      
      var eventManager = new EventManager(source, eventName);

      // assign the event listener registration function to the specified name
      source[eventName] = function(listener) {

        if (typeof listener === 'function') {
          listeners.push(listener);
          return this;
        }

        return eventManager;
      };

      source[eventName].__eventifyEvent = true;
   }

   return {
     define: function () {
       Array.toArray(arguments).forEach(function (eventName) {
         installEvent(eventName);
       });
       return source;
     }
   };
}

;function deventify (object) {

  for (var member in object) {
    if (object[member] && object[member].__eventifyEvent) {
      object[member]().unbindAll();
    }
  }

  return object;
};eventify.EventManager = (function () {
  
  function runListeners (eventManager) {
    
    eventManager.lastEmitTime = timeNow;
    var results = [];
    
    eventlisteners.forEach(function(listener){
      results.push(listener.apply(source, eventManager._mostRecentArgs));
    });
    
    return results;
  };
  
  function EventManager (source, eventName) {
    this.source     = source;
    this.eventName  = eventName;
    this._listeners = [];
  };
  
  EventManager.prototype = {
    
    unbind: function (listenerToRemove) {
      
      listeners = listeners.filter(function(registeredListener){
        return registeredListener != listenerToRemove;
      });
      
      return this.source;
    }
    , unbindAll: function (listenerToRemove) {
      this.listeners = [];
      return this.source;
    }
    , emit: function () {
      
      var source                      = this.source
        , self                        = this
        , timeNow                     = new Date().getTime()
        , lastEmitTime                = parseInt(this.lastEmitTime, 10) || 0
        , minimumEmitInterval         = parseInt(this.minimumEmitInterval, 10) || 0;
      
      this._mostRecentArgs = arguments;
      
      var eventManager = this;
      
      var clearTimer = function () {
        clearTimeout(eventManager.intervalTimeoutId);
        eventManager.intervalTimeoutId = null;
      };

      var setTimer = function () {
        if (!eventManager.intervalTimeoutId) {
          eventManager.intervalTimeoutId = setTimeout(function () {
            clearTimer();
            runListeners();
          }, minimumEmitInterval);
        }
      };
      
      
      if (lastEmitTime < (timeNow - minimumEmitInterval)) {
         clearTimer();
         return runListeners();
      } else {
         setTimer();
         return [];
      }
    }
    , throttle: function (minimumInterval) {
      minimumInterval = (typeof minimumInterval === 'number') ? minimumInterval : 10;
      minimumInterval = Math.max(minimumInterval, 1);
      this.minimumEmitInterval = minimumInterval;
      return this.self;
    }
    , listeners: function () {
      return listeners;
    }
  };
  
  return EventManager;
})();