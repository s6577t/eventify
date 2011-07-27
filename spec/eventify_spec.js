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