from itertools import combinations

N = int(input("Enter N: "))

def next_term(x):
    digits = sorted(set(str(x)))                  # distinct digits
    return sum(int(a) * int(b) for a, b in combinations(digits, 2))

total = N
cur = N
while cur >= 10:                                  # stop at a single digit
    cur = next_term(cur)
    total += cur

print(f"Total sum of sequence: {total}")
