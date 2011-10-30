describe("defining an event", function() {

  beforeEach(function() {
    this.addMatchers({
      toBeAFunction: function() { return (typeof this.actual === 'function'); }
    });
  });

  it("causes the target to have members of corresponding name", function() {
    var target = {};
    eventify(target).define('onSomeEvent');
    expect(target.onSomeEvent).toBeAFunction();
  });

});

describe('when an event is emitted', function () {
  it('calls the listeners', function () {
    var f1Called = false,
    f1 = function () { f1Called = true },
    f2Called = false,
    f2 = function () { f2Called = true };

    var obj = {};
    eventify(obj).define('onSomeEvent');

    obj.onSomeEvent(f1).onSomeEvent(f2);
    obj.onSomeEvent().emit();

    expect(f2Called).toBeTruthy();
    expect(f1Called).toBeTruthy();
  });
});

describe('when an object emits an event', function () {
  it('passes arguments to listeners', function () {
    var arg = 'hello world';
    var obj = {}
    var passedArg = null;

    eventify(obj).define('onHelloWorld');

    obj.onHelloWorld(function(a){
      passedArg = a;
    });

    obj.onHelloWorld().emit(arg);

    expect(passedArg).toEqual(arg);
  });

  it('does not fire unbound listeners', function () {
    var called = false, listener = function () {
      called = true;
    }

    var obj = {};

    eventify(obj).define('onSomeEvent');

    obj.onSomeEvent(listener);
    obj.onSomeEvent().unbind(listener);
    obj.onSomeEvent().emit();

    expect(called).toBeFalsy();
  });
});

describe('when and event is throttled', function () {
  it('fires the listeners with the last parameter set', function () {
    var callParams = [];

    runs(function() {
      var obj = {}
      eventify(obj).define('onSomeEvent');

      var listener = function (value) {
        callParams.push(value);
      };
      obj.onSomeEvent(listener);
      obj.onSomeEvent().throttle(200);

      for (var i = 0; i <= 100; i++) {
        obj.onSomeEvent().emit(i);
      }
    });


    waits(200);

    runs(function(){
      expect(callParams[callParams.length-1]).toEqual(100);
    });
  });
});

describe('when a handler is unbound', function () {
  it('is not fired', function () {
    var obj = {};
    eventify(obj).define('onDo');

    obj.handler = function () {};

    spyOn(obj, 'handler');

    obj.onDo(obj.handler);

    obj.onDo().unbind(obj.handler);

    obj.onDo().emit();

    expect(obj.handler).not.toHaveBeenCalled();
  })
});

describe('unbinding all listeners', function () {
  it('should prevent listeners from being called when events are fired', function () {
    var obj = {}
    eventify(obj).define('onMeow');
    obj.l = function () {};
    spyOn(obj, 'l');
    obj.onMeow(obj.l);
    obj.onMeow().unbindAll();
    obj.onMeow().emit();
    expect(obj.l).not.toHaveBeenCalled();
  })
});

describe('deventify', function () {
  it ('should not get a type error for null members', function () {
    var obj = {
      nulL: null
    };
    expect(function () {
      deventify(obj);
    }).not.toThrow();
  })
  it('should remove all listeners for events installed by eventify', function () {
    var obj = {};
    eventify(obj).define('onDo', 'onDont');
    deventify(obj);
    expect(obj.onDo().listeners().length).toEqual(0);
    expect(obj.onDont().listeners().length).toEqual(0);
  });
  it('should return the deventified object', function () {
    var obj = {};
    var rtn = deventify(obj);
    expect(rtn).toBe(obj);
  })
});