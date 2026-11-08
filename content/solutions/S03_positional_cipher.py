s = input("Enter the encoded string: ")
key = int(input("Enter the key: "))

out = []
for i, ch in enumerate(s):
    shift = key + i
    if ch.islower():
        out.append(chr((ord(ch) - ord('a') - shift) % 26 + ord('a')))
    elif ch.isupper():
        out.append(chr((ord(ch) - ord('A') - shift) % 26 + ord('A')))
    else:
        out.append(ch)               # non-letters unchanged

print(f"Decoded string: {''.join(out)}")
