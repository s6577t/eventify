describe("EventManager", function() {

  var object;

  beforeEach(function () {
    object = {};

    eventify(object, function () {
      this.define('onSomeEvent');
      this.define('onOneTime', { oneTimeEvent: true });
    });
  });

  describe(".bind()", function() {

    it("throws an error if no listener is specified", function() {
      expect(function () {
        object.onSomeEvent().bind();
      }).toThrow();
    });

    it("should return an event subscription", function () {
      expect(object.onSomeEvent().bind(function () {})).toBeInstanceOf(eventify.EventSubscription);
    });

    it("creates an event listener", function() {
      var listener = function () {}
      var subs = object.onSomeEvent().bind(listener);
      expect(subs.listener).toBeInstanceOf(eventify.EventListener);
    });

    it("creates an EventListener if a function is passed", function() {
      var listener = function () {};
      var subs = object.onSomeEvent().bind(listener);
      expect(subs.listener.listener).toBe(listener);
    });
  });

  describe('.emit()', function () {

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

    it('calls listeners in their original context', function () {

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

    it("should return an event listener with an callInterval", function () {
      var eventSubscription = object.onSomeEvent().withInterval(1234, function () {});
      expect(eventSubscription.listener.callInterval()).toEqual(1234);
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
        expect(object.onOneTime()._oneTimeEventEmitArgs).toBeUndefined();
      });
    });
  });

  describe('.unbind()', function () {

    it('should not call the removed handler when passed the listener function', function () {

      object.listener = function () {}

      spyOn(object, 'listener');

      object.onSomeEvent(object.listener);
      object.onSomeEvent().unbind(object.listener);
      object.onSomeEvent().emit();

      expect(object.listener).not.toHaveBeenCalled();
    });

    it('should not call the removed handler when passed the eventify.EventListener', function () {

      object.listener = function () {}

      spyOn(object, 'listener');

      var eventListener = object.onSomeEvent(object.listener).listener;
      object.onSomeEvent().unbind(eventListener);
      object.onSomeEvent().emit();

      expect(eventListener).not.toBeNull();
      expect(object.listener).not.toHaveBeenCalled();
    });

    it("should return the source", function() {
      expect(object.onSomeEvent().unbind(function () {})).toBe(object);
    });
  });

  describe('.unbindAll()', function () {
    it('should not call any listeners when events are emitted', function () {

      object.listener1 = function () {};
      object.listener2 = function () {};
      object.listener3 = function () {};

      spyOn(object, 'listener1');
      spyOn(object, 'listener2');
      spyOn(object, 'listener3');

      object.onSomeEvent(object.listener1);
      object.onSomeEvent(object.listener2);
      object.onSomeEvent(object.listener3);
      object.onSomeEvent().unbindAll();
      object.onSomeEvent().emit();

      expect(object.listener1).not.toHaveBeenCalled();
      expect(object.listener2).not.toHaveBeenCalled();
      expect(object.listener3).not.toHaveBeenCalled();
    });

    it("should return the source", function() {
      expect(object.onSomeEvent().unbindAll()).toBe(object);
    });
  });

  describe(".listeners()", function() {
    it("should return an array of the event listeners", function() {

      var listener = function () {};
      object.onSomeEvent(listener);

      var ls = object.onSomeEvent().listeners();

      expect(ls.length).toEqual(1);
      expect(ls[0].listener).toBe(listener);
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
  });

  describe("one time events", function() {

    it("should call event handlers in the normal way the first time the event is emitted", function() {
      var called = false;

      object.onOneTime(function () { called = true});

      expect(called).toEqual(false);

      object.onOneTime().emit();

      expect(called).toEqual(true);
    });

    it("should call back on next tick if the one time event has passed", function() {

      var called = false;
      var args;

      runs(function () {

        object.onOneTime().emit(1,2,3);

        object.onOneTime(function () { args = arguments; called = true });


      });

      waits(1);

      runs(function () {
        expect(called).toEqual(true);
        expect(args).toEqual([1,2,3]);
      })
    });

    describe("when the event is emitted more than once", function() {

      it("should not call listeners more than once", function() {
        var calls = 0;

        object.onOneTime(function () {
          calls++;
        });

        object.onOneTime().emit();
        object.onOneTime().emit();

        expect(calls).toBe(1);
      });
    });
  });
});