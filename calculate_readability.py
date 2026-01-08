import ssl
import nltk
import textstat

# Fix SSL issue for NLTK download
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# Download necessary NLTK data
try:
    nltk.data.find('corpora/cmudict')
except LookupError:
    nltk.download('cmudict')

try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
    nltk.download('punkt_tab')

def calculate_scores(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        test_data = f.read()

    print(f"Flesch Reading Ease: {textstat.flesch_reading_ease(test_data)}")
    print(f"Flesch-Kincaid Grade: {textstat.flesch_kincaid_grade(test_data)}")
    print(f"SMOG Index: {textstat.smog_index(test_data)}")
    print(f"Coleman-Liau Index: {textstat.coleman_liau_index(test_data)}")
    print(f"Automated Readability Index: {textstat.automated_readability_index(test_data)}")
    print(f"Dale-Chall Readability Score: {textstat.dale_chall_readability_score(test_data)}")
    print(f"Difficult Words: {textstat.difficult_words(test_data)}")
    print(f"Linsear Write Formula: {textstat.linsear_write_formula(test_data)}")
    print(f"Gunning Fog: {textstat.gunning_fog(test_data)}")
    print(f"Text Standard: {textstat.text_standard(test_data)}")
    print(f"Fernandez Huerta: {textstat.fernandez_huerta(test_data)}")
    print(f"Szigriszt Pazos: {textstat.szigriszt_pazos(test_data)}")
    print(f"Gutierrez Polini: {textstat.gutierrez_polini(test_data)}")
    print(f"Crawford: {textstat.crawford(test_data)}")
    print(f"Gulpease Index: {textstat.gulpease_index(test_data)}")
    print(f"Osman: {textstat.osman(test_data)}")

if __name__ == "__main__":
    calculate_scores("feedback_content.txt")