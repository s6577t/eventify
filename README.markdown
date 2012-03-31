     _____                 _   _  __       
    | ____|_   _____ _ __ | |_(_)/ _|_   _ 
    |  _| \ \ / / _ \ '_ \| __| | |_| | | |
    | |___ \ V /  __/ | | | |_| |  _| |_| |
    |_____| \_/ \___|_| |_|\__|_|_|  \__, |
                                     |___/ 




## Principles

* Evented programming is essential to javascript; Eventify is a suitably capable events library
* The api for event declaration, emission and listening is consistent, plain and explicit
* Use first class language constructs instead of strings

## Eventifying an object

    var object = {};
    
    eventify(object).define(
      'onThis',
      'onThat',
      'onTheOther
    );

`eventify(obj)` is idempotent.


## Emitting An Event
    
    this.onSomeEvent.emit(123, 'some text', ['some', 'things']);
    /* 
      emitting an that does not exist will fail fast compared to other event systems:

      this.trigger('an-event', args) // quietly fails. unhelpful.

    */


## Listening To An Event

    
    var subscription = object.onThis(function () {
      // event handling code here
      // this === the source object
      // arguments are those passed when the event was emitted
    });

* returns object
* event listeners run in the context of object

### Subscriptions

* `subscription.cancel()`
* `subscription.isActive()`
* `subscirption.once()` (details below)
* `subscirption.throttle()` (details below)

## Throttling An Event

Call a listener no more than once every N milliseconds
        
    object.onThis(function () { ... }).throttle(200);


### Behaviour

The event behaves as a normal event for the first emission. Each successive emission within the throttle interval does not result in the listeners being called. When the throttle interval elapses, the listeners are called with the most recent arguments.

Scenario:

    object.onThis().  emitInterval(1000);
    object.onThis(function (i) {
      console.info(i);
    })
    
    for(var i = 1; i <= 1000; i++) {
      object.onThis().emit(i);
    }

* `1` is written to the console immediately
* `1000` is written to the console a second later

TODO: add a timeline here to make it clearer

## Listening To An Event __Once__

The event listener will only be called the next time the event is emitted.

    object.onThis(function () {
      // only gets called on the next event omission
    }).once();

    // short for object.onThis(function () {...}).nTimes(1);

## Single Events

Some events such as `onInit`, `onLoad`, `onReady` are only ever emitted once.

    eventify(this).single('onInit');

After the first emission all subscriptions are cancelled. Any listeners added after the event has occurred can will be called on the next tick.

check is an event has occurred with `object.onAnEvent.hasOccurred()`

## Events 

Each event has several methods intended to be used internally by the eventified object:

    eventify(this).define('onSomeEvent')

`this.onSomeEvent` now has:

* `eventName([{namespace: true}])`: returns the event name optionally with a namespace(more on namespaces later)
* `subscriptions()`: an `eventify.Subscriptions` subscription collection on which you can call:
  * `count()`
  * `toArray()`
  * `each(callback)`
  * `cancelAll()`
* `emit(...)`: emit the event with any arguments
* `emitWithArgs(arrayOfArgs)`
* `emitOnNextTick(...)`
* `emitWithArgsOnNextTick(arrayOfArgs)`
* `hasOccurred()`
* `isSingle()`

## Piping events from another object
    
    // pipe all events from some other object
    eventify(this).pipe(source);

    // or a subset...
    eventify(this).pipe(source, 'onHighlight', 'onClick');

    // map the events to a different name on this
    eventify(this).pipe(source, 'onHighlight:onSelect', 'onClick:onPress');


## Global event listening
  
## namespacing an object

    eventify(this, 'my-namespace').define('onSomeEvent').single('onInit');

## Global listening

    eventify.listen({
      'my-namespace/onSomeEvent': function (...) {
        // this is the event source
      }
    , 'my-namespace/onInit': function () { ... } 
    });

## Global catch-all

    eventify.listen(function (event) {
        /*
          event looks like: {
            source: ...
          , eventName: 'my-namespace/onInit'
          , args: ... // arguments object
          }
        */
    });


## The eventified object

After an object is eventified it has an events member:

  eventify(this);

`this.events` now has:

* `define(...)`
* `single(...)`
* `pipe(originator, ...)`
* `names()`: array of event names
* `namespace()`: objects global namespace
* `cancelAllSubscriptions()`: cancels all subscriptions to all events on the object

Further eventification on `this` can be performed like so...
  
  this.events.define('onOtherEvent').single('onTeardown')
    

## Limitations

* No guarantees are made about the order in which event listeners are called.

