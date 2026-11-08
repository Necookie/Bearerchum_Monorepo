from collections import Counter

words = input("Enter sentence: ").lower().split()
cnt = Counter(words)

# highest count first; ties -> alphabetically first word
word, freq = min(cnt.items(), key=lambda kv: (-kv[1], kv[0]))

print(f"Most frequent: {word} ({freq})")
