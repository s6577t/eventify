(function () {
  
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
})()