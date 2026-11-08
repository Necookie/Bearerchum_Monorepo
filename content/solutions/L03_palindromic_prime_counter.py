L, R = map(int, input("Enter L and R: ").split())

# Sieve of Eratosthenes up to R
is_prime = [True] * (R + 1)
is_prime[0] = False
if R >= 1:
    is_prime[1] = False
for i in range(2, int(R ** 0.5) + 1):
    if is_prime[i]:
        for j in range(i * i, R + 1, i):
            is_prime[j] = False

count = 0
for x in range(L, R + 1):
    if is_prime[x] and str(x) == str(x)[::-1]:
        count += 1

print(f"Count: {count}")
