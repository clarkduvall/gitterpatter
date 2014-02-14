import os
from flask import Flask

app = Flask(__name__, static_url_path='/static', static_folder='static')

@app.route('/')
def hello():
    return 'Hello World!'
