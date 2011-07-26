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
*/

function Events(source) {
   
   // register a new event for the source
   function installEvent (obj, event_name) {
      var listeners = [];
      // assign the event listener registration function to the specified name
      obj[event_name] = function(listener) {
        var self = this;
        if (typeof listener === 'function') {
          listeners.push(listener);
        } 
        
        return {
          unbind: function (listener_to_remove) {
            listeners = listeners.filter(function(registered_listener){
              return registered_listener != listener_to_remove;
            });
            return self;
          },
          emit: function () {
            var time_now = (new Date).getTime();
            var last_emit_time = parseInt(self[event_name].last_emit_time) || 0;
            var minimum_emit_interval = parseInt(self[event_name].minimum_emit_interval) || 0;
            var event_arguments = arguments;
            
            var runListeners = function () {
              clearTimeout(self[event_name].interval_timeout_id);
              self[event_name].interval_timeout_id = null;
              self[event_name].last_emit_time = time_now;
              listeners.forEach(function(listener){
                  listener.apply(self, event_arguments);
              });
            };
            
            if (last_emit_time < (time_now - minimum_emit_interval)) {
               runListeners();            
            } else {
              if (typeof self[event_name].interval_timeout_id === 'number') {
                clearTimeout(self[event_name].interval_timeout_id);
                self[event_name].interval_timeout_id = null;
              }
              self[event_name].interval_timeout_id = setTimeout(function () {
                runListeners();
              }, minimum_emit_interval);
            }

            return self;
          },
          throttle: function (minimum_interval) {
            minimum_interval = (typeof minimum_interval === 'number') ? minimum_interval : 1;
            minimum_interval = Math.max(minimum_interval, 1);
            self[event_name].minimum_emit_interval = minimum_interval;
            return self;
          }
        }        
      };
   } 
   
   return {
     define: function () {
       toArray(arguments).forEach(function (event_name) {
         installEvent(source, event_name);
       });
     }
   };
}

