import os

import requests

from flask import Flask
from flask import redirect
from flask import render_template
from flask import request
from flask import session
from flask import url_for

app = Flask(__name__, static_url_path='/s', static_folder='static')
app.secret_key = os.environ['FLASK_SECRET']

ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token'
GITHUB_CLIENT_ID = os.environ['GITHUB_CLIENT_ID']
GITHUB_CLIENT_SECRET = os.environ['GITHUB_CLIENT_SECRET']


def https_url_for(*args, **kwargs):
    kwargs['_scheme'] = 'https'
    kwargs['_external'] = True
    return url_for(*args, **kwargs)


@app.route('/callback')
def callback():
    response = requests.post(ACCESS_TOKEN_URL, params={
        'client_id': GITHUB_CLIENT_ID,
        'client_secret': GITHUB_CLIENT_SECRET,
        'code': request.args.get('code', '')
    }, headers={'Accept': 'application/json'})

    if response.ok:
        session['access_token'] =  response.json()['access_token']

    return redirect(https_url_for('.index'))


@app.route('/logout')
def logout():
    session.clear()
    return redirect(https_url_for('.index'))


@app.route('/')
@app.route('/<path:path>')
def index(path=None):
    return render_template('index.html', token=session.get('access_token', ''))
