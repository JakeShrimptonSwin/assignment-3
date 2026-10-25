# This file handles the model creation and training
#xgboost 
#PREDICTION
#CONFIDENCE SCORE
#result code such as 200 is complete while 404 is error smth 

import re
import math
import base64
import joblib
import numpy as np
import pandas as pd
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

# This file does two jobs:
#   1. turns a URL into the 40 features the model was trained on (same code as Assignment 2)
#   2. trains / saves / loads the XGBoost model and makes predictions
# Run it once with:  python model.py   (this trains the model and saves it)

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "malicious_phish_updated.csv"
MODEL_PATH = BASE_DIR / "phishing_model.joblib"
RANDOM_STATE = 42

# the exact columns the model was trained on, in training order
FEATURE_COLUMNS = [
    'url_length', 'domain_length', 'letter_count', 'number_count', 'special_count',
    'lowercase_count', 'uppercase_count', 'dot_count', 'equals_count', 'underscore_count',
    'slash_count', 'domain_digit_count', 'has_https', 'has_multiple_https',
    'http_substring_count', 'has_one_drive_ext', 'has_google_drive', 'domain_is_ip',
    'has_at_symbol', 'url_entropy', 'is_suspicious_tld', 'has_suspicious_keyword',
    'suspicious_keyword_count', 'has_non_ascii_domain', 'subdomain_count', 'path_depth',
    'domain_hyphen_count', 'query_param_count', 'longest_domain_word_length',
    'has_extra_double_slash', 'has_base64_string', 'has_www', 'has_port', 'percent_count',
    'letter_ratio', 'number_ratio', 'special_ratio', 'lowercase_ratio', 'uppercase_ratio',
    'domain_url_ratio',
]

SUSPICIOUS_TLDS = {
    'tk', 'ml', 'ga', 'cf', 'gq',   # Freenom's free TLDs
    'xyz', 'top', 'club', 'info', 'work', 'click', 'link', 'loan',
    'download', 'review', 'country', 'stream', 'bid', 'win',
}

SUSPICIOUS_KEYWORDS = ['login', 'verify', 'secure', 'account', 'update', 'confirm', 'banking']


# =====================================================================
# Part 1 - feature extraction (same as feature_extraction.py in Assignment 2)
# NOTE: get_subdomain_count has 'http//' (missing colon) for URLs with no scheme, so
# subdomain_count is 0 for those. Kept on purpose because the model was trained on
# data made that way - fix it in both places and retrain if the team wants it changed.
# =====================================================================
def extract_features(df):

    def get_tld(url):
        try:
            if not url.startswith(('http://', 'https://')):
                url = 'http://' + url
            domain = urlparse(url).netloc
            domain = domain.split(':')[0]
            if '.' not in domain:
                return ''
            return domain.rsplit('.', 1)[-1].lower()
        except (ValueError, AttributeError):
            return ''

    df['tld'] = df['url'].apply(get_tld)
    df['url_length'] = df['url'].str.len().astype(int)

    def get_domain_length(url):
        try:
            if not url.startswith(('http://', 'https://')):
                url = 'http://' + url
            return len(urlparse(url).netloc)
        except (ValueError, AttributeError):
            return 0

    df['domain_length'] = df['url'].apply(get_domain_length)

    df['letter_count'] = df['url'].str.count(r'[a-zA-Z]')
    df['number_count'] = df['url'].str.count(r'\d')
    df['special_count'] = df['url'].str.count(r'[^a-zA-Z0-9]')
    df['lowercase_count'] = df['url'].str.count(r'[a-z]')
    df['uppercase_count'] = df['url'].str.count(r'[A-Z]')
    df['dot_count'] = df['url'].str.count(r'\.')
    df['equals_count'] = df['url'].str.count('=')
    df['underscore_count'] = df['url'].str.count('_')
    df['slash_count'] = df['url'].str.count('/')

    def get_domain_digit_count(url):
        try:
            if not url.startswith(('http://', 'https://')):
                url = 'http://' + url
            domain = urlparse(url).netloc.split(':')[0]
            return sum(c.isdigit() for c in domain)
        except (ValueError, AttributeError):
            return 0

    df['domain_digit_count'] = df['url'].apply(get_domain_digit_count)

    df['has_https'] = df['url'].str.startswith('https://').astype(int)
    df['has_multiple_https'] = df['url'].apply(lambda url: int(url.lower().count('https') > 1))
    df['http_substring_count'] = df['url'].str.lower().str.count('http')

    df['has_one_drive_ext'] = df['url'].str.contains(
        r'onedrive\.live\.com|1drv\.ms|.*-my\.sharepoint\.com', case=False, na=False
    ).astype(int)
    df['has_google_drive'] = df['url'].str.contains(
        r'drive\.google\.com|docs\.google\.com', case=False, na=False, regex=True
    ).astype(int)

    # (?:...) is a non-capturing group - same matches as before, just no pandas warning
    df['domain_is_ip'] = df['url'].str.contains(
        r'^(?:https?://)?(?:\d{1,3}\.){3}\d{1,3}', regex=True, na=False
    ).astype(int)

    df['has_at_symbol'] = df['url'].str.contains('@', na=False).astype(int)

    def calculate_entropy(text):
        if len(text) == 0:
            return 0
        counts = Counter(text)
        length = len(text)
        return -sum((c / length) * math.log2(c / length) for c in counts.values())

    df['url_entropy'] = df['url'].apply(calculate_entropy)

    df['is_suspicious_tld'] = df['tld'].apply(lambda tld: tld in SUSPICIOUS_TLDS).astype(int)
    df['has_suspicious_keyword'] = df['url'].str.contains(
        '|'.join(SUSPICIOUS_KEYWORDS), case=False, na=False, regex=True
    ).astype(int)
    df['suspicious_keyword_count'] = df['url'].str.count(
        '|'.join(SUSPICIOUS_KEYWORDS), flags=re.IGNORECASE
    )

    def has_non_ascii_domain(url):
        try:
            if not url.startswith(('http://', 'https://')):
                url = 'http://' + url
            domain = urlparse(url).netloc.split(':')[0]
            ascii_only = domain.encode('ascii', errors='ignore').decode('ascii')
            return int(len(ascii_only) != len(domain))
        except (ValueError, AttributeError):
            return 0

    df['has_non_ascii_domain'] = df['url'].apply(has_non_ascii_domain)

    def get_subdomain_count(url):
        try:
            if not url.startswith(('http://', 'https://')):
                url = 'http//' + url
            domain = urlparse(url).netloc.split(':')[0]
            parts = domain.split('.')
            # last 2 parts = main domain + TLD; everything before that is a subdomain
            return max(len(parts) - 2, 0)
        except (ValueError, AttributeError):
            return 0

    df['subdomain_count'] = df['url'].apply(get_subdomain_count)

    def get_path_depth(url):
        try:
            if not url.startswith(('http://', 'https://')):
                url = 'http://' + url
            segments = [s for s in urlparse(url).path.split('/') if s != '']
            return len(segments)
        except (ValueError, AttributeError):
            return 0

    df['path_depth'] = df['url'].apply(get_path_depth)

    def get_domain_hyphen_count(url):
        try:
            if not url.startswith(('http://', 'https://')):
                url = 'http://' + url
            return urlparse(url).netloc.split(':')[0].count('-')
        except (ValueError, AttributeError):
            return 0

    df['domain_hyphen_count'] = df['url'].apply(get_domain_hyphen_count)

    def get_query_param_count(url):
        try:
            if not url.startswith(('http://', 'https://')):
                url = 'http://' + url
            query = urlparse(url).query
            if query == '':
                return 0
            return len(query.split('&'))
        except (ValueError, AttributeError):
            return 0

    df['query_param_count'] = df['url'].apply(get_query_param_count)

    def get_longest_domain_word(url):
        try:
            if not url.startswith(('http://', 'https://')):
                url = 'http://' + url
            domain = urlparse(url).netloc.split(':')[0]
            words = [w for w in re.split(r'[^a-zA-Z]', domain) if w != '']
            return max((len(w) for w in words), default=0)
        except (ValueError, AttributeError):
            return 0

    df['longest_domain_word_length'] = df['url'].apply(get_longest_domain_word)

    def has_extra_double_slash(url):
        # strip the URL's own '//' first, so we only check what comes after it
        stripped = re.sub(r'^https?://', '', url, flags=re.IGNORECASE)
        return int('//' in stripped)

    df['has_extra_double_slash'] = df['url'].apply(has_extra_double_slash)

    def has_base64_string(url):
        for match in re.findall(r'[A-Za-z0-9+/]{20,}={0,2}', url):
            try:
                base64.b64decode(match + '==').decode('utf-8')  # only counts if it decodes to readable text
                return 1
            except Exception:
                continue
        return 0

    df['has_base64_string'] = df['url'].apply(has_base64_string)

    def has_www(url):
        try:
            if not url.startswith(('http://', 'https://')):
                url = 'http://' + url
            return int(urlparse(url).netloc.split(':')[0].lower().startswith('www.'))
        except (ValueError, AttributeError):
            return 0

    df['has_www'] = df['url'].apply(has_www)

    def has_port(url):
        try:
            if not url.startswith(('http://', 'https://')):
                url = 'http://' + url
            return int(urlparse(url).port is not None)
        except (ValueError, AttributeError):
            return 0

    df['has_port'] = df['url'].apply(has_port)
    df['percent_count'] = df['url'].str.count('%')

    df['letter_ratio'] = df['letter_count'] / df['url_length']
    df['number_ratio'] = df['number_count'] / df['url_length']
    df['special_ratio'] = df['special_count'] / df['url_length']
    df['lowercase_ratio'] = df['lowercase_count'] / df['url_length']
    df['uppercase_ratio'] = df['uppercase_count'] / df['url_length']
    df['domain_url_ratio'] = df['domain_length'] / df['url_length'].replace(0, 1)

    return df


def url_to_features(url):
    # one URL -> a one-row dataframe with the 40 model features
    return extract_features(pd.DataFrame({'url': [url]}))


# =====================================================================
# Part 2 - the model (label 1 = phishing, label 0 = benign)
# =====================================================================
class PhishingModel:

    def __init__(self, classifier, feature_columns, metadata):
        self.classifier = classifier
        self.feature_columns = feature_columns
        self.metadata = metadata

    @classmethod
    def train(cls, data_path=DATA_PATH, model_path=MODEL_PATH):
        print(f'Loading {data_path} ...')
        df = pd.read_csv(data_path, usecols=['url', 'label'] + FEATURE_COLUMNS)

        X = df[FEATURE_COLUMNS].replace([np.inf, -np.inf], np.nan).fillna(0)
        y = df['label'].astype(int)

        # same split and settings as classification.py in Assignment 2
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
        )

        print(f'Training XGBoost on {len(X_train)} rows ...')
        classifier = XGBClassifier(
            n_estimators=300, max_depth=6, learning_rate=0.1,
            eval_metric='logloss', random_state=RANDOM_STATE, n_jobs=-1,
        )
        classifier.fit(X_train, y_train)

        proba = classifier.predict_proba(X_test)[:, 1]
        pred = (proba >= 0.5).astype(int)
        metrics = {
            'accuracy': round(float(accuracy_score(y_test, pred)), 4),
            'precision': round(float(precision_score(y_test, pred)), 4),
            'recall': round(float(recall_score(y_test, pred)), 4),
            'f1': round(float(f1_score(y_test, pred)), 4),
            'roc_auc': round(float(roc_auc_score(y_test, proba)), 4),
        }
        print('Scores on the 20% test split:', metrics)

        check_feature_match(df)

        metadata = {
            'algorithm': 'XGBoost',
            'trained_at': datetime.now(timezone.utc).isoformat(timespec='seconds'),
            'training_samples': int(len(X_train)),
            'metrics': metrics,
        }
        joblib.dump(
            {'classifier': classifier, 'feature_columns': FEATURE_COLUMNS, 'metadata': metadata},
            model_path,
        )
        print(f'Model saved to {model_path}')
        return cls(classifier, list(FEATURE_COLUMNS), metadata)

    @classmethod
    def load(cls, model_path=MODEL_PATH):
        bundle = joblib.load(model_path)
        return cls(bundle['classifier'], bundle['feature_columns'], bundle['metadata'])

    def predict(self, url):
        features = url_to_features(url)

        # pick columns by name in the training order, so a mismatch fails loudly
        X = features[self.feature_columns].replace([np.inf, -np.inf], np.nan).fillna(0)

        phishing_probability = float(self.classifier.predict_proba(X)[0, 1])
        label = int(phishing_probability >= 0.5)

        return {
            'prediction': 'phishing' if label == 1 else 'benign',
            'label': label,
            'phishing_probability': round(phishing_probability, 4),
            'confidence': round(phishing_probability if label == 1 else 1 - phishing_probability, 4),
        }


def check_feature_match(df, n=200):
    # Re-computes features for some training URLs and compares them with the CSV.
    # If anything differs, the API would feed the model different numbers than it learned from.
    sample = df.sample(n=min(n, len(df)), random_state=RANDOM_STATE)
    mismatches = {}

    for _, row in sample.iterrows():
        fresh = url_to_features(row['url']).iloc[0]
        for col in FEATURE_COLUMNS:
            if not np.isclose(float(fresh[col]), float(row[col]), rtol=1e-6, atol=1e-9, equal_nan=True):
                mismatches[col] = mismatches.get(col, 0) + 1

    if mismatches:
        print(f'WARNING: features differ from the CSV for {mismatches} (out of {len(sample)} URLs)')
    else:
        print(f'Feature check passed: serving features match the CSV on {len(sample)} URLs')
    return mismatches


if __name__ == '__main__':
    PhishingModel.train()