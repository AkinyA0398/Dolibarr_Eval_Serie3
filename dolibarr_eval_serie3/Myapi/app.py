from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATABASE_NAME = "dolibarr.db"

def init_db():
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()
    
    # Création de la table des jours fériés
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS jours_feries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titre TEXT NOT NULL,
            date_ferie TEXT NOT NULL UNIQUE
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialisation de la base au démarrage de l'application
init_db()


# --- ROUTE DE PURGE INTERNE SÉCURISÉE ---

@app.route('/api/reset-database', methods=['POST'])
def reset_database():
    try:
        conn = sqlite3.connect(DATABASE_NAME)
        cursor = conn.cursor()
        
        # On vide le contenu sans supprimer la table elle-même
        cursor.execute("DELETE FROM jours_feries")
        
        # Réinitialisation des compteurs d'auto-incrémentation (ID)
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='jours_feries'")
        
        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "message": "Table SQLite locale purgée avec succès."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- ROUTES API POUR LES JOURS FÉRIÉS ---

@app.route('/api/jours-feries', methods=['GET'])
def get_jours_feries():
    try:
        conn = sqlite3.connect(DATABASE_NAME)
        conn.row_factory = sqlite3.Row 
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM jours_feries ORDER BY date_ferie ASC")
        rows = cursor.fetchall()
        conn.close()
        
        jours = [dict(row) for row in rows]
        return jsonify(jours), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/jours-feries', methods=['POST'])
def add_jour_ferie():
    data = request.json
    titre = data.get('titre')
    date_ferie = data.get('date_ferie')

    if not titre or not date_ferie:
        return jsonify({"error": "Le titre et la date sont obligatoires."}), 400

    try:
        conn = sqlite3.connect(DATABASE_NAME)
        cursor = conn.cursor()
        
        cursor.execute(
            "INSERT INTO jours_feries (titre, date_ferie) VALUES (?, ?)",
            (titre, date_ferie)
        )
        
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        
        return jsonify({
            "message": "Jour férié ajouté avec succès !",
            "id": new_id,
            "titre": titre,
            "date_ferie": date_ferie
        }), 201
        
    except sqlite3.IntegrityError:
        return jsonify({"error": "Cette date est déjà enregistrée comme jour férié."}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)