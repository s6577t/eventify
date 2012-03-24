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
*/;eventify = (function () {

  function eventify(source, namespace) {

    if (!('events' in source)) {
      source.events = new eventify.EventsMixin(source);
    }
    
    if (namespace) {
      
      if ('__namespace__' in source.events) {
        throw new Error('Object already has an events namespace');
      }

      source.events.__namespace__ = namespace;
    }
     
    return source.events;
  }

  return eventify;
})();;eventify.Event = (function () {

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
})();eventify.EventMixin = (function () {
  return {
    mixin: function (args) {
      this.__isEventifyEvent__ = true;
      this.__source__          = args.source;
      this.__single__          = args.single;
      this.__eventName__       = args.eventName;
      this.__hasOccurred__     = false;
      this.__subscriptions__   = new eventify.Subscriptions;
    }
  , __listen__: function (listener) {

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
        , event: thou.eventName({namespace: true})
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
})();;eventify.EventsMixin = (function () {

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
})();;(function () {
  
  object(eventify).mixin({
    mixin: function () {
      this.__listeners__ = [];
    }
  , __emit__: function (args) {
      this.__listeners__.forEach(function (listener) {
        
        if (typeof listener === 'function') {
          listener(args);
        } else /* it must be an object */ {
          if (args.event in listener) {
            listener[args.event].apply(args.source, args.args);
          }
        }
      });
    }
  , listen: function (listener) {

      switch (typeof listener) {
        case 'function':
        case 'object':
          this.__listeners__.push(listener);
          return;
        default:
          throw new Error(listener + ' (' + (typeof listener) + ') is not a valid listener')
      }      
    }
  });
})();eventify.Subscription = (function () {

  var idSpool = 0;

  function Subscription (args) {

    if (typeof args.listener !== 'function') {
      throw new Error('a listener function must be provided')
    }

    this.__id__            = ++idSpool;
    this.__listener__      = args.listener;
    this.__subscriptions__ = args.subscriptions;
    this.__listenCount__   = 0;

    this.__activate__();
  }

  Subscription.prototype = {
    __hasExpired__: function () {
      
      return !!(this.__hasMaxCallCount__ && (this.__listenCount__ >= this.__maxCallCount__));
    }
  , __activate__: function () {
      
      this.__active__ = true;
      this.__subscriptions__.__add__(this);
    }
  , __invoke__: function (time, source, args) {
      
      if (!this.__hasExpired__()) {
        
        this.__lastCallTime__ = time;
        this.__listenCount__++;
        
        if (this.__hasExpired__()) {
          this.cancel();
        }

        return this.__listener__.apply(source, args);
      }
    }
  , __invokeNow__: function (source, args) {

      var thou = this
        , time = new Date().getTime();

      // if there is a time set, clear it
      if (thou.__intervalTimeoutId__) {
        clearTimeout(thou.__intervalTimeoutId__);
        delete thou.__intervalTimeoutId__;
      }

      if (thou.__hasCallInterval__) {

        var lastCallTime        = thou.__lastCallTime__ || 0
          , intervalElapsed     = lastCallTime < (time - thou.__callInterval__);

        if (!intervalElapsed) {

          // throttle the emission, set a timer which when triggered calls with the most recent arguments

          // stash the most recent arguments for when the interval elapses
          thou.__stashedCallArgs__ = args;

          if (!thou.__intervalTimeoutId__) {
            thou.__intervalTimeoutId__ = setTimeout(function () {
              thou.__invoke__(time, source, thou.__stashedCallArgs__);
              delete thou.__stashedCallArgs__;
            }, thou.__callInterval__);
          }

          return;
        }
      }

      thou.__invoke__(time, source, args);
    }
  , __invokeOnNextTick__: function (source, args) {
      
      return this.__invokeAfterN__(source, args, 0);
    }
  , __invokeAfterN__: function (source, args, n) {
      var thou = this;

      return setTimeout(function () {
        thou.__invokeNow__(source, args);
      }, n);
    }
  , cancel: function () {

      if (this.isActive()) {
        this.__active__ = false;
        this.__subscriptions__.__remove__(this);

        return true;
      }

      return false;
    }
  , isActive: function () {
      return this.__active__;
    }
  , throttle: function (callInterval) {
      this.__callInterval__ = callInterval;
      this.__hasCallInterval__ = typeof this.__callInterval__ === 'number';
      return this;
    }
  , once: function () {
      return this.nTimes(1)
    }
  , nTimes: function (n) {
      
      var expiredBefore = this.__hasExpired__();

      this.__maxCallCount__ = n;
      this.__hasMaxCallCount__ = typeof n === 'number';
      
      var expiredNow = this.__hasExpired__();

      if (expiredBefore !== expiredNow) {
        if (expiredNow) {
          this.cancel();
        } else {
          this.__activate__();
        }
      }

      return this;
    }
  }

  return Subscription;
})();;eventify.Subscriptions = (function () {

  function Subscriptions (event) {
    this.__subscriptions__ = {};
  }

  Subscriptions.prototype = {
    __add__: function (subscription) {
      this.__subscriptions__[subscription.__id__] = subscription;
    }
  , __remove__: function (subscription) {
      delete this.__subscriptions__[subscription.__id__];
    }
  , __invokeAllNow__: function (source, args) {
      this.each(function (subscription) {
        subscription.__invokeNow__(source, args);
      });
    }
  , cancelAll: function () {
      this.each(function (subs) {
        subs.cancel();
      });
    }
  , each: function (f) {
      
      return object(this.__subscriptions__).each(f);
    }
  , count: function () {
      
      return Object.keys(this.__subscriptions__).length;
    }
  , toArray: function () {
      
      return object(this.__subscriptions__).toArray();
    }
  };

  return Subscriptions;
})();;