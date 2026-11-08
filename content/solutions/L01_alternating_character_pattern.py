s = input("Enter string: ")
VOWELS = "aeiou"

letters = [ch.lower() for ch in s if ch.isalpha()]   # ignore non-letters

ok = True
for i in range(1, len(letters)):
    prev_is_vowel = letters[i - 1] in VOWELS
    curr_is_vowel = letters[i] in VOWELS
    if prev_is_vowel == curr_is_vowel:     # two vowels or two consonants in a row
        ok = False
        break

print("Result: Alternating" if ok else "Result: Not Alternating")
