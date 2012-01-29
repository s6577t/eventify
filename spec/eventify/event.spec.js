describe("eventify.Event", function() {

  var object;

  beforeEach(function () {
    object = {};

    eventify(object, function () {
      this.define('onSomeEvent');
      this.define('onOneTime', { oneTimeEvent: true });
    });

    eventify(object, 'in-a-namespace', function () {
      this.define('onSomeOtherEvent');
    });
  });
  
  describe("#_bind()", function() {
    it("calls back on next tick if the event is a one time event and has passed", function() {

      var called = false;
      var args;

      object.onOneTime().emit(1,2,3);
      
      var subscription = object.onOneTime(function () { args = arguments; called = true });
      
      expect(subscription.isActive()).toBe(false);
      
      waits(1);

      runs(function () {
        expect(called).toEqual(true);
        expect(args).toEqual([1,2,3]);
        expect(subscription.isActive()).toBe(false);
      })
    });
  });
  
  describe("#name()", function() {
    it("returns the name of the event", function() {
      expect(object.onSomeEvent().name()).toBe('onSomeEvent');
    });
  });

  describe("#namespace()", function() {
    it("returns the event namespace if defined", function() {

      eventify(object, 'in-a-namespace', function () {
        this.define('beforeSomethingHappens')
      });

      expect(object.beforeSomethingHappens().namespace()).toBe('in-a-namespace');
    });

    it("returns '.' if the event has no namespace", function() {
      expect(object.onSomeEvent().namespace()).toBe('.');
    });
  });

  describe('#emit()', function () {

    it('calls the listeners', function () {

      var f1Called = false
        , f1       = function () { f1Called = true }
        , f2Called = false
        , f2       = function () { f2Called = true };

      object.onSomeEvent(f1);
      object.onSomeEvent(f2);
      object.onSomeEvent().emit();

      expect(f2Called).toBeTruthy();
      expect(f1Called).toBeTruthy();
    });

    it('passes arguments to listeners', function () {
      var arg = 'hello world';
      var passedArg = null;

      object.onSomeEvent(function(a){
        passedArg = a;
      });

      object.onSomeEvent().emit(arg);

      expect(passedArg).toEqual(arg);
    });

    it("returns true if the event is emitted", function() {
      expect(object.onSomeEvent().emit()).toBe(true);
    });

    it("returns false if the event is a one time event and has already been emitted", function() {
      object.onOneTime().emit();
      expect(object.onOneTime().emit()).toBe(false);
    });

    it("returns true if the event emit is throttled", function() {
      object.onSomeEvent().withInterval(100, function () {})
      object.onSomeEvent().emit();
      expect(object.onSomeEvent().emit()).toBe(true);
    });

    it('calls listeners in their context of the event source', function () {

      var context = null;
      var eventHandler = {
        onSomeEvent: function () {
          context = this;
        }
      };

      object.onSomeEvent(eventHandler.onSomeEvent);
      object.onSomeEvent().emit();

      expect(context).toBe(object);
    });

    describe("when the event is a one time event", function() {

      it("should not call listeners more than once", function() {
        var calls = 0;

        object.onOneTime(function () {
          calls++;
        });

        object.onOneTime().emit();
        object.onOneTime().emit();

        expect(calls).toBe(1);
      });

      it("calls event handlers in the normal way the first time the event is emitted", function() {
        var called = false;

        object.onOneTime(function () { called = true});

        expect(called).toEqual(false);

        object.onOneTime().emit();

        expect(called).toEqual(true);
      });

      it("does not call global event listeners after the first emission", function () {
        var count = 0;

        eventify.subscribe('./onOneTime', function () {
          count++;
        });

        object.onOneTime().emit();
        object.onOneTime().emit();

        expect(count).toBe(1);
      });

      it("does not call catchall event listeners after the first emission", function () {
        var count = 0;

        eventify.subscribe(function () {
          count++;
        });

        object.onOneTime().emit();
        object.onOneTime().emit();

        expect(count).toBe(1);
      });
      
      it("causes existing subscribers to become inactive", function() {

        var subs = object.onOneTime(function () {});

        object.onOneTime().emit();

        expect(subs.isActive()).toBe(false);
      });
    });

    describe("global event emission", function() {

      beforeEach(function () {
        object.listener = function () {};
      })

      it("calls the unnamespaced onSomeEvent in ./onSomeEvent", function() {

        spyOn(object, 'listener');
        eventify.subscribe('./onSomeEvent', object.listener);

        object.onSomeEvent().emit();

        expect(object.listener).toHaveBeenCalled();
      });

      it("calls the in-a-namespace in in-a-namespace/onSomeOtherEvent", function () {

        spyOn(object, 'listener');
        eventify.subscribe('in-a-namespace/onSomeOtherEvent', object.listener);

        object.onSomeOtherEvent().emit();

        expect(object.listener).toHaveBeenCalled();
      });

      it("calls catchall event listeners with a single parameter { namespace: ..., eventName: ..., args: ... }", function () {

        var arg;
        var listener = jasmine.createSpy().andCallFake(function (a) {
          arg = a;
        });

        eventify.subscribe(listener);

        object.onSomeOtherEvent().emit(1,2,3,4);

        expect(listener).toHaveBeenCalled();
        expect(arg.args).toEqual([1,2,3,4]);
        expect(arg.namespace).toEqual('in-a-namespace');
        expect(arg.eventName).toEqual('onSomeOtherEvent');

        // spec again with an unnamespaced event

        object.listener = function (a) {
          arg = a;
        }

        spyOn(object, 'listener').andCallThrough();

        eventify.subscribe(object.listener);

        object.onSomeEvent().emit('hello');

        expect(object.listener).toHaveBeenCalled();
        expect(arg.args).toEqual(['hello']);
        expect(arg.namespace).toEqual('.');
        expect(arg.eventName).toEqual('onSomeEvent');

      });

      it("calls global listeners in the context of the source object", function () {
        var context;

        eventify.subscribe(function () {
          context = this;
        });

        object.onSomeEvent().emit();

        expect(context).toBe(object);
      })

    });
  });

  describe("#emitOnNextTick()", function() {
    it("emits the event on the next tick", function() {

      var args;
      object.listener1 = function (hello, world) { args = hello + world; }
      spyOn(object, 'listener1').andCallThrough();

      object.onSomeEvent(object.listener1);

      object.onSomeEvent().emitOnNextTick('hello ', 'world');

      expect(object.listener1).not.toHaveBeenCalled();

      waits(1);

      runs(function () {
        expect(object.listener1).toHaveBeenCalled();
        expect(args).toEqual('hello world');
      });
    });
  });

  describe('.withInterval(callInterval, listenerFunction)', function () {

    it('calls the listeners the first time and then not again until the callInterval at which time the most recently emitted arguments are passed', function () {
      var callParams = [];

      runs(function() {

        var listener = function (value) {
          callParams.push(value);
        };

        object.onSomeEvent().withInterval(200, listener);

        for (var i = 0; i <= 100; i++) {
          object.onSomeEvent().emit(i);
        }
      });

      waits(200);

      runs(function() {
        expect(callParams.length).toEqual(2)
        expect(callParams[0]).toEqual(0);
        expect(callParams[callParams.length-1]).toEqual(100);
      });
    });

    it('calls other event listeners every time the event is emitted', function () {

      var callParams      = []
      ,   otherCallParams = [];

      runs(function() {

        var listener = function (value) {
          callParams.push(value);
        };

        var listener2 = function (value) {
          otherCallParams.push(value);
        };

        object.onSomeEvent().withInterval(20, listener);
        object.onSomeEvent(listener2);

        for (var i = 1; i <= 100; i++) {
          object.onSomeEvent().emit(i);
        }
      });

      waits(20);

      runs(function() {
        expect(otherCallParams.length).toEqual(100);
      });
    });

    it("should return an event subscription", function () {
      expect(object.onSomeEvent().withInterval(1234, function () {})).toBeInstanceOf(eventify.EventSubscription);
    });

    it("returns an event listener with a callInterval", function () {
      var eventSubscription = object.onSomeEvent().withInterval(1234, function () {});
      expect(eventSubscription._eventListener._callInterval).toEqual(1234);
    });

    it("should remove the stash arguments from the event manager so as not to leak memory", function() {
      var callParams = [];

      runs(function() {

        var listener = function (value) {
          callParams.push(value);
        };

        object.onSomeEvent().withInterval(20, listener);

        for (var i = 0; i <= 100; i++) {
          object.onSomeEvent().emit(i);
        }
      });

      waits(20);

      runs(function() {
        expect(object.onOneTime()._stashedOneTimeEventArgs).toBeUndefined();
      });
    });
  });

  describe("#subscriptions()", function() {
    it("should return an EventSubscriptions containing the event subscriptions", function() {

      var listener = function () {};
      object.onSomeEvent(listener);

      var ls = object.onSomeEvent().subscriptions();

      expect(ls.count()).toEqual(1);
      expect(ls.toArray()[0]._eventListener._delegate).toBe(listener);
    });
  });

  describe(".once(listener)", function() {

    it("is a short cut for nTimes", function() {
      spyOn(object.onSomeEvent(), 'nTimes');

      var listener = function () {};
      object.onSomeEvent().once(listener);

      expect(object.onSomeEvent().nTimes).toHaveBeenCalledWith(1, listener);
    });

    it("should return an event subscription", function () {
      expect(object.onSomeEvent().once(function () {})).toBeInstanceOf(eventify.EventSubscription);
    });
  });

  describe(".nTimes(n, listener)", function() {

    [0, 1, 2, 10, 100].forEach(function (n) {
      it("should only call the listener " + n + " times", function() {
        var obj = {};

        eventify(obj, function () {
          this.define('onEvent');
        });

        var count = 0;

        obj.onEvent().nTimes(n, function () {
          count++;
        });

        for (var i = 0; i <= n; i++) {
          obj.onEvent().emit();
        }

        expect(count).toEqual(n);
      });
    })

    it("should return an event subscription", function () {
      expect(object.onSomeEvent().once(function () {})).toBeInstanceOf(eventify.EventSubscription);
    });
    
    describe("when the event is a oneTimeEvent", function() {
      it("should not call the listener on next tick if n=0", function() {
        var listener = jasmine.createSpy();
        
        object.onOneTime().emit();
        
        // the event must have previosuly occurred for the callback on subscription
        object.onOneTime().nTimes(0, listener);
        
        waits(1);
        
        runs(function () {
          expect(listener).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe("#source()", function() {
    it("returns the event source", function() {
      expect(object.onSomeEvent().source()).toBe(object);
    });
  });

  describe("#hasOccured()", function() {
    it("should be true when the event had been emitted", function() {
      object.onSomeEvent().emit();
      expect(object.onSomeEvent().hasOccurred()).toBe(true);
    });

    it("should be false before the event is ever emitter", function() {
      expect(object.onSomeEvent().hasOccurred()).toBe(false);
    });
  });

  describe("#isOneTimeEvent()", function() {
    it("indicates whether the event is a one time event", function() {
      expect(object.onOneTime().isOneTimeEvent()).toBe(true);
      expect(object.onSomeEvent().isOneTimeEvent()).toBe(false);
    });
  });
});