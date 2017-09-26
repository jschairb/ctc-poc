// Execute JavaScript on page load
$(function() {
    // Initialize phone number text input plugin,
    // add more fields with a comma separated list.
    $('#phoneNumber').intlTelInput({
        responsiveDropdown: true,
        autoFormat: true,
        utilsScript: '/vendor/intl-phone/libphonenumber/build/utils.js'
    });

    $.notify.defaults({
        arrowShow: false,
        position: 'right',
        style: 'ctc'
    });


    $.notify.addStyle("ctc", {
        html: "<div>\n<span data-notify-text></span>\n</div>",
        classes: {
            base: {
                "font-weight": "bold",
                "padding": "8px 15px 8px 14px",
                "text-shadow": "0 1px 0 rgba(255, 255, 255, 0.5)",
                "background-color": "#fcf8e3",
                "border": "1px solid #fbeed5",
                "border-radius": "4px",
                "white-space": "nowrap",
                "background-repeat": "no-repeat",
                "background-position": "3px 7px"
            },
            error: {
                "color": "#B94A48",
                "background-color": "#F2DEDE",
                "border-color": "#EED3D7"
            },
            success: {
                "color": "#468847",
                "background-color": "#DFF0D8",
                "border-color": "#D6E9C6"
            },
            info: {
                "color": "#3A87AD",
                "background-color": "#D9EDF7",
                "border-color": "#BCE8F1"
            },
            warn: {
                "color": "#C09853",
                "background-color": "#FCF8E3",
                "border-color": "#FBEED5"
            }
        }
    });

    // Intercept form submission and submit the form with ajax
    $('#contactForm').on('submit', function(e) {
        // Prevent submit event from bubbling and automatically submitting the
        // form
        e.preventDefault();

        // Call our ajax endpoint on the server to initialize the phone call
        // I'm removing all whitespace and stripping the dashes out to match
        // how I handle other numbers in the system. I couldn't find this as
        // an option of the jquery plugin. At the very least, this should be
        // it's own formatting function.
        $.ajax({
            url: '/call',
            method: 'POST',
            dataType: 'json',
            data: {
                phoneNumber: $('#phoneNumber').val().replace(/\s/g,'').replace(/-/g,''),
                ticketNumber: $('#ticketNumber').val()
            }
        }).done(function(data) {
            // The JSON sent back from the server will contain a success message
            $('#request-call-btn').notify(data.message,
                                          {
                                              className: 'info'
                                          });

        }).fail(function(error) {
            alert(JSON.stringify(error));
        });
    });
});
