eventify.EventManager = (function () {

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
  , withInterval: function (emitInterval, listener) {
      return this.bind({
        listener: listener
      , emitInterval: emitInterval
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
      return this._oneTimeEvent;
    }
  };

  return EventManager;
})()