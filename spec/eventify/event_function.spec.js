describe("eventify event (function)", function() {

  var obj;

  beforeEach(function () {
    obj = {};
    eventify(obj, 'namespace').define('onSomeEvent');
  });

  it('is a proxy for eventify.EventMixin.__listen__()', function () {
    
    var __listen__ = spyOn(obj.onSomeEvent, '__listen__').andReturn('return value');

    var listener = function () {};
    
    var rtn = obj.onSomeEvent(listener);

    expect(__listen__).toHaveBeenCalledWith(listener);
    expect(rtn).toBe('return value');
  });
});