
if (!SourceCode) SourceCode = {};
if (!SourceCode.Forms) SourceCode.Forms = {};
if (!SourceCode.Forms.Designer) SourceCode.Forms.Designer = {};

var StyleProfileVariableCollection = SourceCode.Forms.Designer.StyleProfileVariableCollection = class extends SourceCode.Forms.Designer.ObservableCollection
{
    //#region Properties

    //required override by ObservableCollection super class.
    get HashKey()
    {
        return "Name";
    }

    //#endregion Properties

    //#region Constructor

    constructor()
    {
        super();

        this.attachEventListener("CollectionChanged", this._collectionChanged.bind(this));
    }

    //#endregion Constructor

    //#region Methods

    SetVariable(name, value, source)
    {
        if (!!name)
        {
            var variable = this.Item(name);
            if (checkExistsNotEmpty(value))
            {
                if (!variable)
                {
                    variable = new SourceCode.Forms.Designer.StyleProfileVariable(name, value)
                    this.Add(variable);
                }
                variable.Value = value;
            }
            else
            {
                if (!!variable)
                {
                    this.Remove(variable);
                }
            }

            return variable;
        }
    }

    //#endregion Methods

    //#region Private methods

    _collectionChanged(ev)
    {
        ev.NewItems.forEach(function (variable)
        {
            //Subscribe to future changes
            variable.attachEventListener("PropertyChanged", this._variablePropertyChanged.bind(this));

            //fire event for listeners of Variable Changed
            var event = new Event("VariableChanged");
            event.VariableName = variable.Name;
            this.dispatchEvent(event);   
        }.bind(this));

        ev.OldItems.forEach(function (variable)
        {
            //fire event for listeners of Variable Changed
            var event = new Event("VariableChanged");
            event.VariableName = variable.Name;
            this.dispatchEvent(event);   
        }.bind(this));

    }

    _variablePropertyChanged(ev)
    {
        if (ev.PropertyName == "Value")
        {
            var event = new Event("VariableChanged");
            event.VariableName = ev.Source.Name; //ev.Source is a StyleProfileVariable
            this.dispatchEvent(event);
        }
    }
    //#endregion Private Methods

    //#region Xml methods

    //override the base ObservableCollection method
    xmlRootElementName()
    {
        return "Variables";
    }

    //override the base ObservableCollection method
    fromXmlItem(itemNode)
    {
        return SourceCode.Forms.Designer.StyleProfileVariable.createFromXml(itemNode);
    }

    //#endregion
}
