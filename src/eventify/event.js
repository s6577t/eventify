eventify.Event = (function () {

  function Event (options) {

    this.___source__        = options.source;
    this.___name__          = options.eventName;
    this.___hasOccurred__   = false;
    this.___single__        = !! options.single;
    this.___subscriptions__ = new eventify.Subscriptions;
  };

  Event.prototype = {
    __listen__: function (args) {
      var self = this;

      var eventListener = new eventify.EventListener(args);

      var cancel = false;

      if (self.isSingleEvent() && self.hasOccurred()) {
        eventListener.___callOnNextTick__(self.source, self.___stashedSingleArgs__);
        cancel = true;
      }

      return new eventify.Subscription({
        eventListener: eventListener
      , cancel: cancel
      , subscriptions: self.subscriptions()
      });
    }
  , eventName: function (options) {
      return this.___name__;
    }
  , subscriptions: function () {
      return this.___subscriptions__;
    }
  , emit: function () {
    
      var self      = this
        , source    = this.___source__;

      if (self.isSingle()) {
        if (self.hasOccurred()) {
          return false;
        }
        self.___stashedSingleArgs__ = arguments;
      }

      self.___hasOccurred__ = true;

      self.subscriptions().___callAll__(source, arguments);
      eventify.___emit__(self, arguments);

      if (self.isSingle()) {
        self.subscriptions().cancelAll();
      }

      return true;
    }
  , emitWithArgs: function (args) {
      this.emit.apply(this, args);
    }
  , emitOnNextTick: function () {

      var self = this
        , args = arguments;

      return setTimeout(function () {
        self.emit.apply(self, args);
      }, 0);
    }
  , emitWithArgsOnNextTick  : function (args) {
      this.emitOnNextTick.apply(this, args);
    }
  , isSingleEvent: function () {
      return !!this.___single__;
    }
  , hasOccurred: function () {
      return !!this.___hasOccurred__;
    }
  };

  return Event;
})()