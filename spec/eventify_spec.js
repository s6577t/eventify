describe("defining an event", function() {
  
  beforeEach(function() {
    this.addMatchers({
      toBeAFunction: function() { return (typeof this.actual === 'function'); }
    });
  });
  
  it("causes the target to have members of corresponding name", function() {
    var target = {};
    Events(target).define('onSomeEvent');
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
    Events(obj).define('onSomeEvent');
    
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
    
    Events(obj).define('onHelloWorld');
    
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
    
    Events(obj).define('onSomeEvent');
    
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
      Events(obj).define('onSomeEvent');
      
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
    Events(obj).define('onDo');

    obj.handler = function () {};

    spyOn(obj, 'handler');

    obj.onDo(obj.handler);

    obj.onDo().unbind(obj.handler);

    obj.onDo().emit();

    expect(obj.handler).not.toHaveBeenCalled();
  })
});