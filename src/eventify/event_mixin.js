eventify.EventMixin = (function () {
  return {
    __mixin__: function (args) {
      
      this.__isEventifyEvent__ = true;
      this.__source__          = args.source;
      this.__eventName__       = args.eventName;
      this.__hasOccurred__     = false;
      this.__subscriptions__   = new eventify.Subscriptions;
      
      this.__setSingle__(args.single);
    }
  , __setSingle__: function (single) {
      this.__single__ = !!single;
    }
  , __listen__: function (listener, name) {

      if (name) {
        var context = listener;
        listener = function () {
          return context[name].apply(context, arguments);
        }
      }

      var subs = new eventify.Subscription({
        listener: listener
      , subscriptions: this.subscriptions()
      });

      if (this.isSingle() && this.hasOccurred()) {
        subs.__invokeOnNextTick__(this.__source__, this.__stashedSingleArgs__);
        subs.cancel();
      }

      return subs;
    }
  , eventName: function (options) {
      
      if (options && options.namespace) {
        
        var namespace = this.__source__.events.namespace();
        
        if (namespace) {
          return namespace + '/' + this.__eventName__;
        }
      }

      return this.__eventName__;
    }
  , subscriptions: function () {
      
      return this.__subscriptions__;
    }
  , emit: function () {
    
      var thou   = this
        , source = this.__source__;

      if (thou.isSingle()) {
        if (thou.hasOccurred()) {
          return false;
        }
        thou.__stashedSingleArgs__ = arguments;
      }

      thou.__hasOccurred__ = true;

      thou.subscriptions().__invokeAllNow__(source, arguments);
      
      if (source.events.namespace()) {
        eventify.__emit__({
          source: source
        , args: arguments
        , eventName: thou.eventName({namespace: true})
        });
      }

      if (thou.isSingle()) {
        thou.subscriptions().cancelAll();
      }

      return true;
    }
  , emitWithArgs: function (args) {
      return this.emit.apply(this, args);
    }
  , emitOnNextTick: function () {

      var thou = this
        , args = arguments;

      setTimeout(function () {
        thou.emit.apply(thou, args);
      }, 0);
    }
  , emitWithArgsOnNextTick  : function (args) {
      
      this.emitOnNextTick.apply(this, args);
    }
  , hasOccurred: function () {
      return this.__hasOccurred__;
    }
  , isSingle: function () {
      return this.__single__;
    }
  }
})();