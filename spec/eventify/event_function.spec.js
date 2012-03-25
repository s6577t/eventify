describe("eventify event (function)", function() {

  var obj;

  beforeEach(function () {
    obj = {};
    eventify(obj, 'namespace').define('onSomeEvent');
  });

  it('is a proxy for eventify.EventMixin.__listen__()', function () {
    
    var __listen__ = spyOn(obj.onSomeEvent, '__listen__').andReturn('return value');

    var rtn = obj.onSomeEvent(1, 2, 3, 4, 5, 6);

    expect(__listen__).toHaveBeenCalledWith(1, 2, 3, 4, 5, 6);
    expect(rtn).toBe('return value');
  });
});