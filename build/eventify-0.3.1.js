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
};eventify.EventSubscriptions = (function () {

  function EventSubscriptions (event) {
    this._subscriptions = [];
  }

  EventSubscriptions.prototype = {
    _add: function (eventSubscription) {
      this._subscriptions.push(eventSubscription);
    }
  , _remove: function (eventSubscriptionToRemove) {
      this._subscriptions = this._subscriptions.filter(function(eventSubscription){
        return eventSubscription !== eventSubscriptionToRemove;
      });
    }
  , _callAll: function (source, args) {

      for (var i = 0, len = this._subscriptions.length; i < len; i++) {

        var subscription = this._subscriptions[i];

        subscription._eventListener._callNow(source, args);

        if (subscription._eventListener._hasExpired()) {
          i--;
          len--;
          subscription.cancel();
        }
      }
    }
  , cancelAll: function () {
      this._subscriptions.forEach(function (subs) {
        subs._active = false;
      });
      this._subscriptions = [];
    }
  , forEach: function (f) {
      return this._subscriptions.forEach(f);
    }
  , count: function () {
      return this._subscriptions.length;
    }
  , toArray: function () {
      return this._subscriptions.splice(0, this._subscriptions.length);
    }
  };

  return EventSubscriptions;
})();;(function () {

  var catchAllSubscriptions = new eventify.EventSubscriptions;
  var namedSubscriptions    = {};

  eventify._oneTimeEvents = {}

  function parseNamespaceAndName (namespaceAndName) {
    var parts     = namespaceAndName.split('/')
      , partCount = parts.length;

    if (partCount < 2) {
      throw new Error("Event name syntax: '<namespace>/<event-name>' or './<event-name>' for unnamespaced events");
    }

    var eventName = parts[partCount-1];
    var namespace = parts.slice(0, partCount-1).join('/');

    return {
      eventName: eventName
    , namespace: namespace
    };
  }

  function getEventProperties (namespaceAndName) {

    if (namespaceAndName) {

      namespaceAndName = parseNamespaceAndName(namespaceAndName);

      var eventName = namespaceAndName.eventName;
      var namespace = namespaceAndName.namespace;

      namedSubscriptions[namespace] = namedSubscriptions[namespace] || {};

      namespace = namedSubscriptions[namespace];
      namespace[eventName] = namespace[eventName] || new eventify.EventSubscriptions;

      return {
        parsedNamespaceAndName: namespaceAndName
      , subscriptions: namespace[eventName]
      };
    } else {
      return {
        subscriptions: catchAllSubscriptions
      };
    }
  }

  eventify.subscribe = function () {
    var namespaceAndName, listener;

    if (arguments.length === 1) {
      listener         = arguments[0];
    } else {
      namespaceAndName = arguments[0];
      listener         = arguments[1];
    }

    var subscriptions = getEventProperties(namespaceAndName).subscriptions;

    var eventListener = new eventify.EventListener({
      listener: listener
    });

    var cancel = false;

    if (eventify._oneTimeEvents[namespaceAndName] && eventify._oneTimeEvents[namespaceAndName].hasOccurred) {
      cancel = true;
      eventListener._callOnNextTick(self._stashedOneTimeEventSource, self._stashedOneTimeEventArgs);
    }

    return new eventify.EventSubscription({
      eventListener: eventListener
    , subscriptions: subscriptions
    , cancel: cancel
    });
  }

  eventify._emit = function (namespaceAndName, source, args) {
    var oneTimeEvent = eventify._oneTimeEvents[namespaceAndName];

    if (oneTimeEvent) {
      if (oneTimeEvent.hasOccurred) {
        return false;
      }
      oneTimeEvent.hasOccurred = true
      oneTimeEvent._stashedOneTimeEventArgs   = args
      oneTimeEvent._stashedOneTimeEventSource = source;
    }

    var eventProperties = getEventProperties(namespaceAndName);

    eventProperties.subscriptions._callAll(source, args);

    if (oneTimeEvent) {
      eventProperties.subscriptions.cancelAll();
    }

    catchAllSubscriptions._callAll(source, [{
      namespace: eventProperties.parsedNamespaceAndName.namespace
    , eventName: eventProperties.parsedNamespaceAndName.eventName
    , args: args
    }]);
  }

  eventify.emit = function (namespaceAndName, source, args) {
    var namespaceAndName = arguments[0]
      , source           = arguments[1]
      , args             = Array.prototype.slice.call(arguments, 2, arguments.length)

    eventify._emit(namespaceAndName, source, args);
  }

})();;eventify.Event = (function () {

  function Event (options) {

    this._source        = options.source;
    this._name          = options.eventName;
    this._namespace     = options.namespace;
    this._hasOccurred   = false;
    this._oneTimeEvent  = !! options.oneTimeEvent;
    this._subscriptions = new eventify.EventSubscriptions;
  };

  Event.prototype = {
    _listen: function (args) {
      var self = this;

      var eventListener = new eventify.EventListener(args);

      var cancel = false;

      if (self.isOneTimeEvent() && self.hasOccurred()) {
        eventListener._callOnNextTick(self.source, self._stashedOneTimeEventArgs);
        cancel = true;
      }

      return new eventify.EventSubscription({
        eventListener: eventListener
      , cancel: cancel
      , subscriptions: self.subscriptions()
      });
    }
  , name: function () {
      return this._name;
    }
  , namespace: function () {
      return this._namespace || '.';
    }
  , fullName: function () {
      return this.namespace() + '/' + this.name();
    }
  , source: function () {
      return this._source;
    }
  , subscriptions: function () {
      return this._subscriptions;
    }
  , emit: function () {

      var self      = this
        , source    = this._source;

      if (self.isOneTimeEvent()) {
        if (self.hasOccurred()) {
          return false;
        }
        self._stashedOneTimeEventArgs = arguments;
      }

      self._hasOccurred = true;

      self.subscriptions()._callAll(source, arguments);
      eventify._emit(self.fullName(), source, arguments);

      if (self.isOneTimeEvent()) {
        self.subscriptions().cancelAll();
      }

      return true;
    }
  , emitOnNextTick: function () {

      var self = this
        , args = arguments;

      return setTimeout(function () {
        self.emit.apply(self, args);
      }, 0);
    }
  , withInterval: function (callInterval, listener) {
      return this._listen({
        listener: listener
      , callInterval: callInterval
      });
    }
  , once: function (listener) {
      return this.nTimes(1, listener)
    }
  , nTimes: function (n, listener) {
      return this._listen({
        listener: listener
      , maxCallCount: n
      });
    }
  , isOneTimeEvent: function () {
      return !!this._oneTimeEvent;
    }
  , hasOccurred: function () {
      return !!this._hasOccurred;
    }
  };

  return Event;
})();eventify.EventListener = (function () {

  function EventListener (options) {

    this._delegate        = options.listener;
    this._callInterval    = options.callInterval;
    this._hasCallInterval = typeof this._callInterval === 'number';
    this._callCount       = 0;

    if (typeof options.maxCallCount === 'number') {
      this._hasMaxCallCount = true;
      this._maxCallCount    = options.maxCallCount;
    }
  }

  EventListener.prototype = {
    _hasExpired: function () {
      return this._hasMaxCallCount && (this._callCount >= this._maxCallCount);
    }
  , _call: function (time, source, args) {
      if (!this._hasMaxCallCount || (this._hasMaxCallCount && (this._callCount < this._maxCallCount))) {
        this._lastCallTime = time;
        this._callCount++;
        return this._delegate.apply(source, args);
      }
    }
  , _callNow: function (source, args) {

      var self = this
        , time = new Date().getTime();

      // if there is a time set, clear it
      if (self._intervalTimeoutId) {
        clearTimeout(self._intervalTimeoutId);
        delete self._intervalTimeoutId;
      }

      if (self._hasCallInterval) {

        var lastCallTime        = self._lastCallTime || 0
          , intervalElapsed     = lastCallTime < (time - self._callInterval);

        if (!intervalElapsed) {

          // throttle the emission, set a timer which when triggered calls with the most recent arguments

          // stash the most recent arguments for when the interval elapses
          self._stashedCallArgs = args;

          if (!self._intervalTimeoutId) {
            self._intervalTimeoutId = setTimeout(function () {
              self._call(time, source, self._stashedCallArgs);
              delete self._stashedCallArgs;
            }, self._callInterval);
          }

          return;
        }
      }

      self._call(time, source, args);
    }
  , _callOnNextTick: function (source, args) {
      return this._callAfterN(source, args, 0);
    }
  , _callAfterN: function (source, args, n) {
      var self = this;

      return setTimeout(function () {
        self._callNow(source, args);
      }, n);
    }
  };

  return EventListener;
})();;eventify.EventSubscription = (function () {

  function EventSubscription (args) {

    this._active        = true;
    this._eventListener = args.eventListener;
    this._subscriptions = args.subscriptions;
    
    if (args.cancel) {
      this._active = false;
    } else {
      this._subscriptions._add(this);
    }
  }

  EventSubscription.prototype = {
    cancel: function () {

      if (this.isActive()) {
        this._active = false;
        this._subscriptions._remove(this);
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