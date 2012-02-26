eventify.Event = (function () {

  function Event (options) {

    this._source        = options.source;
    this._name          = options.eventName;
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
      return this._source.eventifyNamespace || '.';
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
      eventify._emit(self, arguments);

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
})()