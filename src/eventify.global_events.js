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

  function getEventProperties (namespaceAndName) {

    if (namespaceAndName) {

      namespaceAndName = parseNamespaceAndName(namespaceAndName);

      var eventName = namespaceAndName.eventName;
      var namespace = namespaceAndName.namespace;

      namedSubscriptions[namespace] = namedSubscriptions[namespace] || {};

      namespace = namedSubscriptions[namespace];
      namespace[eventName] = namespace[eventName] || new eventify.EventSubscriptions;

      return {
        parsedNamespaceAndName: namespaceAndName
      , subscriptions: namespace[eventName]
      };
    } else {
      return {
        subscriptions: catchAllSubscriptions
      };
    }
  }

  eventify.subscribe = function () {
    var namespaceAndName, listener;

    if (arguments.length === 1) {
      listener         = arguments[0];
    } else {
      namespaceAndName = arguments[0];
      listener         = arguments[1];
    }

    var subscriptions = getEventProperties(namespaceAndName).subscriptions;

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

  eventify._emit = function (namespaceAndName, source, args) {
    var oneTimeEvent = eventify._oneTimeEvents[namespaceAndName];

    if (oneTimeEvent) {
      if (oneTimeEvent.hasOccurred) {
        return false;
      }
      oneTimeEvent.hasOccurred = true
      oneTimeEvent._stashedOneTimeEventArgs   = args
      oneTimeEvent._stashedOneTimeEventSource = source;
    }

    var eventProperties = getEventProperties(namespaceAndName);

    eventProperties.subscriptions._callAll(source, args);

    if (oneTimeEvent) {
      eventProperties.subscriptions.cancelAll();
    }

    catchAllSubscriptions._callAll(source, [{
      namespace: eventProperties.parsedNamespaceAndName.namespace
    , eventName: eventProperties.parsedNamespaceAndName.eventName
    , args: args
    }]);
  }

  eventify.emit = function (namespaceAndName, source, args) {
    var namespaceAndName = arguments[0]
      , source           = arguments[1]
      , args             = Array.prototype.slice.call(arguments, 2, arguments.length)

    eventify._emit(namespaceAndName, source, args);
  }

})();