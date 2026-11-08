N = int(input("Enter N: "))
temps = list(map(int, input("Enter the temperatures: ").split()))

warmer = 0
for i in range(1, N):
    if temps[i] > temps[i - 1]:      # strictly higher than the day before
        warmer += 1

# Pythonic: warmer = sum(1 for a, b in zip(temps, temps[1:]) if b > a)
print(f"Warmer days: {warmer}")
