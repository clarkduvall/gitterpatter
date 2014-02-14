import requests

from flask import Flask
from flask import render_template

app = Flask(__name__, static_url_path='', static_folder='static')


@app.route('/callback')
def callback():
    return request.args.get('code', '')


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def index(path):
    return render_template('index.html')
