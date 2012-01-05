describe("event manager", function() {

  var object;

  beforeEach(function () {
    object = {};
    eventSource(object).define('onSomeEvent');
  });

  describe("bind()", function() {

    it("should return an event subscription", function () {
      expect(object.onSomeEvent().bind(function () {})).toBeInstanceOf(eventSource.EventSubscription);
    });
  });

  describe('emit()', function () {

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

    it("should return true if the event is emitted", function() {
      expect(object.onSomeEvent().emit()).toBe(true);
    });

    it("should return false if the event is a one time event and has already been emitted", function() {
      object.onSomeEvent().oneTimeEvent();
      object.onSomeEvent().emit();
      expect(object.onSomeEvent().emit()).toBe(false);
    });

    it("should return false if the event emit is throttled", function() {
      object.onSomeEvent().emitInterval(100)
      object.onSomeEvent().emit();
      expect(object.onSomeEvent().emit()).toBe(false);
    });

    it('should call listeners in their original context', function () {

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

  describe('emitInterval()', function () {

    it('calls the listeners the first time and then not again until the emitInterval at which time the most recently emitted arguments are passed', function () {
      var callParams = [];

      runs(function() {

        var listener = function (value) {
          callParams.push(value);
        };

        object.onSomeEvent(listener);
        object.onSomeEvent().emitInterval(200);

        for (var i = 0; i <= 100; i++) {
          object.onSomeEvent().emit(i);
        }
      });

      waits(200);

      runs(function() {
        expect(callParams[0]).toEqual(0);
        expect(callParams[callParams.length-1]).toEqual(100);
      });
    });

    it("returns object when passed an interval", function() {
      expect(object.onSomeEvent().emitInterval(123)).toBe(object);
    });

    it("returns the emit interval when passed no arguments", function() {
      object.onSomeEvent().emitInterval(1234);
      expect(object.onSomeEvent().emitInterval()).toBe(1234);
    });

    it("should remove the emitInterval when called with null", function() {

      object.onSomeEvent().emitInterval(100);
      expect(object.onSomeEvent()._emitInterval).toEqual(100);

      object.onSomeEvent().emitInterval(null);
      expect(object.onSomeEvent()._emitInterval).toBeUndefined();
    });
  });

  describe('unbind()', function () {
    it('should not call the removed handler', function () {

      object.listener = function () {}

      spyOn(object, 'listener');

      object.onSomeEvent(object.listener);
      object.onSomeEvent().unbind(object.listener);
      object.onSomeEvent().emit();

      expect(object.listener).not.toHaveBeenCalled();
    });

    it("should return the source", function() {
      expect(object.onSomeEvent().unbind(function () {})).toBe(object);
    });
  });

  describe('unbindAll()', function () {
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

  describe("listeners()", function() {
    it("should return an array of the event listeners", function() {

      var listener = function () {};
      object.onSomeEvent(listener);

      expect(object.onSomeEvent().listeners()).toEqual([listener]);
    });
  });

  describe("once(listener)", function() {
    it("should only call the listener once", function() {
      var obj = {};
      eventSource(obj).define('onEvent');

      var count = 0;

      obj.onEvent().once(function () {
        count++;
      });

      obj.onEvent().emit();
      obj.onEvent().emit();

      expect(count).toEqual(1);
    });

    it("should return an event subscription", function () {
      expect(object.onSomeEvent().once(function () {})).toBeInstanceOf(eventSource.EventSubscription);
    });
  });

  describe("oneTimeEvent()", function() {

    beforeEach(function () {
      object.onSomeEvent().oneTimeEvent();
    })

    it("should return object", function() {
      expect(object.onSomeEvent().oneTimeEvent()).toBe(object);
    });

    it("should call event handlers in the normal way the first time the event is emitted", function() {
      var called = false;

      object.onSomeEvent(function () { called = true});

      expect(called).toEqual(false);

      object.onSomeEvent().emit();

      expect(called).toEqual(true);
    });

    it("should call back on next tick if the one time event has passed", function() {
      
      var called = false;
      var args;
      
      runs(function () {

        object.onSomeEvent().emit(1,2,3);

        object.onSomeEvent(function () { args = arguments; called = true });

        
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

        object.onSomeEvent(function () {
          calls++;
        });

        object.onSomeEvent().emit();
        object.onSomeEvent().emit();

        expect(calls).toBe(1);
      });
    });
  });
});