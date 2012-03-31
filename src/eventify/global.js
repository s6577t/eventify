(function () {
  
  object(eventify).mixin({
    __mixin__: function () {
      this.__catchall__  = [];
      this.__listeners__ = {}
    }
  , __emit__: function (args) {
      
      this.__catchall__.forEach(function (listener) {
        listener(args);
      });

      var listeners = this.__listeners__[args.eventName];
      
      if (listeners) {
        listeners.forEach(function (listener) {
          listener.apply(args.source, args.args);
        });
      }
    }
  , listen: function (listener) {

      switch (typeof listener) {
        case 'function':
          this.__catchall__.push(listener);
          return;
        case 'object':
          
          var thou = this
            , listeners = thou.__listeners__;

          object(listener).each(function (listener, eventName) {
            listeners[eventName] = listeners[eventName] || [];
            listeners[eventName].push(listener);
          })
          return;
        default:
          throw new Error(listener + ' (' + (typeof listener) + ') is not a valid listener')
      }      
    }
  });
})()