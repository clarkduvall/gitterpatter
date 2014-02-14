import os

import requests

from flask import Flask
from flask import render_template
from flask import request

app = Flask(__name__, static_url_path='', static_folder='static')

ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token'
GITHUB_CLIENT_ID = os.environ['GITHUB_CLIENT_ID']
GITHUB_CLIENT_SECRET = os.environ['GITHUB_CLIENT_SECRET']


@app.route('/callback')
def callback():
    response = requests.post(ACCESS_TOKEN_URL, params={
        'client_id': GITHUB_CLIENT_ID,
        'client_secret': GITHUB_CLIENT_SECRET,
        'code': request.args.get('code', '')
    }, headers={'Accept': 'application/json'})

    return response.content


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def index(path):
    return render_template('index.html')
