describe("eventify.Subscriptions", function() {

  var obj, subscriberCount;

  beforeEach(function () {
    
    obj             = {};
    subscriberCount = 0;
    
    eventify(obj).define('onSomeEvent');

    while (subscriberCount++ < 3) {
      obj.onSomeEvent(function () {});
    }
  });

  describe("each()", function() {
    
    it("provides iteration of the Subscriptions", function() {
      
      // precondition
      expect(obj.onSomeEvent.subscriptions().count() > 0).toBe(true);
      
      // action
      obj.onSomeEvent.subscriptions().each(function (s) {
        expect(s).toBeInstanceOf(eventify.Subscription);
      });
    });
  });

  describe("toArray()", function() {
    
    it("returns an array containing each subscription", function() {
      var subscriptions = obj.onSomeEvent.subscriptions();
      expect(subscriptions.toArray().length).toBe(3);
    });
  });

  describe("count()", function() {
    
    it("returns the number of subscriptions", function() {

      expect(obj.onSomeEvent.subscriptions().count()).toBe(3);

      obj.onSomeEvent(function () {});
      obj.onSomeEvent(function () {});
      obj.onSomeEvent(function () {});

      expect(obj.onSomeEvent.subscriptions().count()).toBe(6);
    });
  });

  describe("cancelAll()", function() {
    
    it("causes all subscriptions to become inactive", function() {
      
      var subs = obj.onSomeEvent(function(){});
      
      obj.onSomeEvent.subscriptions().cancelAll();
      
      expect(subs.isActive()).toBe(false);
    });

    it('causes listeners to no longer be called', function () {

      obj.listener1 = function () {};
      obj.listener2 = function () {};
      obj.listener3 = function () {};

      spyOn(obj, 'listener1');
      spyOn(obj, 'listener2');
      spyOn(obj, 'listener3');

      obj.onSomeEvent(obj.listener1);
      obj.onSomeEvent(obj.listener2);
      obj.onSomeEvent(obj.listener3);
      obj.onSomeEvent.subscriptions().cancelAll();
      obj.onSomeEvent.emit();

      expect(obj.listener1).not.toHaveBeenCalled();
      expect(obj.listener2).not.toHaveBeenCalled();
      expect(obj.listener3).not.toHaveBeenCalled();
    });
  });

});