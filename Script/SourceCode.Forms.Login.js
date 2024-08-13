$(document).ready(function ()
{
    var signInButton = $("#SignInButton");
    // Check if we are of the Login screen
    if (signInButton.length > 0)
    {
        // Use the HTML5 placeholder for all other Browser except IE 9.
        if (navigator.userAgent.toLowerCase().indexOf("msie 9") === -1)
        {
            $(".input-control.text-input .input-control-watermark").remove();

            var userNameTxtBox = $("#UserName");
            var passwordTxtBox = $("#Password");

            userNameTxtBox.attr("placeholder", Resources.CommonLabels.UserNameWatermark);
            passwordTxtBox.attr("placeholder", Resources.CommonLabels.PasswordWatermark);
        }

        $(".username-input").trigger("focus").trigger("select");

        var form = $("form");

        signInButton.on("click", function ()
        {
            if (signInButton.hasClass("disabled"))
            {
                return;
            }

            if (validateLoginForm())
            {
                var form = $("form");

                signInButton.addClass("loading");
                form[0].submit();
            }
        });

        $("#UserName, #Password").on("keypress keyup keydown", function (e)
        {
            switch (e.keyCode)
            {
                case 13:
                    {
                        if (validateLoginForm())
                        {
                            signInButton.addClass("loading");
                            form[0].submit();
                        }
                        break;
                    }
            }
        });
    }
});

function validateLoginForm()
{
    var userName = $("#UserName");
    var password = $("#Password");

    if (userName.val() !== "" && password.val() !== "")
    {
        return true;
    }
    else
    {
        $(".stsPasswordPlaceHolder").text(Resources.CommonPhrases.MissingUsernameAndPassword);

        userName.toggleClass("invalid", (userName.val() === ""));

        password.toggleClass("invalid", (password.val() === ""));
    }

    return false;
}

function enableDisabledLoginButton()
{
    var signInButton = $("#SignInButton");

    if ($("#UserName").val() !== "" && $("#Password").val() !== "")
    {
        signInButton.removeClass("disabled");

        signInButton.removeAttr("tabindex");
    }
    else
    {
        signInButton.addClass("disabled");

        //Prevent tab into a disabled button
        signInButton.attr("tabindex", "-1");
    }
}

function showServerSideValidationMessage(errorMessage)
{
    $(".stsPasswordPlaceHolder").html(errorMessage);
}

