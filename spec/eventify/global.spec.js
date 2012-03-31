describe('eventify.listen()', function () {
  
  var obj, otherObj;

  beforeEach(function () {
    
    obj = {};
    otherObj = {};

    eventify(obj, 'namespace').define('onSomeEvent');
    eventify(otherObj).define('afterRamadan');
  });

  [true, false, 1.323, 100, 'hello'].forEach(function (v) {
    it('throws an exception is passed a ' + (typeof v) + ' value: ' + v, function () {
      expect(function () {
        eventify.listen(v);
      }).toThrow(v + ' (' + (typeof v) + ') is not a valid listener');
    });
  });

  describe('listening with a catchall function', function () {
    
    it('returns undefined', function () {
      
      expect(eventify.listen(function(){})).toBeUndefined();
    });

    it('passes an event object container the source, arguments, event name and namespace', function () {
      
      var listener = jasmine.createSpy('listener');

      eventify.listen(listener);

      obj.onSomeEvent.emit(1,2,3,4);

      expect(listener).toHaveBeenCalledWith({
        args: [1,2,3,4],
        source: obj,
        eventName: 'namespace/onSomeEvent'
      });
    });

    it('does not hear unnamespaced events', function () {
      
      var listener = jasmine.createSpy('listener');

      eventify.listen(listener);

      otherObj.afterRamadan.emit();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('listening with a listener object', function () {
    
    var listener;

    beforeEach(function () {
      listener = {
        'namespace/onSomeEvent': jasmine.createSpy('listener')
      , 'undefined/afterRamadan': jasmine.createSpy()
      , '/afterRamadan': jasmine.createSpy()
      , 'afterRamadan': jasmine.createSpy()
      };
    });

    it('returns a undefined', function () {
      expect(eventify.listen({})).toBeUndefined();
    });

    it('calls the object member with a name corresponding to the event with event arguments', function () {
      
      eventify.listen(listener);

      obj.onSomeEvent.emit(1,2,3,4,5);

      expect(listener['namespace/onSomeEvent']).toHaveBeenCalledWith(1,2,3,4,5);
    });

    it('calls the event handler with the source as context', function () {
      
      var context;

      listener['namespace/onSomeEvent'] = jasmine.createSpy().andCallFake(function () {
        context = this;
      });

      eventify.listen(listener);

      obj.onSomeEvent.emit();

      expect(context).toBe(obj);
    });

    it('does not hear unnamespaced events', function () {
      
      eventify.listen(listener);
      otherObj.afterRamadan.emit();

      expect(listener['undefined/afterRamadan']).not.toHaveBeenCalled();
      expect(listener['/afterRamadan']).not.toHaveBeenCalled();
      expect(listener['afterRamadan']).not.toHaveBeenCalled();
    });
  });
});
