eventify.EventsMixin = (function () {

  function EventsMixin (source) {
    this.__source__ = source;
  }

  EventsMixin.prototype = {
    __defineEvents__: function (args) {

      var source = this.__source__;

      args.names = Array.prototype.slice.call(args.names, 0);

      args.names.forEach(function (name) {
        
        if (name in source) {
          throw new Error('member already defined: ' + name);
        }

        source[name] = function (listenerFunction) {
          return source[name].__listen__(listenerFunction);
        }

        object(source[name]).mixin(eventify.EventMixin, {
          source:    source
        , single:    !!args.single 
        , eventName: name
        });
      });

      return this;
    }
  , define: function () {

      return this.__defineEvents__({
        names: arguments
      });
    }
  , single: function () {
      return this.__defineEvents__({
        names: arguments
      , single: true
      });
    }
  , pipe: function (originator) {
      
      var thou       = this
        , propagator = this.__source__
        , events     = Array.prototype.slice.call(arguments, 1);

      if (!originator || (typeof originator !== 'object')) {
        throw new Error('the object to pipe events from must be specified');
      }

      if (events.length == 0) {
        events = originator.events.names();
      }

      events.forEach(function (event) {
        
        if (!originator[event] || !originator[event].__isEventifyEvent__) {
          throw new Error(event + ' is not an event');
        }

        if (propagator[event] && !propagator[event].__isEventifyEvent__) {
          throw new Error('already defined but not an event: ' + event);
        }

        if (!propagator[event]) {
          
          if (originator[event].isSingle()) {
            thou.single(event);
          } else {
            thou.define(event);
          }
        }        
        
        originator[event](function () {
          propagator[event].emit.apply(propagator[event], arguments);
        });
      });
    }
  , names: function () {

      var source = this.__source__;

      return Object.keys(this.__source__).filter(function (name) {
        return !!(source[name] && source[name].__isEventifyEvent__);
      });
    }
  , namespace: function () {
      
      return this.__namespace__;
    }
  , cancelAllSubscriptions: function () {

      var source = this.__source__;
      
      this.names().forEach(function (name) {
        source[name].subscriptions().cancelAll();
      });
    }
  }

  return EventsMixin;
})();