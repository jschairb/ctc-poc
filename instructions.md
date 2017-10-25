# want this script

main:
  request cb
  call agent
  fork @customer
  whisper
  joinconf

customer:
  call cusomter
  whisper
  joinconf

# can translate to

main:
  request cb | task-reservation-cb
  | req1 = wait for task-reservation-cb
  call agent | reply to req1; established-cb; cleared-cb
  fork @ customer | make new stack; copy vars; run proc ref
  | req2 = wait for established-cb
  whisper + joinconf | reply to req2;
  | wait for cleared-cb

customer:
  call customer | established-cb
  | req3 = wait for established-cb
  whisper + joinconf | reply to req3


# other notes

customer asks for callback:
    extract (customerNumber, details) from req
    save CallBackRequest(customerNumber, details) in DB
    create Task(customerNumber, details) in TW

twilio notifies task assignment:
    extract (taskSid, customerNumber, details) from req
    instruct call reserved agent in TW

twilio notifies agent answer:
    

    create call to customer in TW
    save customer call sid

twilio notifies customer answer:
    bridge call to conf(taskSid) in TW

--------------


agent 1 xfer to agent 2:
    on call in TW via above
    callSid from customer
