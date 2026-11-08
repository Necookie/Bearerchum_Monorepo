sentence = input("Enter sentence: ")
longest = max(len(word) for word in sentence.split())
print(f"Longest word length: {longest}")
