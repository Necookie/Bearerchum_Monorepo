N = int(input("Enter array size: "))
arr = list(map(int, input("Enter the array elements: ").split()))

# There are N*(N+1)/2 subarrays, so the answer can never be bigger than that + 1.
LIMIT = N * (N + 1) // 2 + 1

sums = set()
for i in range(N):
    s = 0
    for j in range(i, N):
        s += arr[j]
        if s > LIMIT:          # all numbers are positive -> sums only grow -> stop
            break
        sums.add(s)

ans = 1
while ans in sums:
    ans += 1

print(f"Smallest Missing Sum: {ans}")
