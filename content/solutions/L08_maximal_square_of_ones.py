N, M = map(int, input("Enter rows and cols: ").split())
print("Enter the matrix:")
grid = [list(map(int, input().split())) for _ in range(N)]

# dp[i][j] = side of the biggest all-1 square whose BOTTOM-RIGHT corner is (i, j)
dp = [[0] * M for _ in range(N)]
best = 0
for i in range(N):
    for j in range(M):
        if grid[i][j] == 1:
            if i == 0 or j == 0:
                dp[i][j] = 1
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
            best = max(best, dp[i][j])

print(f"Largest square side: {best}")
