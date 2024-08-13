

NamespaceUtility.RegisterNamespace("SourceCode.Forms.Designer");

//Simple base class for ObjectModels that need to raiseevents so that UI can be loosely coupled.
//Called "EventTarget" as this emulates the naming of the W3C standard base class for DOM elements that raise events.
var EventTarget = SourceCode.Forms.Designer.EventTarget = class
{
    //#region Fields

    #eventListeners = {};

    //#endregion Fields

    //#region Methods

    //Mimics the interface for the W3C version of attachEventListener for DOM elements.
    //eventName: String
    //eventListener: function
    attachEventListener(eventName, eventListener)
    {
        if (!eventListener)
        {
            console.log("Error: Listener is not a function");
        }
        if (!this.#eventListeners[eventName])
        {
            this.#eventListeners[eventName] = {
                listeners: []
            }
        }
        this.#eventListeners[eventName].listeners.push(eventListener);
    }

    //Mimics the interface for the W3C version of removeEventListener for DOM elements.
    //eventName: String
    //eventListener: function
    removeEventListener(eventName, eventListener)
    {
        if (!!this.#eventListeners[eventName])
        {
            var listeners = this.#eventListeners[eventName].listeners;
            for (var i = 0; i < listeners.length; i++)
            {
                var listener = listeners[i];
                if (listener === eventListener)
                {
                    listeners.splice(i, 1);
                }
            }
        }
    }

    //Mimics the interface for the W3C version of dispatchEvent  for DOM elements.
    //event: Event (w3c class) - see https://www.w3schools.com/jsref/obj_event.asp
    dispatchEvent(event)
    {
        var eventName = event.type;
        if (!!this.#eventListeners[eventName])
        {
            for (var i = 0; i < this.#eventListeners[eventName].listeners.length; i++)
            {
                var listener = this.#eventListeners[eventName].listeners[i];
                listener(event);
            }
        }
    }

    //INotifyPropertyChanged member (mimic)
    raisePropertyChanged(propertyName)
    {
        //Similar to PropertyChangedEventArgs
        var event = new Event("PropertyChanged");
        event.PropertyName = propertyName;
        event.Source = this;

        this.dispatchEvent(event);
    }

    //#endregion Instance and Static Implementation
}
