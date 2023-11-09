
const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const express = require('express');
require('dotenv').config();
const app = express(); 

//Get the details required from .env file
const client_id = process.env.client_id;
const client_secret = process.env.client_secret;
const redirect_uri = process.env.redirect_uri;

//Using port number 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});

//Setting random intervals in between 45 second to 120 seconds
const INTERVAL = Math.random() * (120 - 45) + 45;

//Accesstoken, which the google api will be providing us after logging in
let accessToken;


//The main function
const checkAndRespondToEmails = async () => {
    //Check if accesstoken exists or not, and if not exists means the user is not logged in
    if (!accessToken) {
        console.error('Access token is not set. Please login using Google OAuth');
        return;
    }

    //using oauthclient
    const oAuth2Client = new OAuth2({
        clientId: client_id,
        clientSecret: client_secret,
        redirectUri: redirect_uri,
    });

    oAuth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    //Getting all the threads in the inbox
    const listThreadsRequest = {
        userId: 'me',
        labelIds: ['INBOX'],
    };

    const listThreadsResponse = await gmail.users.threads.list(listThreadsRequest);
    // console.log(listThreadsResponse.data);
    const threads = listThreadsResponse.data.threads;
    console.log(threads);

    //Processing each thread in the inbox
    if(threads){
        for (const thread of threads) {
            const threadId = thread.id;

            const getThreadRequest = {
                userId: 'me',
                id: threadId,
            };

            const getThreadResponse = await gmail.users.threads.get(getThreadRequest);
            // console.log(getThreadResponse.data);
            const messages = getThreadResponse.data.messages;

            //if the number of messages>0 we will be processing the data further
            if (messages.length > 0) {
                console.log('Entered this block')
                console.log(messages);

                //Get the latest message in the thread, for sending messages to only them which didn't have any prior replies
                const firstMessage = messages[messages.length - 1];

                const payload = firstMessage.payload;
                const headers = payload.headers;
                let fromAddress = headers.find((header) => header.name === 'From').value.trim();
                let toAddress = headers.find((header) => header.name === 'To').value.trim();
                console.log(fromAddress);
                console.log(toAddress);

                //Extract the from address, to address from the payload headers
                fromAddress = fromAddress.match(/<([^>]+)>/);

                // toAddress = toAddress.match(/<([^>]+)>/);
                console.log(fromAddress);
                console.log(toAddress);


                //If both are not null then we will be sending a reply
                if (fromAddress != null && toAddress != null) {
                    fromAddress = fromAddress[1];
                    // toAddress = toAddress[1];

                    console.log(`From: ${fromAddress}`);
                    console.log(`To: ${toAddress}`);

                    console.log(firstMessage);

                    const replyMessage = {
                        to: fromAddress,
                        subject: `Re: Automated reply`,
                        text: `Heyy I am viwin's app, and This is an automated reply. I am on a vacation, so I will catch up with you soon!`,
                    };

                    // Construct the email message in RFC 5322 format
                    const message = [
                        `To: ${replyMessage.to}`,
                        `Subject: ${replyMessage.subject}`,
                        `Content-Type: text/plain; charset="UTF-8"`,
                        '',
                        replyMessage.text,
                    ].join('\r\n');

                    //Create a send message request
                    const sendMessageRequest = {
                        userId: 'me',
                        resource: {
                            raw: Buffer.from(message).toString('base64'),
                        },
                    };

                    //Send message using googleapi
                    await gmail.users.messages.send(sendMessageRequest);

                    console.log('email sent!!');
                    console.log(`Thread:${firstMessage}`);

                    // List all labels
                    const listLabelsRequest = {
                        userId: 'me',
                    };

                    const listLabelsResponse = await gmail.users.labels.list(listLabelsRequest);

                    // Find the 'viwinsapp' label if it exists, and get the ids of the labels unread,inbox
                    const existingLabel = listLabelsResponse.data.labels.find(label => label.name === 'viwinsapp');
                    const existingLabel2 = listLabelsResponse.data.labels.find(label => label.name === 'UNREAD');
                    const existingLabel3 = listLabelsResponse.data.labels.find(label => label.name === 'INBOX');

                    let labelId;
                    if (existingLabel) {
                        labelId = existingLabel.id;
                    } else {
                        // If the label doesn't exist, create it
                        const createLabelRequest = {
                            userId: 'me',
                            resource: {
                                name: 'viwinsapp',
                                labelListVisibility: 'labelShow',
                                messageListVisibility: 'show',
                            },
                        };

                        const createLabelResponse = await gmail.users.labels.create(createLabelRequest);

                        // Get the label ID
                        labelId = createLabelResponse.data.id;
                        console.log(labelId);
                    }

                    // Apply the label to the thread
                    const addLabelRequest = {
                        userId: 'me',
                        id: threadId,
                        resource: {
                            addLabelIds: [labelId],
                            removeLabelIds: [existingLabel2.id, existingLabel3.id],
                        },
                    };

                    await gmail.users.threads.modify(addLabelRequest);


                }



            }
        }
    }
    else{
    console.log("No emails in your inbox");
    }
    

};


//Use oAuth and get authenticated using google
app.get('/auth/google', async (req, res) => { 
    const oAuth2Client = new OAuth2({
        clientId: client_id,
        clientSecret: client_secret,
        redirectUri: redirect_uri,
    });
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
            'https://mail.google.com/', 
            'https://www.googleapis.com/auth/gmail.modify', 
            'https://www.googleapis.com/auth/gmail.labels',
        ],
    });

    res.redirect(authUrl);
});

//After getting authenticated, get the access token and store it
app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    const oAuth2Client = new OAuth2({
        clientId: client_id,
        clientSecret: client_secret,
        redirectUri: redirect_uri,
    });

    const { tokens } = await oAuth2Client.getToken(code);
    accessToken = tokens.access_token;
    console.log("Succsessfully logged in!!");
    res.send('Successfully logged in!');
});

//Running the function in random intervals between 45-120 seconds
setInterval(() => {
    checkAndRespondToEmails();
}, INTERVAL * 1000);


//The libraries and technologies used: NodeJs, ExpressJs, dotenv, googleapis, OAuth2.0, RESTful APIs

//Areas where code can be improved:
//1) Creating multiple message templates and selecting them based on the importance of senders.
//2) Create multiple labels, and categorize the emails based on the senders.