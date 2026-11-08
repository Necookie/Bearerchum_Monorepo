n = int(input("Enter a number: "))

while n >= 10:
    n = sum(int(d) for d in str(n))

# O(1) formula: root = 0 if n == 0 else 1 + (n - 1) % 9
print(f"Digital Root: {n}")
