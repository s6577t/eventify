;
/*

parameters: an arbitrary number of arguments, each of which is a valid function name.

an object with the listen events install is returned.

Example:

var obj = new Object();

// install three events emitters on object
Events(obj).define('onClick', 'onUpdate', 'onHide');

// register some listeners..
obj.onClick(event_handler_function);
obj.onUpdate(event_handler_function);
obj.onHide(event_handler_function);

// emit the events..
obj.onClick.emit();
obj.onHide.emit();

obj.onUpdate().emit(new_value_arg); 
// n.b.: new_value_arg MUST NOT be a function otherwise it will be treated as an event handler

// unbind the events...
obj.onClick().unbind(event_handler_function)
obj.onUpdate().unbind(event_handler_function)
obj.onHide().unbind(event_handler_function)
(obj.<eventName>().unbind(<handler>))

can also register a delegate:

var delegate = {
  onSomeEvent: function (arg0) {
    console.info(arg0)
  }
}

obj.onSomeEvent(delegate);

obj.onSomeEvent().emit("MEOW");
=> "MEOW"

*/
function Events(a){function b(a,b){var c=[],d=null,e={unbind:function(a){c=c.filter(function(b){return b!=a});return d},emit:function(){var a=(new Date).getTime(),f=parseInt(e.lastEmitTime)||0,g=parseInt(e.minimumEmitInterval)||0;e.eventArguments=arguments;var h=function(){e.lastEmitTime=a,c.forEach(function(a){typeof a=="function"?a.apply(d,e.eventArguments):typeof a=="object"&&typeof a[b]=="function"&&a[b].apply(d,e.eventArguments)})},i=function(){clearTimeout(e.intervalTimeoutId),e.intervalTimeoutId=null},j=function(){e.intervalTimeoutId||(e.intervalTimeoutId=setTimeout(function(){i(),h()},g))};f<a-g?(i(),h()):j();return d},throttle:function(a){a=typeof a=="number"?a:1,a=Math.max(a,1),e.minimumEmitInterval=a;return d},listeners:function(){return c}};a[b]=function(a){d=this;if(typeof a=="function"){c.push(a);return this}return e}}return{define:function(){Array.toArray(arguments).forEach(function(c){b(a,c)});return a}}}
;
