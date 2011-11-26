# Eventify

SIZE OF MINIFIED FILE AND SLOC GOES HERE

A Javascript events library

## Principles

* Event declaration and emission should be explicit
* Registering event listeners for events that an object does not emit should fail fast
* Evented programming is essential for Web UIs; why not have an appropriately capable event library

## Declaring Events On An Object

    var object = {};
    
    eventify(object).define(
      'onThis',
      'onThat',
      'onTheOther
    );

* returns object

## Emitting An Event

    object.onThat().emit(123, 'some text', ['some', 'things']);

* arguments are passed on to each listener
* returns object

This syntax is preferred over the jQuery style `object.onThat(123, 'some text', ['some', 'things']);` because the intent of the statement is explicit.

## Listening to an event

Also known as binding.
    
    object.onThis(function () {
      // event handling code here
      // this === object
      // arguments are those passed when the event was emitted
    });

* returns object

## Throttling An Event

Call listeners no more than once every N milliseconds
    
    var intervalBetweenEventEmissionsInMilliseconds = 200;
    
    object.onThis().throttle(intervalBetweenEventEmissionsInMilliseconds);

* if no intervalBetweenEventEmissionsInMilliseconds is specified, the default is 10
* returns object

### Behaviour

The event behaves as a normal event for the first emission. Each successive emission within the throttle interval does not result in the listeners being called. When the throttle interval elapses, the listeners are called with the most recent arguments.

Scenario:

    object.onThis().throttle(1000);
    object.onThis(function (i) {
      console.info(i);
    })
    
    for(var i = 1; i <= 1000; i++) {
      object.onThis().emit(i);
    }

* `1` is written to the console immediately
* `1000` is written to the console a second later

## Listening To An Event __Once__
TODO
The event listener will only be called the next time the event is emitted.

    object.onThis().once(function () {
      // only gets called on the next event omission
    });

## One-time events
TODO
Turn this event into a one-time event which behaves like a normal event until it is emitted, after which new listeners are called **immediately**

## Unbinding from and event

    object.onThis().unbind(eventListenerFunction)

* the specified eventListenerFunction will no longer be called
* returns object

### Unbinding All listeners

    object.onThis().unbindAll()

* no event listeners will be called thereafter
* returns object

## `deventify()`

    deventify(object)

* removes all event listeners from all events but leaves the events in place. To remove and event from an object: `delete object.onSomeEvent;`
* returns object

## Limitations

* No guarantees are made about the order in which event listeners are called.