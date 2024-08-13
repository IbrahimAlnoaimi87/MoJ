
//***********************************************
//********* Add/Remove Class Transition *********
//***********************************************
(function ($)
{
    // Store a reference to the original remove method.
    var originalMethod = jQuery.fn.addClass;
    // Define overriding method.

    $.fn.addClassTransition = function ()
    {
        var transitionOptions = {
            parentToHandleOn: this,
            addClassToStart: arguments[0],
            onEndCallback: arguments[1],
            selectorToWaitFor: arguments[2]
        }

        var transitionHelper = new SourceCode.Forms.TransitionHelper(transitionOptions);

        transitionHelper.handleTransition();

        return this;
    }
})(jQuery);

//*****************************************
//********* Remove Class Override *********
//*****************************************

(function ($)
{
    // Store a reference to the original remove method.
    var originalMethod = jQuery.fn.removeClass;
    // Define overriding method.
    $.fn.removeClassTransition = function ()
    {
        var transitionOptions = {
            parentToHandleOn: this,
            removeClassToStart: arguments[0],
            onEndCallback: arguments[1],
            selectorToWaitFor: arguments[2]
        }

        var transitionHelper = new SourceCode.Forms.TransitionHelper(transitionOptions);

        transitionHelper.handleTransition();

        return this;
    }
})(jQuery);