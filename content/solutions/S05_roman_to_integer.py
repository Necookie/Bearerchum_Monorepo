s = input("Enter Roman numeral: ").strip().upper()
VAL = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}

total = 0
for i in range(len(s)):
    # smaller symbol BEFORE a bigger one -> subtract (IV, IX, XL, XC, CD, CM)
    if i + 1 < len(s) and VAL[s[i]] < VAL[s[i + 1]]:
        total -= VAL[s[i]]
    else:
        total += VAL[s[i]]

print(f"Integer value: {total}")
