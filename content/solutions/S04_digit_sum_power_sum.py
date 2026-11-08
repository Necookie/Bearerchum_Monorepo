N = int(input("Enter N: "))

total = 0
for i in range(1, N + 1):
    digits = str(i)
    S = sum(int(d) for d in digits)   # digit sum
    D = len(digits)                   # digit count
    total += S ** D

print(f"Total sum: {total}")
