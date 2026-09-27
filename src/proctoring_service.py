import joblib
import numpy as np
from scipy.sparse import hstack, csr_matrix

# --- Kupakia modeli na vectorizers mara MOJA tu wakati service inapoanza ---
model = joblib.load('../models/random_forest_model.pkl')
ohe = joblib.load('../models/onehot_encoder.pkl')
tfidf_prompt = joblib.load('../models/tfidf_prompt.pkl')
tfidf_response = joblib.load('../models/tfidf_response.pkl')

# Wastani wa "kawaida" kwa maelezo (hesabu hizi kutoka train_df yako, weka hapa moja kwa moja)
GAZE_MEAN = 20.0
OFFSCREEN_MEAN = 3.3
RESPONSE_MEAN = 52.5


def predict_and_explain(academic_field, user_specialization, 
                          targeted_user_prompt, humanlike_ai_response,
                          gaze_deviation_deg, off_screen_time_sec, response_time_sec):
    """
    Inapokea data ya interview moja iliyokamilika, inarudisha uamuzi wa 
    udanganyifu pamoja na maelezo ya kulinganisha na wastani.
    """
    # 1. Badilisha category kuwa namba (encoding ile ile ya training)
    cat_encoded = ohe.transform([[academic_field, user_specialization]])
    
    # 2. Badilisha maandishi kuwa namba (TF-IDF ile ile ya training)
    prompt_tfidf = tfidf_prompt.transform([targeted_user_prompt])
    response_tfidf = tfidf_response.transform([humanlike_ai_response])
    
    # 3. Namba za tabia
    numeric = np.array([[gaze_deviation_deg, off_screen_time_sec, response_time_sec]])
    
    # 4. Unganisha ZOTE kwa mpangilio ULE ULE uliotumika wakati wa training
    X_new = hstack([cat_encoded, prompt_tfidf, response_tfidf, csr_matrix(numeric)])
    
    # 5. Tabiri
    prediction = model.predict(X_new)[0]
    proba = model.predict_proba(X_new)[0]
    confidence = float(proba.max())
    
    # 6. Jenga maelezo
    explanation = {
        "gaze_deviation_deg": {"value": gaze_deviation_deg, "average": GAZE_MEAN},
        "off_screen_time_sec": {"value": off_screen_time_sec, "average": OFFSCREEN_MEAN},
        "response_time_sec": {"value": response_time_sec, "average": RESPONSE_MEAN}
    }
    
    return {
        "prediction": prediction,
        "confidence": confidence,
        "explanation": explanation
    }



# --- Sehemu ya kujaribu (test) faili hili peke yake ---
if __name__ == "__main__":
    result = predict_and_explain(
        academic_field="Engineering",
        user_specialization="Software Engineering",
        targeted_user_prompt="Can you break down SQL vs NoSQL for me?",
        humanlike_ai_response="SQL uses structured tables, while NoSQL is flexible.",
        gaze_deviation_deg=35.0,
        off_screen_time_sec=7.5,
        response_time_sec=95.0
    )
    print(result)    