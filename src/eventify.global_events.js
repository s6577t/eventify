(function () {

  var catchAllSubscriptions = new eventify.EventSubscriptions;
  var namedSubscriptions    = {};

  eventify._oneTimeEvents = {}

  function parseNamespaceAndName (namespaceAndName) {
    var parts     = namespaceAndName.split('/')
      , partCount = parts.length;

    if (partCount < 2) {
      throw new Error("Event name syntax: '<namespace>/<event-name>' or './<event-name>' for unnamespaced events");
    }

    var eventName = parts[partCount-1];
    var namespace = parts.slice(0, partCount-1).join('/');

    return {
      eventName: eventName
    , namespace: namespace
    };
  }

  function getSubscriptions (parsedNameAndNamespace) {

    if (parsedNameAndNamespace) {

      namespaceAndName = parsedNameAndNamespace;

      var eventName = namespaceAndName.eventName;
      var namespace = namespaceAndName.namespace;

      namedSubscriptions[namespace] = namedSubscriptions[namespace] || {};

      namespace = namedSubscriptions[namespace];
      namespace[eventName] = namespace[eventName] || new eventify.EventSubscriptions;

      return namespace[eventName];
    }

    return catchAllSubscriptions
  }

  eventify.listen = function () {
    var namespaceAndName, listener;

    if (arguments.length === 1) {
      listener         = arguments[0];
    } else {
      namespaceAndName = arguments[0];
      listener         = arguments[1];
    }
    
    if (namespaceAndName) {
      var parsedNamespaceAndName = parseNamespaceAndName(namespaceAndName);
    }

    var subscriptions = getSubscriptions(parsedNamespaceAndName);

    var eventListener = new eventify.EventListener({
      listener: listener
    });

    var cancel = false;

    if (eventify._oneTimeEvents[namespaceAndName] && eventify._oneTimeEvents[namespaceAndName].hasOccurred) {
      cancel = true;
      eventListener._callOnNextTick(self._stashedOneTimeEventSource, self._stashedOneTimeEventArgs);
    }

    return new eventify.EventSubscription({
      eventListener: eventListener
    , subscriptions: subscriptions
    , cancel: cancel
    });
  }

  eventify._emit = function (event, args) {
    
    var source           = event.source()
      , args             = args || [];
      
    var namespaceAndName = {
      namespace: event.namespace()
    , eventName: event.name()
    };

    var oneTimeEvent = eventify._oneTimeEvents[event.fullName()];

    if (oneTimeEvent) {
      if (oneTimeEvent.hasOccurred) {
        return false;
      }
      oneTimeEvent.hasOccurred                = true;
      oneTimeEvent._stashedOneTimeEventArgs   = args;
      oneTimeEvent._stashedOneTimeEventSource = source;
    }

    var subscriptions = getSubscriptions(namespaceAndName);

    subscriptions._callAll(source, args);

    if (oneTimeEvent) {
      subscriptions.cancelAll();
    }
    
    var catchallArg = namespaceAndName;
    catchallArg.args = args;
    
    catchAllSubscriptions._callAll(source, [catchallArg]);
  }

})();