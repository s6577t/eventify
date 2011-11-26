describe("event manager", function() {

  var object;

  beforeEach(function () {
    object = {};
    eventify(object).define('onSomeEvent');
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

    it("should return the object which emitted the event", function() {
      expect(object.onSomeEvent().emit()).toBe(object);
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
      expect(object.onSomeEvent().minimumEmitInterval).toBe(10);
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

  xdescribe("once() events", function() {
    it("should only fire once events... once!", function() {
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
});