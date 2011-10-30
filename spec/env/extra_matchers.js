/*

These jasmine matchers are included by default when a project is created with cup.

*/
beforeEach(function() {
  this.addMatchers({
    toBeAFunction: function() {
      return typeof this.actual === 'function';
    },
    toBeInstanceOf: function (ctor) {
      return this.actual instanceof ctor;
    },
    toContain: function (a) {
      return !!~this.actual.indexOf(a);
    },
    toBeEmpty: function () {
      return this.actual.isEmpty();
    }
  });
});