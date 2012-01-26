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
   function installEvent (options) {
     
      var eventManager = new eventify.EventManager(options);

      // assign the event listener registration function to the specified name
      source[options.eventName] = function(listener) {
        if (listener) return eventManager.bind(listener);
        return eventManager;
      };

      source[options.eventName]._eventifyEvent = true;
   }

   return {
     define: function (eventName, options) {
       options = options || {};
       
       options.source = source;
       options.eventName = eventName;
       
       installEvent(options);

       return this;
     }
   };
}

eventify.removeAllListeners = function (object) {

  for (var member in object) {
    if (object[member] && object[member]._eventifyEvent) {
      object[member]().unbindAll();
    }
  }

  return object;
}

;eventify.EventListener = (function () {

  function EventListener (options) {

    this.listener         = options.listener;
    this._callInterval    = options.callInterval;
    this._hasEmitInterval = typeof this._callInterval === 'number';
    this._callCount       = 0;

    if (typeof options.maxCallCount === 'number') {
      this._hasMaxCallCount = true;
      this._maxCallCount    = options.maxCallCount;
    }
  }

  EventListener.prototype = {
    _call: function (time, source, args) {
      if (!this._hasMaxCallCount || (this._hasMaxCallCount && (this._callCount < this.maxCallCount()))) {
        this._lastCallTime = time;
        this._callCount++;
        return this.listener.apply(source, args);
      }
    }
  , hasExpired: function () {
      return this._hasMaxCallCount && (this._callCount >= this.maxCallCount());
    }
  , callNow: function (source, args) {

      var self = this
        , time = new Date().getTime();

      // if there is a time set, clear it
      if (self._intervalTimeoutId) {
        clearTimeout(self._intervalTimeoutId);
        delete self._intervalTimeoutId;
      }

      if (self._hasEmitInterval) {

        var lastCallTime        = self._lastCallTime || 0
          , intervalElapsed     = lastCallTime < (time - self.callInterval());

        if (!intervalElapsed) {

          // throttle the emission, set a timer which when triggered emits with the most recent arguments

          // stash the most recent arguments for when the interval elapses
          self._stashedEmitArgs = args;

          if (!self._intervalTimeoutId) {
            self._intervalTimeoutId = setTimeout(function () {
              self._call(time, source, self._stashedEmitArgs);
              delete self._stashedEmitArgs;
            }, self.callInterval);
          }

          return;
        }
      }

      self._call(time, source, args);
    }
  , callInterval: function () {
      return this._callInterval;
    }
  , maxCallCount: function () {
      return this._maxCallCount;
    }
  , callCount: function () {
      return this._callCount;
    }
  , callOnNextTick: function (source, args) {
      return this.callAfterN(source, args, 0);
    }
  , callAfterN: function (source, args, n) {
      var self = this;

      return setTimeout(function () {
        self.callNow(source, args);
      }, n);
    }
  };

  return EventListener;
})();;eventify.EventManager = (function () {

  function callEventListeners (args) {
    var self = this;

    for (var i = 0, l = self._listeners.length; i < l; i++) {

      var listener = self._listeners[i];

      listener.callNow(self._source, args);

      if (listener.hasExpired()) {
        l--;
        i--;
        self._listeners.splice(i, 1);
      }
    }

    if (self._oneTimeEvent) self.unbindAll();
  }

  function EventManager (options) {
    
    this._source        = options.source;
    this._eventName     = options.eventName;
    
    if (options.oneTimeEvent) {
      this._oneTimeEvent       = true;
      this._oneTimeEventPassed = false;
    }
    
    this._listeners = [];
  };

  EventManager.prototype = {
    bind: function (options) {

      var listener
        , optionsType = typeof options;

      switch (optionsType) {
        case 'function':
          listener = new eventify.EventListener({
            listener: options
          });
          break;
        case 'object':
          listener = new eventify.EventListener(options);
          break;
        default:
          throw new TypeError('options type not valid: ' + optionsType);
      }

      if (this._oneTimeEvent && this._oneTimeEventPassed) {
        listener.callOnNextTick(this._source, this._oneTimeEventEmitArgs);
      }

      this._listeners.push(listener);

      return new eventify.EventSubscription(this, listener);
    }
  , unbind: function (listenerToRemove) {

      this._listeners = this._listeners.filter(function(registeredListener){
        return registeredListener !== listenerToRemove && registeredListener.listener !== listenerToRemove;
      });

      return this._source;
    }
  , unbindAll: function (listenerToRemove) {
      this._listeners = [];
      return this._source;
    }
  , emit: function () {

      var source    = this._source
        , self      = this;

      if (self._oneTimeEvent) {
        if (self._oneTimeEventPassed) {
          return false;
        } else {
          self._oneTimeEventEmitArgs = arguments;
          self._oneTimeEventPassed   = true;
        }
      }

      callEventListeners.call(self, arguments);

      return true;
    }
  , withInterval: function (callInterval, listener) {
      return this.bind({
        listener: listener
      , callInterval: callInterval
      });
    }
  , listeners: function () {
      return this._listeners;
    }
  , once: function (listener) {
      return this.nTimes(1, listener)
    }
  , nTimes: function (n, listener) {
      return this.bind({
        listener: listener
      , maxCallCount: n
      });
    }
  , isOneTimeEvent: function () {
      return !!this._oneTimeEvent;
    }
  };

  return EventManager;
})();eventify.EventSubscription = (function () {

  function EventSubscription (sourceEventManager, listener) {
    this.sourceEventManager = sourceEventManager;
    this.listener           = listener;
    this._active            = true;
  }

  EventSubscription.prototype = {
    cancel: function () {
      
      if (this.isActive()) {
        this._active = false;
        this.sourceEventManager.unbind(this.listener.listener);
        return true;
      }

      return false;
    }
  , isActive: function () {
      return this._active;
    }
  }

  return EventSubscription;
})();;