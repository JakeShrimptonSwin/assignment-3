# Getting Started with Assignment 3 Project

Install these on a fresh Windows PC first.
 
| Tool | Version | Download |
|---|---|---|
| Python | 3.11 or newer (developed on 3.14) | https://www.python.org/downloads/ (tick **Add python.exe to PATH** in the installer) |
| Node.js (includes npm) | 18 or newer (LTS recommended) | https://nodejs.org/ |
| Git | any recent version | https://git-scm.com/downloads |


## If npm is not installed
(MACOS)
```
brew install npm
``` 

## Install project dependencies
```
npm install
```

## Install python dependencies
```
pip install -r requirements.txt
```

# Starting the application
To start the application, follow these steps:

First, Create the model for testing if `phishing_model.joblib` does not exist in the backend folder. 
```
python model.py       # trains the model for quick use in the application
```
# Create users
If `users.db` does not exist, run this:


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

## Retraining and checking the URL model

From the `backend` folder, retrain and save the model with:

```powershell
py model.py
```

The model normalizes host-only URLs by adding a `/` to the root path. This is applied to
training rows and incoming predictions, so inputs such as `google.com` and
`google.com/` use the same feature representation.

After training, the script prints a small reference URL smoke test, including benign
homepage examples and phishing-like examples using the reserved `.example` domain.
These examples are useful for catching basic regressions, but are not a substitute for
a representative, independently labeled test set. The existing accuracy, precision,
recall, F1, and ROC AUC scores are measured on the dataset's 20% test split.

After retraining, restart the API with `py main.py` so it loads the newly saved model.