N = int(input("Enter array size: "))
K = int(input("Enter shift amount K: "))
D = input("Enter shift direction (L/R): ").strip().upper()
A = list(map(int, input("Enter array elements: ").split()))

K %= N                       # shifting N times = no change
if D == 'L':
    result = A[K:] + A[:K]
else:                        # right shift by K = left shift by N-K
    result = A[N - K:] + A[:N - K]

print("Shifted array:", *result)
