# Getting Started with Assignment 3 Project

# Prerequisites
Install these on a fresh Windows PC first.
 
| Tool | Version | Download |
|---|---|---|
| Python | 3.11 or newer (developed on 3.14) | https://www.python.org/downloads/ (tick **Add python.exe to PATH** in the installer) |
| Node.js (includes npm) | 18 or newer (LTS recommended) | https://nodejs.org/ |


## Install project dependencies
```
npm install
```

## Install python dependencies
```
pip install -r requirements.txt
```
## 

# Starting the application
To start the application, follow these steps:

## 1.Create Model
First open a terminal in the project root folder, and create the model for testing if `phishing_model.joblib` does not exist in the backend folder. This does require the dataset malicious_phish_updated.csv to be in the backend folder. 
```
python backend/model.py       # trains the model for quick use in the application
```
## 2.Create users
If `users.db` does not exist, run this:

```
python backend/create_users.py  
```

This will create a database of users and associated passwords. This is purely for testing purposes. More users can be added by adding the following code to create_users.py:
```
create_user("username", "password")
```
The credentials listed in this code can be used to login.
## 3.Start Backend Server
Start the back end server by running:
```
python backend/main.py
``` 
## 4.Start Front End
Start the Front end React App using by opening a new terminal, and use the command:
```
npm start
```
If all steps were completed correctly, the front end React app should start and be immeditaely connected to the backend.

## Notes
- Ports 3000 and 8000 must be open for the React app and server to work.

## Threat Model

Who would want to attack our application?

Phishers, who can also use this tool to gauge not only if Humans can misinterpret
their URL, but also if the AI, trained on millions of different links, both phishing　
or benign can spot it.

What are phihsers trying to achieve?

If someone opens a phishing URL in their browser, which can often be identical to the
real thing can lead people to unknowingly spread their private information, such as passwords and more likely, bank details. more sophisticated phishing URL's can take
your information as soon as you enter their page, not needing the user to enter their
own details themselves.

What can phishers actually do?

As stated previously, phishers can take other people's information and use it to log into their personal accounts, most likely being sold to other malicious actors, who
use these accounts to run seperate scams. (Such as the Mr. Beast scam).

## Chosen defences:
The application has been developed with certain security features for demonstration. The two security risks chosen were Missing Rate Limiter, and SQL injection. The rate limiter is shown in main.py, and the SQL injection demo can be switched on or off in login_form.jsx, at line 24. See the comments in the code for more. It also has an .env that toggles the availability of the SQL injection demo, as a kind of saftey. This must be set to 

## Retraining and checking the URL model

From the `backend` folder, retrain and save the model with:

```powershell
python model.py
```

The model normalizes host-only URLs by adding a `/` to the root path. This is applied to
training rows and incoming predictions, so inputs such as `google.com` and
`google.com/` use the same feature representation.

After training, the script prints a small reference URL smoke test, including benign
homepage examples and phishing-like examples using the reserved `.example` domain.
These examples are useful for catching basic regressions, but are not a substitute for
a representative, independently labeled test set. The existing accuracy, precision,
recall, F1, and ROC AUC scores are measured on the dataset's 20% test split.

After retraining, restart the API with `python main.py` so it loads the newly saved model.

## Gen AI useage disclaimer
Gen AI was not used to generate the code for this project. 
Gen AI was used for bug identifying, assisting with troubleshooting and providing guides when needed.

## References 
The following are the references used during the development of the project:
```
- https://www.geeksforgeeks.org/computer-networks/maximum-length-of-a-url-in-different-browsers/
- Used to justify the maximum size of URL to be accepted by the system. 
```
