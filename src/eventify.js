eventify = (function () {

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
})();