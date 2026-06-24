from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS
app = Flask(__name__)
CORS(app)

# Fonction pour initialiser la base et ajouter la colonne si elle n'existe pas
def init_db():
    conn = sqlite3.connect("dolibarr.db")
    cursor = conn.cursor()

# @app.route('/api/products')
# def get_products():
#     conn = sqlite3.connect("dolibarr.db")
#     cursor = conn.cursor()
#     cursor.execute("SELECT * FROM products")
#     products = cursor.fetchall()
#     return jsonify(products)
