N = int(input("Enter N: "))
a = list(map(int, input("Enter numbers: ").split()))
Q = int(input("Enter Q: "))

# prefix[i] = sum of the first i numbers  ->  sum(a[L..R]) = prefix[R] - prefix[L-1]
prefix = [0] * (N + 1)
for i in range(N):
    prefix[i + 1] = prefix[i] + a[i]

print("Enter queries:")
for _ in range(Q):
    L, R = map(int, input().split())
    print(f"Sum: {prefix[R] - prefix[L - 1]}")
