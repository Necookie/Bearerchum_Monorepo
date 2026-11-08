N = int(input("Enter N: "))
t = list(map(int, input("Enter the temperatures: ").split()))

best = cur = 1
for i in range(1, N):
    if t[i] > t[i - 1]:
        cur += 1            # streak continues
    else:
        cur = 1             # streak broken -> restart at this day
    best = max(best, cur)

print(f"Longest streak: {best}")
