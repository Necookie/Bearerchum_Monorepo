lamps = input("Enter lamps: ").strip()
n = len(lamps)
best = 0

for i in range(n):
    if lamps[i] == '0':                 # try repairing THIS broken lamp
        left = 0
        j = i - 1
        while j >= 0 and lamps[j] == '1':   # count lit lamps to the left
            left += 1
            j -= 1
        right = 0
        j = i + 1
        while j < n and lamps[j] == '1':    # count lit lamps to the right
            right += 1
            j += 1
        best = max(best, left + 1 + right)

print(f"Longest lit stretch: {best}")
