document.addEventListener('DOMContentLoaded', function() {
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#individual-email-view').style.display = 'none';

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function send_email() {
  event.preventDefault();
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => console.log(`Email "SEND" request - ${response.status}`))
  load_mailbox('sent');
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#individual-email-view').style.display = 'none';
  // document.querySelectorAll("button").forEach(button => button.classList.remove("selected"));
  // document.querySelector(`#${mailbox}`).classList.add("selected");

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  // document.querySelector('#emails-view').className = `${mailbox}`;

  // Update mailbox with most recent emails:
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        const sections_to_show = [['sender', 5], ['subject', 3], ['timestamp', 4]];
        const table_heading = {'sender': 'From:', 'subject': 'Subject:', 'timestamp': 'Date and time:',
            'read': true};
        emails = [table_heading, ...emails];
        emails.forEach(email => {
            const row_div_element = document.createElement('div');
            row_div_element.classList.add("row","email-line-box", email["read"] ? "read" : "unread");
            if (email === table_heading) {row_div_element.id = 'titled-first-row';}
            sections_to_show.forEach(
                section => {
                    const section_name = section[0];
                    const section_size = section[1];
                    const div_section = document.createElement('div');
                    div_section.classList.add(`col-${section_size}`, `${section_name}-section`);
                    div_section.innerHTML = `<p>${email[section_name]}</p>`;
                    row_div_element.append(div_section);

                            });
            if (email !== table_heading) {
                row_div_element.addEventListener('click', () => load_email(email["id"], mailbox));
            }

            document.querySelector('#emails-view').append(row_div_element);



        })

    })
}

function load_email(email_id) {

  // Show email view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#individual-email-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  document.querySelector('#individual-email-view').innerHTML = '';

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    //Create a div to nest the email within
    const show_email = document.createElement('div');
    show_email.className = 'email';
    
    const sender = document.createElement('div');
    sender.innerHTML = `<strong>From:</strong> ${email.sender}`;
    const recipients = document.createElement('div');
    let recips = "<strong>To:</strong> ";
    email.recipients.forEach(recipient => {
      recips += `${recipient}, `;
    })
    recipients.innerHTML = recips.substring(0, recips.length - 2);
    const subject = document.createElement('div');
    subject.innerHTML = `<strong>Subject:</strong> ${email.subject}`;
    subject.id = 'IDID'
    const timestamp = document.createElement('div')
    timestamp.innerHTML = `<strong>Timestamp:</strong> ${email.timestamp}`;
    const reply = document.createElement('button');
    reply.className = 'btn btn-sm btn-outline-primary';
    reply.innerHTML = 'Reply';
    reply.addEventListener('click', () => reply_email(email.sender, email.subject, email.body, email.timestamp))
    const archive = document.createElement('button');
    archive.className = 'btn btn-sm btn-outline-primary ml-1';
    if (email.archived === false) {
      archive.innerHTML = 'Archive';
      archive.addEventListener('click', () => archive_email(email.id));
    } else {
      archive.innerHTML = 'Unarchive';
      archive.addEventListener('click', () => unarchive_email(email.id));
    }
    const body = document.createElement('div');
    body.innerHTML = `${email.body}`;

    show_email.append(sender);
    show_email.append(recipients);
    show_email.append(subject);
    show_email.append(timestamp);
    show_email.append(reply);
    show_email.append(archive);
    show_email.append(document.createElement('hr'));
    show_email.append(body);

    document.querySelector('#individual-email-view').append(show_email);
  })
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
  .then(response => console.log(`Email 'READ' request: ${response.status}`))
}

function archive_email(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: true
    })
  })
  .then( () => load_mailbox("inbox"));
}

function unarchive_email(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  })
  .then( () => load_mailbox("inbox"));
}

function reply_email(recipient, subject, body, timestamp) {
  compose_email();
  document.querySelector('#compose-recipients').value = `${recipient}`;
  if (subject.substring(0,2) != 'RE') {
    document.querySelector('#compose-subject').value = `RE: ${subject}`;
  } else {
    document.querySelector('#compose-subject').value = `${subject}`;
  }
  document.querySelector('#compose-body').value = `${timestamp} ${recipient}:
${body}
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
`;
}