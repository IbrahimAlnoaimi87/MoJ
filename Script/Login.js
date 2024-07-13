/// <reference path="~/Script/jquery.intellisense.js"/>

jQuery(document).ready(function()
{
    
    if(jQuery("#UseDefaultSecurityLabelRadio").is(":checked"))
	{
        jQuery("#SpecifyLabelField").hide();
	}
	else
	{
        jQuery("#SpecifyLabelField").show();
	}

    jQuery("#UseDefaultSecurityLabelRadio").bind("change", function() {
        if (jQuery(this).is(":checked")) jQuery("#SpecifyLabelField").hide();
    });

    jQuery("#SpecifyLabelRadio").bind("change", function()
    {
        if (jQuery(this).is(":checked")) jQuery("#SpecifyLabelField").show();
        jQuery("#SecurityLabel")[0].focus();
    });
    
    jQuery("#UseIntegrated").bind("change", function()
    {
        if (jQuery(this).is(":checked")) {
			jQuery("#DomainField").addClass("required");
			jQuery("#Domain").addClass("required");
			jQuery("#Domain")[0].focus();
        }
        else {
			jQuery("#DomainField").removeClass("required");
			jQuery("#Domain").removeClass("required");
        }
    });

    jQuery("#SignInButton").click(function()
    {
        if (validateLoginForm()) jQuery("form")[0].submit();
    });
    jQuery("#ResetFormButton").click(function()
    {
        jQuery("form")[0].reset();
        jQuery("#UseDefaultSecurityLabelRadio").trigger("change");
    });
});

function validateLoginForm()
{
    if (jQuery("#UserName").val() == "")
    {
        popupManager.showWarning({
			message: CommonPhrases_MissingUsernameText,
			onClose: function() { jQuery("#UserName")[0].focus(); }
		});
        return false;
    } else if (jQuery("#Password").val() == "")
    {
        popupManager.showWarning({
			message: CommonPhrases_MissingPasswordText,
			onClose: function() { jQuery("#Password")[0].focus(); }
		});
        return false;
    } else if (jQuery("#UseIntegrated").is(":checked") && jQuery("#Domain").val() == "")
    {
        popupManager.showWarning({
			message: CommonPhrases_MissingDomainText,
			onClose: function() { jQuery("#Domain")[0].focus(); }
		});
        return false;
    } else if (jQuery("#SpecifyLabelRadio").is(":checked") && jQuery("#SecurityLabel").val() == "")
    {
        popupManager.showWarning({
			message: CommonPhrases_MissingSecurityLabelText,
			onClose: function() { jQuery("#SecurityLabel")[0].focus(); }
		});
        return false;
    }
    return true;
}