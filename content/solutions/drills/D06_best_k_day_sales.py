N, K = map(int, input("Enter N and K: ").split())
sales = list(map(int, input("Enter sales: ").split()))

window = sum(sales[:K])          # first window
best = window
for i in range(K, N):
    window += sales[i] - sales[i - K]   # slide: add new day, drop oldest day
    best = max(best, window)

print(f"Best total: {best}")
