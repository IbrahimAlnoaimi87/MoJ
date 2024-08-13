//Purpose: An objectmodel base class for lists of things, that can be bound into from UI.
//         has no knowledge of the UI built on top of it.
//         Based on System.Collections.Objectmodel.Collection and System.Collections.Objectmodel.ObservableCollection

if (!SourceCode) SourceCode = {};
if (!SourceCode.Forms) SourceCode.Forms = {};
if (!SourceCode.Forms.Designer) SourceCode.Forms.Designer = {};

var ObservableCollection = SourceCode.Forms.Designer.ObservableCollection = class extends SourceCode.Forms.Designer.EventTarget
{

    //#region Properties

    //ICollection Member
    get Count()
    {
        return this.#items.length;
    }

    //Should return a string which is the property of an Item that can be used as the unique key for the hash 
    get HashKey()
    {
        throw "HashKey Not Implemented by subclass of ObservableCollection";
    }

    //#endregion Properties

    //#region Fields

    #items;
    #hash = {};

    //#endregion Fields

    //#region Methods

    //IList Member
    Item(numberOrName)
    {
        var argType = typeof (numberOrName);
        switch (argType)
        {
            case 'string': return this.#hash[numberOrName]; break;
            case 'number': return this.#items[numberOrName]; break;
        }
    }

    //IList Member
    Add(item)
    {
        var index = this.#items.length;
        this.#items.push(item);
        var uniqueIdentifier = item[this.HashKey];
        if (!!uniqueIdentifier)
        {
            this.#hash[uniqueIdentifier] = item;
        }
        else
        {
            console.log("WARNING: ObservableCollection could not add Item to Hash as hashkey for new item returned null - " + this.HashKey);
        }

        //Raise Event - notifycollectionchangedeventargs 
        var event = new Event("CollectionChanged");
        event.Action = "ItemAdded";
        event.NewItems = [item];
        event.NewItemStartingIndex = index;
        event.OldItems = []; //always give an array, so subscribers don't have to check for null.
        event.OldItemsStartingIndex = -1;
        this.dispatchEvent(event);
    }

    //IList Member
    AddRange(itemArray)
    {
        var index = this.#items.length;

        for (var i = 0; i < itemArray.length; i++)
        {
            var item = itemArray[i];
            this.#items.push(item);
            this.#hash[item[this.HashKey]] = item;
        }
        
        //Raise Event - notifycollectionchangedeventargs 
        var event = new Event("CollectionChanged");
        event.Action = "ItemsAdded";
        event.NewItems = itemArray;
        event.NewItemStartingIndex = index;
        event.OldItems = []; //always give an array, so subscribers don't have to check for null.
        event.OldItemsStartingIndex = -1;
        this.dispatchEvent(event);
    }

    //IList Member
    Remove(item)
    {
        var index = this._getItemIndex(item);
        this.#items.splice(index, 1);
        delete this.#hash[item[this.HashKey]];

        //Raise Event - notifycollectionchangedeventargs 
        var event = new Event("CollectionChanged");
        event.Action = "ItemRemoved";
        event.NewItems = []; //always give an array, so subscribers don't have to check for null.
        event.NewItemStartingIndex = -1;
        event.OldItems = [item];
        event.OldItemsStartingIndex = index;
        this.dispatchEvent(event);
    }

    //IList Member
    Clear()
    {
        if (this.#items.length > 0)
        {
            var index = 0;
            var removedItems = this.#items.splice(index, this.#items.length);

            for (var i = 0; i < removedItems.length; i++)
            {
                var item = removedItems[i];
                delete this.#hash[item[this.HashKey]];
            }

            //Raise Event - notifycollectionchangedeventargs 
            var event = new Event("CollectionChanged");
            event.Action = "ItemsRemoved";
            event.NewItems = []; //always give an array, so subscribers don't have to check for null.
            event.NewItemStartingIndex = -1;
            event.OldItems = removedItems;
            event.OldItemsStartingIndex = index;
            this.dispatchEvent(event);
        }
    }

    //Param: collection - an ObservableCollection of the same type.
    CopyTo(collection)
    {
        var itemsToAdd = [];

        this.#items.forEach(function (item)
        {
            if (typeof item.Clone === "function")
            {
                itemsToAdd.push(item.Clone());
            }
        });

        collection.AddRange(itemsToAdd);
    }

    //#endregion

    //#region Constructor

    constructor()
    {
        super();

        this.#items = [];
    }

    //#endregion Constructor

    //#region Private Methods

    _getItemIndex(item)
    {
        var result = -1;
        for (var i = 0; i < this.#items.length; i++)
        {
            if (item === this.#items[i])
            {
                result = i;
                break;
            }
        }

        return result;
    }

    //#endregion Private Methods

    //#region JSON

    toJson()
    {
        var json = "";

        json += "[";
        for (var i = 0; i < this.#items.length; i++)
        {
            var item = this.#items[i];
            json += item.toJson();
            if (i < this.#items.length - 1) json+= ",";
        }
        json += "]";

        return json;
    }

    //#endregion JSON

    //#region Xml Methods

    //typically this will be overridden by a subclass
    xmlRootElementName()
    {
        return "Items";
    }

    fromXml(parentNode)
    {
        var collectionRootElementName = this.xmlRootElementName();
        var collectionNode = $sn(parentNode, collectionRootElementName);
        if (!!collectionNode)
        {
            //get the variables values
            var itemNodes = collectionNode.selectNodes("*");
            if (!!itemNodes && itemNodes.length > 0)
            {
                var itemsToAdd = [];
                for (var i = 0; i < itemNodes.length; i++)
                {
                    var itemNode = itemNodes[i];
                    var item = this.fromXmlItem(itemNode);
                    if (!!item)
                    {
                        //needs to use the public method so that subclasses add methods get called too.
                        itemsToAdd.push(item);
                    }
                }
                this.AddRange(itemsToAdd);
            }
        }
    }

    fromXmlItem(itemNode)
    {
        throw "fromXmlItem not implemented by inheriting class - " + this.constructor.name;
    }

    toXml()
    {
        var xml = "";

        var collectionRootElementName = this.xmlRootElementName();
        xml += "<" + collectionRootElementName + ">";
        for (var i = 0; i < this.#items.length; i++)
        {
            var item = this.#items[i];
            xml += item.toXml();
        }
        xml += "</" + collectionRootElementName + ">";

        return xml;
    }

    //#endregion Xml methods
}
