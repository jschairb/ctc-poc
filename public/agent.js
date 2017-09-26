// load the soft phone
let token,
    activeConn;

$(() => {

    $('#agentForm').on('submit', (e) => {
        e.preventDefault();

        // log('Requesting Capability Token...');
        $.getJSON('/token', {
            agentName: $('#agentName').val(),
        })
            .done((data) => {
                console.log('TOKEN ACQUIRED');
                console.log(data.identity);

                $('#agent-name').text(data.identity);

                Twilio.Device.setup(data.token, { debug: true });

                Twilio.Device.ready(function (device) {
                    console.log('READY');
                });

                Twilio.Device.error(function (error) {
                    console.log('Twilio.Device Error: ' + error.message);
                    activeConn = null;
                });

                Twilio.Device.connect(function (conn) {
                    console.log('Successfully established call!');

                    activeConn = conn;

                    let acceptButton = $('#accept');
                    acceptButton.prop('disabled', false);
                    acceptButton.text('Clear');
                    acceptButton.removeClass('btn-success');
                    acceptButton.addClass('btn-danger');
                });

                Twilio.Device.disconnect(function (conn) {
                    console.log('Call ended.');

                    activeConn = null;

                    let acceptButton = $('#accept');
                    acceptButton.prop('disabled', true);
                    acceptButton.text('Accept');
                    acceptButton.addClass('btn-success');
                    acceptButton.removeClass('btn-danger');
                });

                Twilio.Device.incoming(function (conn) {
                    console.log('Incoming connection from ' + conn.parameters.From);

                    // show alert/ringer
                    document.getElementById('ringer').innerHTML = 'incoming cal from conn.parameters.From';

                    if (activeConn) {
                        conn.reject();
                        console.log('already on call; rejecting call')
                        return;
                    }

                    acceptButton.prop('disabled', false);
                    conn.accept();
                });

            })
            .fail(function (error) {
                alert(JSON.stringify(error));
            });
    });

});
