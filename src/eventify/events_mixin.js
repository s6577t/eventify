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
          
          if (!source[name].__isEventifyEvent__) {
            throw new Error('member already defined: ' + name);
          }
        } else {

          source[name] = function () {
            return source[name].__listen__.apply(source[name], arguments);
          }

          object(source[name]).mixin(eventify.EventMixin, {
            source:    source
          , eventName: name
          });
        }  

        source[name].__setSingle__(args.single);      
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
        , names     = Array.prototype.slice.call(arguments, 1);

      if (!originator || (typeof originator !== 'object')) {
        throw new Error('the object to pipe events from must be specified');
      }

      if (originator === propagator) {
        throw new Error('an object cannot pipe events from itself');
      }

      if (names.length == 0) {
        names = originator.events.names();
      }

      names.forEach(function (name) {

        var originatorEvent = name
          , propagatorEvent = name;

        /*
          if the name is of the form 'onThis:onThat' it is a mapping
          originator.onThis is piped to propagator.onThat.
        */
        var matches = /^([^:]+):([^:]+)$/.exec(name);

        if (matches) {
          originatorEvent = matches[1];
          propagatorEvent = matches[2];
        }
        
        if (!originator[originatorEvent] || !originator[originatorEvent].__isEventifyEvent__) {
          throw new Error(originatorEvent + ' is not an event');
        }

        if (propagator[propagatorEvent] && !propagator[propagatorEvent].__isEventifyEvent__) {
          throw new Error('already defined but not an event: ' + propagatorEvent);
        }

        if (!propagator[propagatorEvent]) {
          
          if (originator[originatorEvent].isSingle()) {
            thou.single(propagatorEvent);
          } else {
            thou.define(propagatorEvent);
          }
        }        
        
        originator[originatorEvent](function () {
          propagator[propagatorEvent].emit.apply(propagator[propagatorEvent], arguments);
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