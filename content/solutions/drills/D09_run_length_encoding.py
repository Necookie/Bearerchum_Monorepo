s = input("Enter text: ").strip()

out = []
i = 0
while i < len(s):
    j = i
    while j < len(s) and s[j] == s[i]:   # walk to the end of this run
        j += 1
    out.append(f"{s[i]}{j - i}")
    i = j

print(f"Encoded: {''.join(out)}")
