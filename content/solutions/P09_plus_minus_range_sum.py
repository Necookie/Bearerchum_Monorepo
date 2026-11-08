A = int(input("Enter start: "))
B = int(input("Enter end: "))

total = 0
sign = 1                      # +1 for the 1st, 3rd, 5th... number
for x in range(A, B + 1):
    total += sign * x
    sign = -sign              # flip every step

print(f"Alternating sum: {total}")
