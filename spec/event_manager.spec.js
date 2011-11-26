describe("event manager", function() {

  var object;

  beforeEach(function () {
    object = {};
    eventify(object).define('onSomeEvent');
  });

  describe("bind()", function() {

    it("should return object", function() {
      expect(object.onSomeEvent().bind(function(){})).toBe(object);
    });
  });

  describe('emit()', function () {

    it('calls the listeners', function () {

      var f1Called = false
        , f1       = function () { f1Called = true }
        , f2Called = false
        , f2       = function () { f2Called = true };

      object.onSomeEvent(f1).onSomeEvent(f2);
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

    it("should return object", function() {
      expect(object.onSomeEvent().emit()).toBe(object);
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

  describe('throttle()', function () {

    it('calls the listeners the first time and then not again until the throttle interval at which time the most recently emitted arguments are passed', function () {
      var callParams = [];

      runs(function() {

        var listener = function (value) {
          callParams.push(value);
        };

        object.onSomeEvent(listener);
        object.onSomeEvent().throttle(200);

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

    it("returns object", function() {
      expect(object.onSomeEvent().throttle(123)).toBe(object);
    });

    it("defaults to 10ms", function() {
      object.onSomeEvent().throttle();
      expect(object.onSomeEvent()._minimumEmitInterval).toBe(10);
    });

    it("should return object when event emission is throttled", function() {
      object.onSomeEvent().throttle(100);
      object.onSomeEvent(function () {});

      object.onSomeEvent().emit();
      var rtn = object.onSomeEvent().emit();

      expect(rtn).toBe(object);
    });

    it("should remove the throttle when called with null", function() {

      object.onSomeEvent().throttle(100);
      expect(object.onSomeEvent()._minimumEmitInterval).toEqual(100);

      object.onSomeEvent().throttle(null);
      expect(object.onSomeEvent()._minimumEmitInterval).toBeUndefined();
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
    it("the listener should only be called once", function() {
      var obj = {};
      eventify(obj).define('onEvent');

      var count = 0;

      obj.onEvent().once(function () {
        count++;
      });

      obj.onEvent().emit();
      obj.onEvent().emit();

      expect(count).toEqual(1);
    });
  });

  describe("queue()", function() {

    beforeEach(function () {
      object.onSomeEvent().queue();
    })

    it("should return object", function() {
      expect(object.onSomeEvent().queue()).toBe(object);
    });

    it("should call event handlers in the normal way the first time the event is emitted", function() {
      var called = false;

      object.onSomeEvent(function () { called = true});

      expect(called).toEqual(false);

      object.onSomeEvent().emit();

      expect(called).toEqual(true);
    });

    it("should call back immediately after the event has been emitted", function() {
      var called = false;
      var args;

      object.onSomeEvent().emit(1,2,3);

      object.onSomeEvent(function () { args = arguments; called = true });

      expect(called).toEqual(true);
      expect(args).toEqual([1,2,3]);
    });

    describe("when the event is emitted more than once", function() {

      it("should return object", function() {
        object.onSomeEvent().emit()
        // call emit again, it should return object if the event has occured
        expect(object.onSomeEvent().emit()).toBe(object);
      });

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