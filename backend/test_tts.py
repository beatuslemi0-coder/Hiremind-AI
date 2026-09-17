
# Test hii inajaribu kama Gemini anaweza kutengeneza sauti ya Kiswahili.
from app.services.tts_service import TTSService


# Text ambayo AI interviewer atasema.
text = "Karibu kwenye interview ya HIREMIND-AI. Tafadhali jitambulishe."


# Tunatengeneza audio file.
output = TTSService.generate_swahili_speech(
    text=text,
    output_path="uploads/audio/test_interviewer.wav"
)


# Tunaonyesha location ya audio.
print("Audio generated successfully:")
print(output)
