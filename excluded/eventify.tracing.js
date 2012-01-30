eventify.nullTracer = {
  trace: function () {}
, info:  function () {}
}

eventify.trace = function () {
  for (var i = 0, l = arguments.length; i < l; i++) {
    eventify._trace.info(arguments[i]);
  }
  eventify._trace.trace();
}

eventify.enableTracing = function (optionalOutput) {
  var c = optionalOutput || console;
  eventify._trace = c;
}

eventify.disableTracing = function () {
  eventify.enableTracing(eventify.nullTracer);
}

eventify.disableTracing();



+====== DO THIS AS A SEPARATE LIBRARY!! ======+

-> enable event tracing.
  eventify.enableTracing(console || window.console);
  eventify.disableTracing(); 
  using a null logger for disable
  
  print:
    - the event being emit globally
    _ the number of object listeners
    - the number of global listeners
    - when the event is suppressed by callInterval
    - when the listener has expired
    - when the event was a oneTimeEvent occurs
    - when binding to a one time event and calling back on next tick