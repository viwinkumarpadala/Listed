# Listed-Assignment-ViwinKumarPadala

## Install the dependencies:
npm install

## Sign in with google route:
http://localhost:3000/auth/google

## Technologies used:
NodeJs, ExpressJs, dotenv, googleapis, OAuth2.0, RESTful APIs

## Areas where code can be improved:

1) Creating multiple message templates and selecting them based on the importance of senders.

2) Create multiple labels, and categorize the emails based on the senders.

## Working:

1) Signin with google authentication.

2) Once authenticated, your logged in Gmail will be providing a AutoReply feature.

## Points to be considered:

1) The app will check for new emails in a given Gmail ID.

2) The app will not be sending replies to Emails that have no prior replies.

3) The app will add a Label (viwinsapp in this case, you can customize it) to the email and move the email to the label.

4) The app will repeat this sequence of steps 1-3 in random intervals of 45 to 120 seconds using set interval.

5) If the specified Label doesn.t exist, then the applicaion will create one, and then move the email from inbox to that label.

6) Get credentials from your google account and then use them in your dotenv file.

# Thank You
